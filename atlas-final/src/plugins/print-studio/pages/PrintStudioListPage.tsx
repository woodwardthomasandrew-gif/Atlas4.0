import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, EmptyState } from "@ui/components";
import { listAssets, type AssetRecord } from "@app/db/assetStore";
import { PRINT_STUDIO_TYPE } from "../schema";
import "./PrintStudioListPage.css";

export function PrintStudioListPage(): JSX.Element {
  const [items, setItems] = useState<AssetRecord[] | null>(null);

  useEffect(() => {
    listAssets(PRINT_STUDIO_TYPE).then(setItems);
  }, []);

  return (
    <div className="print-studio-list">
      <header className="print-studio-list__header">
        <h1>Print Studio</h1>
        <Link to="/print-studio/new">
          <Button variant="primary">New Layout</Button>
        </Link>
      </header>

      {items === null && <p>Loading…</p>}

      {items !== null && items.length === 0 && (
        <EmptyState
          title="No layouts yet"
          description="Create a layout to arrange item, creature, and spell cards for print."
        />
      )}

      {items !== null && items.length > 0 && (
        <div className="print-studio-list__grid">
          {items.map((item) => (
            <Link key={item.id} to={`/print-studio/${item.id}`} className="print-studio-list__card-link">
              <Card>
                <strong>{item.name}</strong>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
