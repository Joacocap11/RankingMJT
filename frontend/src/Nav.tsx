import { NavLink } from 'react-router-dom'

/** Top-level ranking switcher. Add future rankings (Alfajores, ...) as one
 * more NavLink here — no other routing changes required. */
export default function Nav() {
  return (
    <nav className="top-nav">
      <span className="top-nav-brand">RankingMJT</span>
      <div className="top-nav-tabs">
        <NavLink
          to="/monsters"
          className={({ isActive }) => `top-nav-tab${isActive ? ' active' : ''}`}
        >
          Monsters
        </NavLink>
        <NavLink
          to="/beers"
          className={({ isActive }) => `top-nav-tab${isActive ? ' active' : ''}`}
        >
          Cervezas
        </NavLink>
        <NavLink
          to="/alfajores"
          className={({ isActive }) => `top-nav-tab${isActive ? ' active' : ''}`}
        >
          Alfajores
        </NavLink>
      </div>
    </nav>
  )
}
