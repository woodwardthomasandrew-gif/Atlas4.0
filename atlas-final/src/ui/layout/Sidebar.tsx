import { NavLink } from "react-router-dom";
import { getNavItems } from "@app/navigation/navRegistry";
import "./Sidebar.css";

/**
 * Core contributes only the Dashboard link. Everything else is read
 * from the nav registry, which plugins populate when they register.
 */
export function Sidebar(): JSX.Element {
  const pluginNavItems = getNavItems();

  return (
    <nav className="atlas-sidebar">
      <div className="atlas-sidebar__title">Alaruel Atlas</div>
      <ul className="atlas-sidebar__nav">
        <li>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              "atlas-sidebar__link" + (isActive ? " atlas-sidebar__link--active" : "")
            }
          >
            Dashboard
          </NavLink>
        </li>
        {pluginNavItems.map((item) => (
          <li key={item.id}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                "atlas-sidebar__link" + (isActive ? " atlas-sidebar__link--active" : "")
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
