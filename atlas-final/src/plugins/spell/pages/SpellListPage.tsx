import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, EmptyState } from "@ui/components";
import { listAssets, type AssetRecord } from "@app/db/assetStore";
import { DuplicateAssetButton } from "@plugins/shared/components/DuplicateAssetButton";
import { AssetSearchField } from "@plugins/shared/components/AssetSearchField";
import { filterAssetsByName } from "@app/search/assetSearch";
import { SPELL_TYPE } from "../schema";
import "./SpellListPage.css";

export function SpellListPage(): JSX.Element {
  const [items, setItems] = useState<AssetRecord[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listAssets(SPELL_TYPE).then(setItems);
  }, []);

  const filteredItems = useMemo(() => (items ? filterAssetsByName(items, query) : null), [items, query]);

  return (
    <div className="spell-list">
      <header className="spell-list__header">
        <h1>Spells</h1>
        <Link to="/spells/new">
          <Button variant="primary">New Spell</Button>
        </Link>
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
    </div>
  );
}
