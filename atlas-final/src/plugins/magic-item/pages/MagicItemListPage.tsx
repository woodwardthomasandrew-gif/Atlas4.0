import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, EmptyState } from "@ui/components";
import { listAssets, type AssetRecord } from "@app/db/assetStore";
import { DuplicateAssetButton } from "@plugins/shared/components/DuplicateAssetButton";
import { AssetSearchField } from "@plugins/shared/components/AssetSearchField";
import { filterAssetsByName } from "@app/search/assetSearch";
import { MAGIC_ITEM_TYPE } from "../schema";
import "./MagicItemListPage.css";

export function MagicItemListPage(): JSX.Element {
  const [items, setItems] = useState<AssetRecord[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listAssets(MAGIC_ITEM_TYPE).then(setItems);
  }, []);

  const filteredItems = useMemo(() => (items ? filterAssetsByName(items, query) : null), [items, query]);

  return (
    <div className="magic-item-list">
      <header className="magic-item-list__header">
        <h1>Magic Items</h1>
        <Link to="/magic-items/new">
          <Button variant="primary">New Magic Item</Button>
        </Link>
      </header>

      {items === null && <p>Loading…</p>}

      {items !== null && <AssetSearchField value={query} onChange={setQuery} />}

      {items !== null && items.length === 0 && (
        <EmptyState
          title="No magic items yet"
          description="Create your first magic item to get started."
        />
      )}

      {items !== null && items.length > 0 && filteredItems?.length === 0 && (
        <EmptyState title="No magic items found" description="Try a different name or clear the search." />
      )}

      {filteredItems !== null && filteredItems.length > 0 && (
        <div className="magic-item-list__grid">
          {filteredItems.map((item) => (
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
