import { NavLink, Outlet } from 'react-router-dom';
import logo from '../assets/logo.png';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/template-creator', label: 'Template Creator' },
];

export default function MainLayout() {
  return (
    <div className="rbp-shell">
      <aside className="rbp-sidebar">
        <NavLink to="/" className="rbp-brand-block">
          <img src={logo} alt="Report Builder Pro logo" />
          <div>
            <span className="brand-title">Report Builder Pro</span>
            <small className="text-muted">Prototype</small>
          </div>
        </NavLink>
        <ul className="nav rbp-nav-stacked">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive ? 'rbp-nav-link active' : 'rbp-nav-link'
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <NavLink to="/login" className="btn btn-link btn-sm">
            Log out
          </NavLink>
        </div>
      </aside>
      <div className="rbp-main">
        <main className="rbp-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

