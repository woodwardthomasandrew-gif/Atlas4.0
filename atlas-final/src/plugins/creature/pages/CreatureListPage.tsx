import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, EmptyState } from "@ui/components";
import { listAssets, type AssetRecord } from "@app/db/assetStore";
import { DuplicateAssetButton } from "@plugins/shared/components/DuplicateAssetButton";
import { CREATURE_TYPE } from "../schema";
import "./CreatureListPage.css";

export function CreatureListPage(): JSX.Element {
  const [items, setItems] = useState<AssetRecord[] | null>(null);

  useEffect(() => {
    listAssets(CREATURE_TYPE).then(setItems);
  }, []);

  return (
    <div className="creature-list">
      <header className="creature-list__header">
        <h1>Creatures</h1>
        <Link to="/creatures/new">
          <Button variant="primary">New Creature</Button>
        </Link>
      </header>

      {items === null && <p>Loading…</p>}

      {items !== null && items.length === 0 && (
        <EmptyState title="No creatures yet" description="Create your first creature to get started." />
      )}

      {items !== null && items.length > 0 && (
        <div className="creature-list__grid">
          {items.map((item) => (
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
    </div>
  );
}
