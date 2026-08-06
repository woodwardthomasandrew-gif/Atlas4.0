import { useEffect, useState } from "react";
import { Card, Badge } from "@ui/components";
import { getAssetCount } from "@app/db/assetStore";
import "./DashboardPage.css";

export function DashboardPage(): JSX.Element {
  const [version, setVersion] = useState<string>("—");
  const [assetCount, setAssetCount] = useState<number>(0);

  useEffect(() => {
    window.atlas.app.getVersion().then(setVersion);
    getAssetCount().then(setAssetCount);
  }, []);

  return (
    <div className="atlas-dashboard">
      <header className="atlas-dashboard__header">
        <h1 className="atlas-dashboard__title">Alaruel Atlas</h1>
        <Badge>v{version}</Badge>
      </header>

      <div className="atlas-dashboard__stats">
        <Card className="atlas-dashboard__stat">
          <div className="atlas-dashboard__stat-value">{assetCount}</div>
          <div className="atlas-dashboard__stat-label">Assets</div>
        </Card>
      </div>
    </div>
  );
}
