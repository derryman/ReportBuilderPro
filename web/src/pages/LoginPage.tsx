import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

// Simple prototype login - accepts any email/password combination
const PROTOTYPE_CREDENTIALS = {
  email: 'derrymahon@icloud.com',
  password: 'prototype',
  name: 'Prototype User',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setStatus('error');
      setMessage('Please enter both email and password.');
      return;
    }
    setStatus('loading');
    setMessage('');

    // Simple client-side validation for prototype
    setTimeout(() => {
      if (email === PROTOTYPE_CREDENTIALS.email && password === PROTOTYPE_CREDENTIALS.password) {
        setStatus('idle');
        setMessage(`Welcome back, ${PROTOTYPE_CREDENTIALS.name}. Redirecting...`);
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        setStatus('error');
        setMessage('Invalid email or password. Try: derrymahon@icloud.com / prototype');
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
                placeholder="derrymahon@icloud.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="checkbox clearfix">
              <label>
                <input type="checkbox" /> Remember me
              </label>
              <span className="pull-right text-muted">Single-account prototype</span>
            </div>
            <button type="submit" className="btn btn-block btn-rbp" disabled={status === 'loading'}>
              {status === 'loading' ? 'Verifying…' : 'Sign in'}
            </button>
            {message && (
              <div
                className={`status-message ${
                  status === 'error' ? 'status-error' : message.includes('Welcome') ? 'status-success' : ''
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
      <p className="login-footer text-muted">
        Prototype build &mdash; functionality coming soon.
      </p>
    </div>
  );
}

