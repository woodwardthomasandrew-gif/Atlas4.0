import { useEffect, useState, type ComponentType } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Input } from "@ui/components";
import { getAssetType } from "@app/registry/assetRegistry";
import { DuplicateAssetButton } from "@plugins/shared/components/DuplicateAssetButton";
import { deleteAsset, saveAsset } from "@app/db/assetStore";
import { SPELL_TYPE, normalizeSpellData, type SpellData } from "../schema";
import { useShortcutAction } from "@app/shortcuts/ShortcutProvider";
import { useHistoryState } from "@app/shortcuts/useHistoryState";
import { duplicateAsset } from "@app/db/assetStore";
import { useAutosave, useSaveContext, type SaveReason } from "@app/save/SaveProvider";
import "./SpellEditPage.css";

function generateId(): string {
  return crypto.randomUUID();
}

export function SpellEditPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const definition = getAssetType(SPELL_TYPE);
  if (!definition) {
    throw new Error("Spell asset type is not registered.");
  }

  const [assetId] = useState(() => (isNew ? generateId() : (id as string)));
  const [name, setName] = useState("");
  const [data, setData, undo, redo] = useHistoryState<SpellData>(definition.createDefaultData() as SpellData);
  const [loaded, setLoaded] = useState(isNew);
  const [errors, setErrors] = useState<string[]>([]);
  const { notifySaved } = useSaveContext();

  useEffect(() => {
    if (isNew) return;
    window.atlas.db
      .query("SELECT * FROM assets WHERE id = ?", [assetId])
      .then((rows) => {
        const row = (rows as Array<{ name: string; data: string }>)[0];
        if (row) {
          setName(row.name);
          setData(normalizeSpellData(JSON.parse(row.data)));
        }
        setLoaded(true);
      });
  }, [assetId, isNew]);

  const saveCurrent = async (reason: SaveReason): Promise<boolean> => {
    const result = definition.validate(data);
    if (reason === "manual" && !result.valid) {
      setErrors(result.errors.map((e) => e.message));
      return false;
    }
    if (reason === "manual" && !name.trim()) {
      setErrors(["Name is required."]);
      return false;
    }

    setErrors([]);
    await saveAsset({ id: assetId, type: SPELL_TYPE, name, data });
    return true;
  };
  const handleSave = async (): Promise<void> => {
    if (await saveCurrent("manual")) { notifySaved("manual"); navigate("/spells"); }
  };

  const handleDelete = async (): Promise<void> => {
    await deleteAsset(assetId);
    navigate("/spells");
  };
  const handleDuplicate = async (): Promise<void> => { if (isNew) return; const duplicate = await duplicateAsset(assetId); navigate(`/spells/${duplicate.id}`); };
  useShortcutAction("save", handleSave, loaded);
  useAutosave(saveCurrent, loaded);
  useShortcutAction("duplicate", handleDuplicate, loaded && !isNew);
  useShortcutAction("undo", undo, loaded);
  useShortcutAction("redo", redo, loaded);

  const handleExport = async (exporterId: string): Promise<void> => {
    const exporter = definition.exporters.find((e) => e.id === exporterId);
    if (!exporter) return;
    const output = await exporter.export(data, name);
    const mimeType = exporter.fileExtension === "png" ? "image/png" : "text/plain";
    const blob = new Blob([output as BlobPart], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name || "spell"}.${exporter.fileExtension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!loaded) return <p>Loading…</p>;

  const Editor = definition.editor as ComponentType<{
    assetId: string | null;
    data: SpellData;
    onChange: (data: SpellData) => void;
  }>;

  const Preview = definition.preview as ComponentType<{
    name: string;
    data: SpellData;
  }>;

  return (
    <div className="spell-edit">
      <header className="spell-edit__header">
        <h1>{isNew ? "New Spell" : "Edit Spell"}</h1>
        <div className="spell-edit__actions">
          {!isNew && (
            <DuplicateAssetButton assetId={assetId} basePath="/spells" />
          )}
          {!isNew && (
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          {!isNew &&
            definition.exporters.map((exporter) => (
              <Button key={exporter.id} onClick={() => handleExport(exporter.id)}>
                Export {exporter.label}
              </Button>
            ))}
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </header>

      {errors.length > 0 && (
        <Card className="spell-edit__errors">
          {errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </Card>
      )}

      <label className="spell-edit__name-field">
        <span>Name</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Spell name" />
      </label>

      <div className="spell-edit__layout">
        <Editor assetId={isNew ? null : assetId} data={data} onChange={setData} />
        <div className="spell-edit__preview">
          <Preview name={name} data={data} />
        </div>
      </div>
    </div>
  );
}
