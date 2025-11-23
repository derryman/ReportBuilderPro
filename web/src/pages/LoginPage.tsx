import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { API_BASE_URL } from '../config';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle login form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Send credentials to backend API
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        navigate('/'); // Navigate to home on success
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid email or password');
        setIsLoading(false);
      }
    } catch (error) {
      setError('Unable to connect to server.');
      setIsLoading(false);
    }
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
            <button type="submit" className="btn btn-block btn-rbp" disabled={isLoading}>
              {isLoading ? 'Verifying…' : 'Sign in'}
            </button>
            {error && <div className="status-message status-error">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
