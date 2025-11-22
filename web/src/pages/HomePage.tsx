import { NavLink } from 'react-router-dom';

const statCards = [
  { label: 'Templates drafted', value: '18', detail: 'In the last 30 days' },
  { label: 'Reports published', value: '42', detail: 'Company wide' },
  { label: 'Pending approvals', value: '6', detail: 'Awaiting review' },
];

const quickActions = [
  { label: 'Create template', to: '/template-creator', flavor: 'primary' },
  { label: 'Import data source', to: '/', flavor: 'default' },
  { label: 'Browse templates', to: '/', flavor: 'link' },
];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="rbp-hero panel panel-default">
        <div className="panel-body">
          <h1>Design fast, share confidently</h1>
          <p>
            Report Builder Pro centralizes your business data into ready-to-share dashboards. This
            prototype highlights the core layout for login, home, and template creation.
          </p>
          <div className="btn-group">
            <NavLink to="/template-creator" className="btn btn-rbp">
              Start a template
            </NavLink>
            <NavLink to="/login" className="btn btn-default">
              Switch account
            </NavLink>
          </div>
        </div>
      </section>
      <section className="row">
        {statCards.map((card) => (
          <div key={card.label} className="col-sm-4">
            <div className="panel panel-stat">
              <div className="panel-body">
                <span className="stat-label">{card.label}</span>
                <strong className="stat-value">{card.value}</strong>
                <span className="stat-detail">{card.detail}</span>
              </div>
            </div>
          </div>
        ))}
      </section>
      <section className="panel panel-default">
        <div className="panel-heading">
          <h3 className="panel-title">Quick actions</h3>
        </div>
        <div className="panel-body">
          <div className="row">
            {quickActions.map((action) => (
              <div key={action.label} className="col-sm-4">
                <NavLink
                  to={action.to}
                  className={`btn btn-block ${
                    action.flavor === 'link'
                      ? 'btn-link'
                      : action.flavor === 'primary'
                        ? 'btn-rbp'
                        : 'btn-default'
                  }`}
                >
                  {action.label}
                </NavLink>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

