import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, EmptyState } from "@ui/components";
import { listAssets, type AssetRecord } from "@app/db/assetStore";
import { DuplicateAssetButton } from "@plugins/shared/components/DuplicateAssetButton";
import { AssetSearchField } from "@plugins/shared/components/AssetSearchField";
import { filterAssetsByName } from "@app/search/assetSearch";
import { listAssetTemplates } from "@app/templates/templateCatalog";
import { Modal } from "@ui/components/Modal";
import { SPELL_TYPE } from "../schema";
import "./SpellListPage.css";

export function SpellListPage(): JSX.Element {
  const [items, setItems] = useState<AssetRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const templates = listAssetTemplates(SPELL_TYPE);

  useEffect(() => {
    listAssets(SPELL_TYPE).then(setItems);
  }, []);

  const filteredItems = useMemo(() => (items ? filterAssetsByName(items, query) : null), [items, query]);

  return (
    <div className="spell-list">
      <header className="spell-list__header">
        <h1>Spells</h1>
        <div className="spell-list__create-actions">
          <Link to="/spells/new"><Button variant="primary">New Spell</Button></Link>
          <Button onClick={() => setShowTemplates(true)}>Create from Template</Button>
        </div>
      </header>

      {items === null && <p>Loading…</p>}

      {items !== null && <AssetSearchField value={query} onChange={setQuery} />}

      {items !== null && items.length === 0 && (
        <EmptyState title="No spells yet" description="Create your first spell to get started." />
      )}

      {items !== null && items.length > 0 && filteredItems?.length === 0 && (
        <EmptyState title="No spells found" description="Try a different name or clear the search." />
      )}

      {filteredItems !== null && filteredItems.length > 0 && (
        <div className="spell-list__grid">
          {filteredItems.map((item) => (
            <Link key={item.id} to={`/spells/${item.id}`} className="spell-list__card-link">
              <Card className="spell-list__card">
                <strong>{item.name}</strong>
                <DuplicateAssetButton
                  assetId={item.id}
                  basePath="/spells"
                  variant="ghost"
                  className="spell-list__duplicate"
                />
              </Card>
            </Link>
          ))}
        </div>
      )}

      {showTemplates && (
        <Modal title="Create Spell from Template" onClose={() => setShowTemplates(false)} wide>
          <div className="spell-template-list">
            {templates.map((template) => (
              <Link
                key={template.id}
                to={`/spells/new?template=${encodeURIComponent(template.id)}`}
                className="spell-template-list__item"
                onClick={() => setShowTemplates(false)}
              >
                <strong>{template.name}</strong>
                <span className="spell-template-list__category">{template.category}</span>
                <span>{template.description}</span>
              </Link>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
