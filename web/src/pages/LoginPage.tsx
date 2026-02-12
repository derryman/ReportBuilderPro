import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  // React hooks to manage component state
  const navigate = useNavigate(); // Used to navigate to different pages
  const { login } = useAuth(); // Get login function from auth context
  const [email, setEmail] = useState(''); // Stores the email input value
  const [password, setPassword] = useState(''); // Stores the password input value
  const [error, setError] = useState(''); // Stores any error message to display
  const [isLoading, setIsLoading] = useState(false); // Tracks if login is in progress

  // This function runs when the user submits the login form
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent page from refreshing
    setIsLoading(true); // Show loading state
    setError(''); // Clear any previous errors

    try {
      // Use auth context login function
      const success = await login(email, password);
      
      if (success) {
        // Login successful - go to home page
        navigate('/');
      } else {
        // Login failed - show error message
        setError('Invalid email or password');
        setIsLoading(false);
      }
    } catch (error) {
      // Network error - couldn't reach the server
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
