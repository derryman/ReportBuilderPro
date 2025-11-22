import { NavLink } from 'react-router-dom';

// Dashboard statistics
const stats = [
  { label: 'Templates drafted', value: '18', detail: 'In the last 30 days' },
  { label: 'Reports published', value: '42', detail: 'Company wide' },
  { label: 'Pending approvals', value: '6', detail: 'Awaiting review' },
];

// AI-detected issues from job reports
const issues = [
  {
    id: 1,
    jobId: '2024-001',
    title: 'Missing Safety Equipment',
    description: 'Hard hat inspection tag expired on site entrance',
    severity: 'high',
    category: 'Safety',
    date: '2 hours ago',
  },
  {
    id: 2,
    jobId: '2024-045',
    title: 'Documentation Incomplete',
    description: 'Progress report missing required signatures',
    severity: 'medium',
    category: 'Compliance',
    date: '5 hours ago',
  },
  {
    id: 3,
    jobId: '2024-089',
    title: 'Schedule Variance',
    description: 'Milestone completion delayed by 3 days',
    severity: 'medium',
    category: 'Schedule',
    date: '1 day ago',
  },
  {
    id: 4,
    jobId: '2024-112',
    title: 'Quality Check Pending',
    description: 'Material inspection not completed before installation',
    severity: 'low',
    category: 'Quality',
    date: '2 days ago',
  },
];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="rbp-hero panel panel-default">
        <div className="panel-body">
          <h1>Design fast, share confidently</h1>
          <p>Report Builder Pro centralizes your business data into ready-to-share dashboards.</p>
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

      <section className="panel panel-default">
        <div className="panel-heading">
          <h3 className="panel-title">AI Issue Scanner</h3>
          <p className="text-muted small">Automated issue detection from job reports</p>
        </div>
        <div className="panel-body">
          <div className="row">
            {issues.map((issue) => (
              <div key={issue.id} className="col-sm-6">
                <div className={`issue-card issue-${issue.severity}`}>
                  <div className="issue-header">
                    <span className={`issue-badge issue-badge-${issue.severity}`}>
                      {issue.severity}
                    </span>
                    <span className="issue-job">Job #{issue.jobId}</span>
                  </div>
                  <h4 className="issue-title">{issue.title}</h4>
                  <p className="issue-description">{issue.description}</p>
                  <div className="issue-meta">
                    <span className="issue-date">{issue.date}</span>
                    <span className="issue-category">{issue.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
