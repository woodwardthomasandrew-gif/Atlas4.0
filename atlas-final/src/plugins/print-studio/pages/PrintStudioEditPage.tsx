import { useEffect, useState, type ComponentType } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Input } from "@ui/components";
import { getAssetType } from "@app/registry/assetRegistry";
import { deleteAsset, saveAsset } from "@app/db/assetStore";
import { PRINT_STUDIO_TYPE, type PrintLayoutData } from "../schema";
import "./PrintStudioEditPage.css";

function generateId(): string {
  return crypto.randomUUID();
}

function mimeTypeFor(extension: string): string {
  if (extension === "png") return "image/png";
  if (extension === "pdf") return "application/pdf";
  return "text/plain";
}

export function PrintStudioEditPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const definition = getAssetType(PRINT_STUDIO_TYPE);
  if (!definition) {
    throw new Error("Print layout asset type is not registered.");
  }

  const [assetId] = useState(() => (isNew ? generateId() : (id as string)));
  const [name, setName] = useState("");
  const [data, setData] = useState<PrintLayoutData>(
    () => definition.createDefaultData() as PrintLayoutData
  );
  const [loaded, setLoaded] = useState(isNew);
  const [errors, setErrors] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isNew) return;
    window.atlas.db
      .query("SELECT * FROM assets WHERE id = ?", [assetId])
      .then((rows) => {
        const row = (rows as Array<{ name: string; data: string }>)[0];
        if (row) {
          setName(row.name);
          setData(JSON.parse(row.data));
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
    await saveAsset({ id: assetId, type: PRINT_STUDIO_TYPE, name, data });
    navigate("/print-studio");
  };

  const handleDelete = async (): Promise<void> => {
    await deleteAsset(assetId);
    navigate("/print-studio");
  };

  const handleExport = async (exporterId: string): Promise<void> => {
    const exporter = definition.exporters.find((e) => e.id === exporterId);
    if (!exporter) return;
    setExporting(true);
    try {
      const output = await exporter.export(data, name);
      const blob = new Blob([output as BlobPart], { type: mimeTypeFor(exporter.fileExtension) });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${name || "print-layout"}.${exporter.fileExtension}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (!loaded) return <p>Loading…</p>;

  const Editor = definition.editor as ComponentType<{
    assetId: string | null;
    data: PrintLayoutData;
    onChange: (data: PrintLayoutData) => void;
  }>;

  return (
    <div className="print-studio-edit">
      <header className="print-studio-edit__header">
        <h1>{isNew ? "New Print Layout" : "Edit Print Layout"}</h1>
        <div className="print-studio-edit__actions">
          {!isNew && (
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          {!isNew &&
            definition.exporters.map((exporter) => (
              <Button key={exporter.id} disabled={exporting} onClick={() => handleExport(exporter.id)}>
                {exporting ? "Exporting…" : `Export ${exporter.label}`}
              </Button>
            ))}
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </header>

      {errors.length > 0 && (
        <Card className="print-studio-edit__errors">
          {errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </Card>
      )}

      <label className="print-studio-edit__name-field">
        <span>Name</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Layout name" />
      </label>

      <Editor assetId={isNew ? null : assetId} data={data} onChange={setData} />
    </div>
  );
}
