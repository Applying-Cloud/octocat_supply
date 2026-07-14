import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './Login';

// Mock the AuthContext
const mockLogin = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isLoggedIn: false,
    isAdmin: false,
    isLoading: false,
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock ThemeContext
vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    darkMode: false,
    toggleTheme: vi.fn(),
  }),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderLogin() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the login form', () => {
    renderLogin();

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('login-email')).toBeInTheDocument();
    expect(screen.getByTestId('login-password')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit')).toBeInTheDocument();
  });

  it('should render link to register page', () => {
    renderLogin();

    const link = screen.getByTestId('login-register-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/register');
  });

  it('should call login and navigate on successful submission', async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByTestId('login-email'), 'user@example.com');
    await user.type(screen.getByTestId('login-password'), 'StrongPass12!@');
    await user.click(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'StrongPass12!@');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should display error on login failure (401)', async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 401, data: { error: { message: 'Invalid credentials' } } },
    };
    mockLogin.mockRejectedValue(axiosError);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByTestId('login-email'), 'bad@example.com');
    await user.type(screen.getByTestId('login-password'), 'WrongPass123!@');
    await user.click(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toBeInTheDocument();
    });
  });

  it('should display generic error on network failure', async () => {
    mockLogin.mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByTestId('login-email'), 'user@example.com');
    await user.type(screen.getByTestId('login-password'), 'StrongPass12!@');
    await user.click(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toHaveTextContent('Login failed. Please try again.');
    });
  });
});
