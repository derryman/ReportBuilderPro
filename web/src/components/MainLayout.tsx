import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useMobile } from '../utils/useMobile';
import { useAuth } from '../contexts/AuthContext';

// Navigation menu item type
type MenuItem = {
  path: string;
  label: string;
  hideOnMobile?: boolean;
};

// Navigation menu items
const menuItems: MenuItem[] = [
  { path: '/', label: 'Home' },
  { path: '/template-creator', label: 'Template Creator', hideOnMobile: true },
  { path: '/template-library', label: 'Template Library' },
  { path: '/mobile-capture', label: 'Mobile Capture' },
  { path: '/risk-detection', label: 'Risk Detection' },
  { path: '/reports', label: 'Reports' },
];

export default function MainLayout() {
  const isMobile = useMobile();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="rbp-shell">
      <aside className="rbp-sidebar">
        <NavLink to="/" className="rbp-brand-block">
          <img src={logo} alt="Report Builder Pro logo" />
          <div className="brand-text">
            <span className="brand-title">Report Builder Pro</span>
            <small className="text-muted">Beta</small>
          </div>
        </NavLink>
        <ul className="nav rbp-nav-stacked">
          {menuItems
            .filter((item) => !(isMobile && item.hideOnMobile))
            .map((item) => (
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
          {user && (
            <div className="text-muted small" style={{ padding: '10px', marginBottom: '5px' }}>
              {user.email}
            </div>
          )}
          <button onClick={handleLogout} className="btn btn-link btn-sm" style={{ width: '100%', textAlign: 'left' }}>
            Log out
          </button>
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
