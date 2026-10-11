import { useEffect, useState, type ComponentType } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Card, Input } from "@ui/components";
import { getAssetType } from "@app/registry/assetRegistry";
import { DuplicateAssetButton } from "@plugins/shared/components/DuplicateAssetButton";
import { deleteAsset, saveAsset } from "@app/db/assetStore";
import { MAGIC_ITEM_TYPE, normalizeMagicItemData, type MagicItemData } from "../schema";
import { useShortcutAction } from "@app/shortcuts/ShortcutProvider";
import { useHistoryState } from "@app/shortcuts/useHistoryState";
import { duplicateAsset } from "@app/db/assetStore";
import { useAutosave, useSaveContext, type SaveReason } from "@app/save/SaveProvider";
import { getAssetTemplate, instantiateAssetTemplate } from "@app/templates/templateCatalog";
import "./MagicItemEditPage.css";

function generateId(): string {
  return crypto.randomUUID();
}

export function MagicItemEditPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const templateId = isNew ? searchParams.get("template") : null;

  const definition = getAssetType(MAGIC_ITEM_TYPE);
  if (!definition) {
    throw new Error("Magic item asset type is not registered.");
  }

  const [assetId] = useState(() => (isNew ? generateId() : (id as string)));
  const [name, setName] = useState(() => {
    if (!templateId) return "";
    const template = getAssetTemplate(templateId);
    if (template?.assetType !== MAGIC_ITEM_TYPE) return "";
    try {
      instantiateAssetTemplate(templateId, MAGIC_ITEM_TYPE);
      return template.defaultAssetName ?? template.name;
    } catch { return ""; }
  });
  const [data, setData, undo, redo] = useHistoryState<MagicItemData>(() => {
    if (!templateId) return definition.createDefaultData() as MagicItemData;
    try { return instantiateAssetTemplate<MagicItemData>(templateId, MAGIC_ITEM_TYPE); }
    catch { return definition.createDefaultData() as MagicItemData; }
  });
  const [templateError] = useState<string | null>(() => {
    if (!templateId) return null;
    try { instantiateAssetTemplate(templateId, MAGIC_ITEM_TYPE); return null; }
    catch (error) { return error instanceof Error ? error.message : "Template could not be loaded."; }
  });
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
          setData(normalizeMagicItemData(JSON.parse(row.data)));
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
    await saveAsset({ id: assetId, type: MAGIC_ITEM_TYPE, name, data });
    return true;
  };
  const handleSave = async (): Promise<void> => {
    if (await saveCurrent("manual")) { notifySaved("manual"); navigate("/magic-items"); }
  };

  const handleDelete = async (): Promise<void> => {
    await deleteAsset(assetId);
    navigate("/magic-items");
  };
  const handleDuplicate = async (): Promise<void> => { if (isNew) return; const duplicate = await duplicateAsset(assetId); navigate(`/magic-items/${duplicate.id}`); };
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
    anchor.download = `${name || "magic-item"}.${exporter.fileExtension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!loaded) return <p>Loading…</p>;

  const Editor = definition.editor as ComponentType<{
    assetId: string | null;
    data: MagicItemData;
    onChange: (data: MagicItemData) => void;
  }>;

  const Preview = definition.preview as ComponentType<{
    name: string;
    data: MagicItemData;
  }>;

  return (
    <div className="magic-item-edit">
      <header className="magic-item-edit__header">
        <h1>{isNew ? "New Magic Item" : "Edit Magic Item"}</h1>
        <div className="magic-item-edit__actions">
          {!isNew && (
            <DuplicateAssetButton assetId={assetId} basePath="/magic-items" />
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
        <Card className="magic-item-edit__errors">
          {errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </Card>
      )}

      {templateError && <Card className="magic-item-edit__errors">Template could not be used: {templateError} A blank magic item has been opened instead.</Card>}

      <label className="magic-item-edit__name-field">
        <span>Name</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" />
      </label>

      <div className="magic-item-edit__layout">
        <Editor assetId={isNew ? null : assetId} data={data} onChange={setData} />
        <div className="magic-item-edit__preview">
          <Preview name={name} data={data} />
        </div>
      </div>
    </div>
  );
}
