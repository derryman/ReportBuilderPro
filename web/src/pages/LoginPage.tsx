import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

// Prototype login credentials
const CORRECT_EMAIL = 'derrymahon@icloud.com';
const CORRECT_PASSWORD = 'prototype';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simple credential check
    setTimeout(() => {
      if (email === CORRECT_EMAIL && password === CORRECT_PASSWORD) {
        setTimeout(() => navigate('/'), 1000);
      } else {
        setError('Invalid email or password. Try: derrymahon@icloud.com / prototype');
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-card panel panel-default">
        <div className="panel-body">
          <div className="text-center">
            <img src={logo} alt="Report Builder Pro logo" className="login-logo" />
            <h2>Welcome back</h2>
            <p className="text-muted">Sign in to start designing your reports.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="checkbox clearfix">
              <label>
                <input type="checkbox" /> Remember me
              </label>
              <span className="pull-right text-muted">Single-account prototype</span>
            </div>
            <button type="submit" className="btn btn-block btn-rbp" disabled={isLoading}>
              {isLoading ? 'Verifying…' : 'Sign in'}
            </button>
            {error && <div className="status-message status-error">{error}</div>}
          </form>
        </div>
      </div>
      <p className="login-footer text-muted">Prototype build &mdash; functionality coming soon.</p>
    </div>
  );
}
