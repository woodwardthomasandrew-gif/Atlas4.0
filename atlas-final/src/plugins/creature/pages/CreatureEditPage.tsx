import { useEffect, useState, type ComponentType } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Input } from "@ui/components";
import { getAssetType } from "@app/registry/assetRegistry";
import { DuplicateAssetButton } from "@plugins/shared/components/DuplicateAssetButton";
import { deleteAsset, saveAsset } from "@app/db/assetStore";
import { CREATURE_TYPE, normalizeCreatureData, type CreatureData } from "../schema";
import "./CreatureEditPage.css";

function generateId(): string {
  return crypto.randomUUID();
}

export function CreatureEditPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const definition = getAssetType(CREATURE_TYPE);
  if (!definition) {
    throw new Error("Creature asset type is not registered.");
  }

  const [assetId] = useState(() => (isNew ? generateId() : (id as string)));
  const [name, setName] = useState("");
  const [data, setData] = useState<CreatureData>(() => definition.createDefaultData() as CreatureData);
  const [loaded, setLoaded] = useState(isNew);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isNew) return;
    window.atlas.db
      .query("SELECT * FROM assets WHERE id = ?", [assetId])
      .then((rows) => {
        const row = (rows as Array<{ name: string; data: string }>)[0];
        if (row) {
          setName(row.name);
          setData(normalizeCreatureData(JSON.parse(row.data)));
        }
        setLoaded(true);
      });
  }, [assetId, isNew]);

  const handleSave = async (): Promise<void> => {
    const result = definition.validate(data);
    if (!result.valid) {
      setErrors(result.errors.map((e) => e.message));
      return;
    }
    if (!name.trim()) {
      setErrors(["Name is required."]);
      return;
    }

    setErrors([]);
    await saveAsset({ id: assetId, type: CREATURE_TYPE, name, data });
    navigate("/creatures");
  };

  const handleDelete = async (): Promise<void> => {
    await deleteAsset(assetId);
    navigate("/creatures");
  };

  const handleExport = async (exporterId: string): Promise<void> => {
    const exporter = definition.exporters.find((e) => e.id === exporterId);
    if (!exporter) return;
    const output = await exporter.export(data, name);
    const mimeType = exporter.fileExtension === "png" ? "image/png" : "text/plain";
    const blob = new Blob([output as BlobPart], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name || "creature"}.${exporter.fileExtension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!loaded) return <p>Loading…</p>;

  const Editor = definition.editor as ComponentType<{
    assetId: string | null;
    data: CreatureData;
    onChange: (data: CreatureData) => void;
  }>;

  const Preview = definition.preview as ComponentType<{
    name: string;
    data: CreatureData;
  }>;

  return (
    <div className="creature-edit">
      <header className="creature-edit__header">
        <h1>{isNew ? "New Creature" : "Edit Creature"}</h1>
        <div className="creature-edit__actions">
          {!isNew && (
            <DuplicateAssetButton assetId={assetId} basePath="/creatures" />
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
        <Card className="creature-edit__errors">
          {errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </Card>
      )}

      <label className="creature-edit__name-field">
        <span>Name</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Creature name" />
      </label>

      <div className="creature-edit__layout">
        <Editor assetId={isNew ? null : assetId} data={data} onChange={setData} />
        <div className="creature-edit__preview">
          <Preview name={name} data={data} />
        </div>
      </div>
    </div>
  );
}
