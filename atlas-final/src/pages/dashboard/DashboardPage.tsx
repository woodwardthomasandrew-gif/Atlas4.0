import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Card, EmptyState } from "@ui/components";
import { listAssets, type AssetRecord } from "@app/db/assetStore";
import { getAllAssetTypes } from "@app/registry/assetRegistry";
import { getNavItems } from "@app/navigation/navRegistry";
import "./DashboardPage.css";

interface AssetGroup { type: string; label: string; pluralLabel: string; path: string; assets: AssetRecord[]; }
const chartColors = ["#7c9cff", "#b28cff", "#55c7a1", "#e6b866", "#e67d9f", "#6dc5dc"];

function formatUpdatedAt(value: string): string {
  const date = new Date(value.replace(" ", "T") + (value.endsWith("Z") ? "" : "Z"));
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function getCategoryPath(type: string): string {
  return getNavItems().find((item) => item.id === `${type}s` || item.path.includes(type))?.path ?? "/";
}

export function DashboardPage(): JSX.Element {
  const [version, setVersion] = useState<string>("—");
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.atlas.app.getVersion().then(setVersion);
    listAssets().then(setAssets).finally(() => setIsLoading(false));
  }, []);

  const groups = useMemo<AssetGroup[]>(() => getAllAssetTypes().map((definition) => ({
    type: definition.type, label: definition.label, pluralLabel: definition.pluralLabel,
    path: getCategoryPath(definition.type), assets: assets.filter((asset) => asset.type === definition.type).slice(0, 3)
  })), [assets]);
  const totalAssets = assets.length;
  const chartSegments = useMemo(() => {
    let offset = 0;
    return groups.filter((group) => assets.some((asset) => asset.type === group.type)).map((group, index) => {
      const count = assets.filter((asset) => asset.type === group.type).length;
      const start = offset; offset += (count / totalAssets) * 100;
      return { ...group, count, start, end: offset, color: chartColors[index % chartColors.length] };
    });
  }, [assets, groups, totalAssets]);
  const chartStyle = totalAssets ? ({ background: `conic-gradient(${chartSegments.map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`).join(", ")})` } as React.CSSProperties) : undefined;

  return (
    <div className="atlas-dashboard">
      <header className="atlas-dashboard__header">
        <div><p className="atlas-dashboard__eyebrow">Workshop overview</p><h1 className="atlas-dashboard__title">Welcome back to your Atlas</h1><p className="atlas-dashboard__subtitle">A quick look at the assets you have been shaping lately.</p></div>
        <Badge>v{version}</Badge>
      </header>

      <section className="atlas-dashboard__overview" aria-label="Atlas overview">
        <Card className="atlas-dashboard__total-card">
          <span className="atlas-dashboard__metric-label">Total assets</span><strong className="atlas-dashboard__metric-value">{totalAssets}</strong><span className="atlas-dashboard__metric-note">Across {groups.length} categories</span>
        </Card>
        <Card className="atlas-dashboard__distribution-card">
          <div><p className="atlas-dashboard__section-kicker">Library mix</p><h2 className="atlas-dashboard__card-title">Assets by category</h2></div>
          {totalAssets === 0 ? <p className="atlas-dashboard__muted">Your category breakdown will appear here as you create assets.</p> : <div className="atlas-dashboard__chart-wrap">
            <div className="atlas-dashboard__donut" style={chartStyle} aria-label={`Asset distribution across ${chartSegments.length} categories`}><div className="atlas-dashboard__donut-hole"><strong>{totalAssets}</strong><span>assets</span></div></div>
            <div className="atlas-dashboard__legend">{chartSegments.map((segment) => <div className="atlas-dashboard__legend-row" key={segment.type}><span className="atlas-dashboard__legend-swatch" style={{ background: segment.color }} /><span>{segment.pluralLabel}</span><strong>{segment.count}</strong></div>)}</div>
          </div>}
        </Card>
      </section>

      <div className="atlas-dashboard__section-heading"><div><p className="atlas-dashboard__section-kicker">Recently touched</p><h2 className="atlas-dashboard__section-title">Latest work by category</h2></div><span className="atlas-dashboard__muted">Showing up to 3 per category</span></div>
      <section className="atlas-dashboard__groups" aria-label="Latest work by category">
        {groups.map((group) => <Card className="atlas-dashboard__group" key={group.type}>
          <div className="atlas-dashboard__group-header"><div><h3>{group.pluralLabel}</h3><span>{group.assets.length ? `${group.assets.length} most recent` : "No assets yet"}</span></div><Link className="atlas-dashboard__view-link" to={group.path}>View all <span aria-hidden="true">→</span></Link></div>
          {isLoading ? <div className="atlas-dashboard__loading">Loading recent work…</div> : group.assets.length ? <div className="atlas-dashboard__asset-list">{group.assets.map((asset) => <Link className="atlas-dashboard__asset" to={`${group.path}/${asset.id}`} key={asset.id}><span className="atlas-dashboard__asset-icon" aria-hidden="true">{group.label.slice(0, 1)}</span><span className="atlas-dashboard__asset-info"><strong>{asset.name || "Untitled asset"}</strong><span>Edited {formatUpdatedAt(asset.updated_at)}</span></span><span className="atlas-dashboard__asset-arrow" aria-hidden="true">↗</span></Link>)}</div> : <EmptyState title={`No ${group.pluralLabel.toLowerCase()} yet`} description="Create one to see it here." />}
        </Card>)}
      </section>
    </div>
  );
}
