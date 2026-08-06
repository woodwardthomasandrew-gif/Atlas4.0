/**
 * Navigation registry.
 *
 * Core ships with a single hardcoded "Dashboard" entry. Everything else
 * in the sidebar is contributed by plugins via registerNavItem(), so the
 * Sidebar component never needs to know a given asset type exists.
 */
export interface NavItem {
  id: string;
  label: string;
  path: string;
  order?: number;
}

const navItems = new Map<string, NavItem>();

export function registerNavItem(item: NavItem): void {
  if (navItems.has(item.id)) {
    throw new Error(`Nav item "${item.id}" is already registered.`);
  }
  navItems.set(item.id, item);
}

export function getNavItems(): NavItem[] {
  return Array.from(navItems.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
