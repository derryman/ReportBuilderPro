import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { analyzeReportText, type DetectedIssue } from '../nlpIssueDetection';
import { useMobile } from '../utils/useMobile';

// This is sample data for the dashboard statistics
// Each object represents one statistic card
const stats = [
  { label: 'Templates drafted', value: '18', detail: 'In the last 30 days' },
  { label: 'Reports published', value: '42', detail: 'Company wide' },
  { label: 'Pending approvals', value: '6', detail: 'Awaiting review' },
];

// This is sample data for the AI-detected issues
// Each object represents one issue that was found
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
];

// DEMO: Main component for the home page
export default function HomePage() {
  const isMobile = useMobile();
  
  // DEMO: State management - stores the text user enters and the issues we detect
  const [reportText, setReportText] = useState(
    'Safety inspection pending for next week.\nConcrete pour rescheduled due to weather.\nMaterial shortage reported for electrical supplies.\nNon-compliant scaffolding found on site.'
  ); 
  
  // DEMO: Store the list of issues we detect from the text
  const [detectedIssues, setDetectedIssues] = useState<DetectedIssue[]>([]);

  // DEMO: This function processes the report text and finds issues
  // It follows the NLP pipeline: Tokenization → Classification → Dashboard
  const handleProcessReport = () => {
    // Use shared NLP helper so Home and Template Creator stay consistent
    const issues = analyzeReportText(reportText);
    setDetectedIssues(issues);
  };
  return (
    <div className="home-page">
      {/* Hero section - the main banner at the top */}
      <section className="rbp-hero panel panel-default">
        <div className="panel-body">
          <h1>Design fast, share confidently</h1>
          <p>Report Builder Pro centralizes your business data into ready-to-share dashboards.</p>
          
          {/* Button group for navigation */}
          <div className="btn-group">
            {!isMobile && (
              <NavLink to="/template-creator" className="btn btn-rbp">
                Start a template
              </NavLink>
            )}
            <NavLink to="/template-library" className="btn btn-default">
              Browse templates
            </NavLink>
            {isMobile && (
              <NavLink to="/mobile-capture" className="btn btn-rbp">
                Fill out template
              </NavLink>
            )}
          </div>
        </div>
      </section>

      {/* Statistics section - shows three stat cards */}
      <section className="row">
        {/* 
          The map function loops through each stat in the stats array
          and creates a card for each one
        */}
        {stats.map((stat) => {
          return (
            <div key={stat.label} className="col-sm-4">
              <div className="panel panel-stat">
                <div className="panel-body">
                  <span className="stat-label">{stat.label}</span>
                  <strong className="stat-value">{stat.value}</strong>
                  <span className="stat-detail">{stat.detail}</span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* AI Issue Scanner section - shows detected issues */}
      <section className="panel panel-default">
        <div className="panel-heading">
          <h2 className="panel-title">AI Issue Scanner</h2>
        </div>
        <div className="panel-body">
          <div className="row">
            {/* 
              The map function loops through each issue in the issues array
              and creates a card for each one
            */}
            {issues.map((issue) => {
              // Build the CSS class name based on the issue severity
              // For example: "issue-card issue-high" or "issue-card issue-medium"
              const issueCardClass = `issue-card issue-${issue.severity}`;
              const badgeClass = `issue-badge issue-badge-${issue.severity}`;

              return (
                <div key={issue.id} className="col-sm-6">
                  <div className={issueCardClass}>
                    {/* Issue header with badge and job ID */}
                    <div className="issue-header">
                      <span className={badgeClass}>
                        {issue.severity}
                      </span>
                      <span className="issue-job">Job #{issue.jobId}</span>
                    </div>
                    
                    {/* Issue title and description */}
                    <h3 className="issue-title">{issue.title}</h3>
                    <p className="issue-description">{issue.description}</p>
                    
                    {/* Issue metadata (date and category) */}
                    <div className="issue-meta">
                      <span className="issue-date">{issue.date}</span>
                      <span className="issue-category">{issue.category}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DEMO: NLP Issue Detection section */}
      {/* This section demonstrates the NLP pipeline: spaCy → Scikit-learn → Dashboard */}
      <section className="panel panel-default">
        <div className="panel-heading">
          <h2 className="panel-title">NLP Issue Detection</h2>
          <p className="text-muted small">
            DEMO: Analyze report text to detect issues (spaCy tokenization → Scikit-learn classification → Dashboard display)
          </p>
        </div>
        <div className="panel-body">
          {/* DEMO: Text input area - user enters construction report text */}
          <div className="form-group">
            <label>Construction Report Text</label>
            <textarea
              className="form-control"
              rows={6}
              placeholder="Enter your construction report text here, one sentence per line..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
            />
          </div>

          {/* DEMO: Button triggers the NLP processing pipeline */}
          <button className="btn btn-rbp" onClick={handleProcessReport}>
            Analyze Report
          </button>

          {/* DEMO: Display detected issues - only the final results appear (same format as hardcoded issues above) */}
          {detectedIssues.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3>Detected Issues:</h3>
              <div className="row" style={{ marginTop: '15px' }}>
                {/* DEMO: Loop through each detected issue and display it as a card */}
                {detectedIssues.map((issue) => {
                  // Build CSS classes for styling based on severity (high/medium/low)
                  const issueCardClass = `issue-card issue-${issue.severity}`;
                  const badgeClass = `issue-badge issue-badge-${issue.severity}`;

                  return (
                    <div key={issue.id} className="col-sm-6">
                      <div className={issueCardClass}>
                        {/* Issue header shows severity badge and job ID */}
                        <div className="issue-header">
                          <span className={badgeClass}>{issue.severity}</span>
                          <span className="issue-job">Job #{issue.jobId}</span>
                        </div>
                        
                        {/* Issue title and full description */}
                        <h3 className="issue-title">{issue.title}</h3>
                        <p className="issue-description">{issue.description}</p>
                        
                        {/* Issue metadata shows when it was detected and what category */}
                        <div className="issue-meta">
                          <span className="issue-date">{issue.date}</span>
                          <span className="issue-category">{issue.category}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
