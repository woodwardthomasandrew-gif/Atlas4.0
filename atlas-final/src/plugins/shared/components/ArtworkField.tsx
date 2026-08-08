import "./ArtworkField.css";

export interface ArtworkFieldProps {
  value: string;
  onChange: (dataUrl: string) => void;
}

export function ArtworkField({ value, onChange }: ArtworkFieldProps): JSX.Element {
  const handleFile = (file: File | undefined): void => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="artwork-field">
      {value && <img className="artwork-field__preview" src={value} alt="Artwork preview" />}
      <div className="artwork-field__controls">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {value && (
          <button type="button" className="artwork-field__remove" onClick={() => onChange("")}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
