import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, EmptyState } from "@ui/components";
import { listAssets, type AssetRecord } from "@app/db/assetStore";
import { DuplicateAssetButton } from "@plugins/shared/components/DuplicateAssetButton";
import { MAGIC_ITEM_TYPE } from "../schema";
import "./MagicItemListPage.css";

export function MagicItemListPage(): JSX.Element {
  const [items, setItems] = useState<AssetRecord[] | null>(null);

  useEffect(() => {
    listAssets(MAGIC_ITEM_TYPE).then(setItems);
  }, []);

  return (
    <div className="magic-item-list">
      <header className="magic-item-list__header">
        <h1>Magic Items</h1>
        <Link to="/magic-items/new">
          <Button variant="primary">New Magic Item</Button>
        </Link>
      </header>

      {items === null && <p>Loading…</p>}

      {items !== null && items.length === 0 && (
        <EmptyState
          title="No magic items yet"
          description="Create your first magic item to get started."
        />
      )}

      {items !== null && items.length > 0 && (
        <div className="magic-item-list__grid">
          {items.map((item) => (
            <Link key={item.id} to={`/magic-items/${item.id}`} className="magic-item-list__card-link">
              <Card className="magic-item-list__card">
                <strong>{item.name}</strong>
                <DuplicateAssetButton
                  assetId={item.id}
                  basePath="/magic-items"
                  variant="ghost"
                  className="magic-item-list__duplicate"
                />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
