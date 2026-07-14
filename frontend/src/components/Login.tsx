import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { darkMode } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!email || !password) {
      setLoginError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setLoginError('Invalid credentials');
      } else {
        setLoginError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen pt-20 ${darkMode ? 'bg-dark' : 'bg-gray-100'} flex items-center justify-center px-4 transition-colors duration-300`}
      data-testid="login-page"
    >
      <div
        className={`max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 transition-colors duration-300`}
      >
        <h2
          className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-6 transition-colors duration-300`}
        >
          Login
        </h2>

        {loginError && (
          <div
            className="bg-red-500/10 border border-red-500 text-red-500 rounded-md p-3 mb-4"
            data-testid="login-error"
            role="alert"
          >
            {loginError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
          <div>
            <label
              htmlFor="email"
              className={`block ${darkMode ? 'text-light' : 'text-gray-700'} mb-2 transition-colors duration-300`}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full ${darkMode ? 'bg-gray-700 text-light' : 'bg-gray-100 text-gray-800'} rounded px-3 py-2 transition-colors duration-300`}
              required
              autoFocus
              data-testid="login-email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className={`block ${darkMode ? 'text-light' : 'text-gray-700'} mb-2 transition-colors duration-300`}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full ${darkMode ? 'bg-gray-700 text-light' : 'bg-gray-100 text-gray-800'} rounded px-3 py-2 transition-colors duration-300`}
              required
              data-testid="login-password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-accent text-white py-2 px-4 rounded transition-colors disabled:opacity-50"
            data-testid="login-submit"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p
          className={`mt-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
        >
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-primary hover:text-accent transition-colors"
            data-testid="login-register-link"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
