import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, EmptyState } from "@ui/components";
import { listAssets, type AssetRecord } from "@app/db/assetStore";
import { DuplicateAssetButton } from "@plugins/shared/components/DuplicateAssetButton";
import { SPELL_TYPE } from "../schema";
import "./SpellListPage.css";

export function SpellListPage(): JSX.Element {
  const [items, setItems] = useState<AssetRecord[] | null>(null);

  useEffect(() => {
    listAssets(SPELL_TYPE).then(setItems);
  }, []);

  return (
    <div className="spell-list">
      <header className="spell-list__header">
        <h1>Spells</h1>
        <Link to="/spells/new">
          <Button variant="primary">New Spell</Button>
        </Link>
      </header>

      {items === null && <p>Loading…</p>}

      {items !== null && items.length === 0 && (
        <EmptyState title="No spells yet" description="Create your first spell to get started." />
      )}

      {items !== null && items.length > 0 && (
        <div className="spell-list__grid">
          {items.map((item) => (
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
