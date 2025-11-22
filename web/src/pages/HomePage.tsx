import { NavLink } from 'react-router-dom';

// Statistics to display
const stats = [
  { label: 'Templates drafted', value: '18', detail: 'In the last 30 days' },
  { label: 'Reports published', value: '42', detail: 'Company wide' },
  { label: 'Pending approvals', value: '6', detail: 'Awaiting review' },
];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="rbp-hero panel panel-default">
        <div className="panel-body">
          <h1>Design fast, share confidently</h1>
          <p>
            Report Builder Pro centralizes your business data into ready-to-share dashboards.
          </p>
          <div className="btn-group">
            <NavLink to="/template-creator" className="btn btn-rbp">
              Start a template
            </NavLink>
            <NavLink to="/template-library" className="btn btn-default">
              Browse templates
            </NavLink>
          </div>
        </div>
      </section>
      <section className="row">
        {stats.map((stat) => (
          <div key={stat.label} className="col-sm-4">
            <div className="panel panel-stat">
              <div className="panel-body">
                <span className="stat-label">{stat.label}</span>
                <strong className="stat-value">{stat.value}</strong>
                <span className="stat-detail">{stat.detail}</span>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
