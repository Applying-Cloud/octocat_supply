import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

interface FormErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  confirmPassword?: string;
  general?: string;
}

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  const { darkMode } = useTheme();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email format is invalid';
    }

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 12) {
      newErrors.password = 'Password must be at least 12 characters';
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Password must contain an uppercase letter';
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = 'Password must contain a lowercase letter';
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = 'Password must contain a digit';
    } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
      newErrors.password = 'Password must contain a special character';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ email, password, firstName, lastName });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        if (error.response?.status === 409) {
          setErrors({ email: 'Email already registered' });
        } else if (error.response?.status === 400 && data?.error?.details) {
          // Map API validation errors
          const apiErrors: FormErrors = {};
          const details: string[] = data.error.details;
          for (const detail of details) {
            if (detail.toLowerCase().includes('email')) apiErrors.email = detail;
            else if (detail.toLowerCase().includes('password')) apiErrors.password = detail;
            else if (detail.toLowerCase().includes('first name')) apiErrors.firstName = detail;
            else if (detail.toLowerCase().includes('last name')) apiErrors.lastName = detail;
          }
          setErrors(Object.keys(apiErrors).length > 0 ? apiErrors : { general: 'Invalid input' });
        } else {
          setErrors({ general: 'Registration failed. Please try again.' });
        }
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `w-full ${darkMode ? 'bg-gray-700 text-light' : 'bg-gray-100 text-gray-800'} rounded px-3 py-2 transition-colors duration-300`;
  const labelClass = `block ${darkMode ? 'text-light' : 'text-gray-700'} mb-2 transition-colors duration-300`;
  const errorClass = 'text-red-500 text-sm mt-1';

  return (
    <div
      className={`min-h-screen pt-20 ${darkMode ? 'bg-dark' : 'bg-gray-100'} flex items-center justify-center px-4 transition-colors duration-300`}
      data-testid="register-page"
    >
      <div
        className={`max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 transition-colors duration-300`}
      >
        <h2
          className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-6 transition-colors duration-300`}
        >
          Register
        </h2>

        {errors.general && (
          <div
            className="bg-red-500/10 border border-red-500 text-red-500 rounded-md p-3 mb-4"
            data-testid="register-error"
            role="alert"
          >
            {errors.general}
          </div>
        )}

        {success && (
          <div
            className="bg-green-500/10 border border-green-500 text-green-500 rounded-md p-3 mb-4"
            data-testid="register-success"
            role="status"
          >
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
          <div>
            <label htmlFor="email" className={labelClass}>Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
              autoFocus
              data-testid="register-email"
            />
            {errors.email && <p className={errorClass} data-testid="register-email-error">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="firstName" className={labelClass}>First Name</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              required
              data-testid="register-firstname"
            />
            {errors.firstName && <p className={errorClass} data-testid="register-firstname-error">{errors.firstName}</p>}
          </div>

          <div>
            <label htmlFor="lastName" className={labelClass}>Last Name</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
              required
              data-testid="register-lastname"
            />
            {errors.lastName && <p className={errorClass} data-testid="register-lastname-error">{errors.lastName}</p>}
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
              data-testid="register-password"
            />
            {errors.password && <p className={errorClass} data-testid="register-password-error">{errors.password}</p>}
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Min 12 characters, uppercase, lowercase, digit, and special character
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              required
              data-testid="register-confirm-password"
            />
            {errors.confirmPassword && <p className={errorClass} data-testid="register-confirm-error">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-accent text-white py-2 px-4 rounded transition-colors disabled:opacity-50"
            data-testid="register-submit"
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p
          className={`mt-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary hover:text-accent transition-colors"
            data-testid="register-login-link"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
