import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, EmptyState } from "@ui/components";
import { listAssets, type AssetRecord } from "@app/db/assetStore";
import { DuplicateAssetButton } from "@plugins/shared/components/DuplicateAssetButton";
import { AssetSearchField } from "@plugins/shared/components/AssetSearchField";
import { filterAssetsByName } from "@app/search/assetSearch";
import { listAssetTemplates } from "@app/templates/templateCatalog";
import { Modal } from "@ui/components/Modal";
import { CREATURE_TYPE } from "../schema";
import "./CreatureListPage.css";

export function CreatureListPage(): JSX.Element {
  const [items, setItems] = useState<AssetRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const templates = listAssetTemplates(CREATURE_TYPE);

  useEffect(() => {
    listAssets(CREATURE_TYPE).then(setItems);
  }, []);

  const filteredItems = useMemo(() => (items ? filterAssetsByName(items, query) : null), [items, query]);

  return (
    <div className="creature-list">
      <header className="creature-list__header">
        <h1>Creatures</h1>
        <div className="creature-list__create-actions">
          <Link to="/creatures/new"><Button variant="primary">New Creature</Button></Link>
          <Button onClick={() => setShowTemplates(true)}>Create from Template</Button>
        </div>
      </header>

      {items === null && <p>Loading…</p>}

      {items !== null && <AssetSearchField value={query} onChange={setQuery} />}

      {items !== null && items.length === 0 && (
        <EmptyState title="No creatures yet" description="Create your first creature to get started." />
      )}

      {items !== null && items.length > 0 && filteredItems?.length === 0 && (
        <EmptyState title="No creatures found" description="Try a different name or clear the search." />
      )}

      {filteredItems !== null && filteredItems.length > 0 && (
        <div className="creature-list__grid">
          {filteredItems.map((item) => (
            <Link key={item.id} to={`/creatures/${item.id}`} className="creature-list__card-link">
              <Card className="creature-list__card">
                <strong>{item.name}</strong>
                <DuplicateAssetButton
                  assetId={item.id}
                  basePath="/creatures"
                  variant="ghost"
                  className="creature-list__duplicate"
                />
              </Card>
            </Link>
          ))}
        </div>
      )}

      {showTemplates && (
        <Modal title="Create Creature from Template" onClose={() => setShowTemplates(false)} wide>
          <div className="creature-template-list">
            {templates.map((template) => (
              <Link
                key={template.id}
                to={`/creatures/new?template=${encodeURIComponent(template.id)}`}
                className="creature-template-list__item"
                onClick={() => setShowTemplates(false)}
              >
                <strong>{template.name}</strong>
                <span className="creature-template-list__category">{template.category}</span>
                <span>{template.description}</span>
              </Link>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
