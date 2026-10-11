import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, EmptyState } from "@ui/components";
import { listAssets, type AssetRecord } from "@app/db/assetStore";
import { DuplicateAssetButton } from "@plugins/shared/components/DuplicateAssetButton";
import { AssetSearchField } from "@plugins/shared/components/AssetSearchField";
import { filterAssetsByName } from "@app/search/assetSearch";
import { listAssetTemplates } from "@app/templates/templateCatalog";
import { Modal } from "@ui/components/Modal";
import { MAGIC_ITEM_TYPE } from "../schema";
import "./MagicItemListPage.css";

export function MagicItemListPage(): JSX.Element {
  const [items, setItems] = useState<AssetRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const templates = listAssetTemplates(MAGIC_ITEM_TYPE);

  useEffect(() => {
    listAssets(MAGIC_ITEM_TYPE).then(setItems);
  }, []);

  const filteredItems = useMemo(() => (items ? filterAssetsByName(items, query) : null), [items, query]);

  return (
    <div className="magic-item-list">
      <header className="magic-item-list__header">
        <h1>Magic Items</h1>
        <div className="magic-item-list__create-actions">
          <Link to="/magic-items/new"><Button variant="primary">New Magic Item</Button></Link>
          <Button onClick={() => setShowTemplates(true)}>Create from Template</Button>
        </div>
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

      {showTemplates && (
        <Modal title="Create Magic Item from Template" onClose={() => setShowTemplates(false)} wide>
          <div className="magic-item-template-list">
            {templates.map((template) => (
              <Link
                key={template.id}
                to={`/magic-items/new?template=${encodeURIComponent(template.id)}`}
                className="magic-item-template-list__item"
                onClick={() => setShowTemplates(false)}
              >
                <strong>{template.name}</strong>
                <span className="magic-item-template-list__category">{template.category}</span>
                <span>{template.description}</span>
              </Link>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
