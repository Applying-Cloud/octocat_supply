import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Register from './Register';

// Mock the AuthContext
const mockRegister = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
    isLoggedIn: false,
    isAdmin: false,
    isLoading: false,
    login: vi.fn(),
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

function renderRegister() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the registration form', () => {
    renderRegister();

    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(screen.getByTestId('register-email')).toBeInTheDocument();
    expect(screen.getByTestId('register-firstname')).toBeInTheDocument();
    expect(screen.getByTestId('register-lastname')).toBeInTheDocument();
    expect(screen.getByTestId('register-password')).toBeInTheDocument();
    expect(screen.getByTestId('register-confirm-password')).toBeInTheDocument();
    expect(screen.getByTestId('register-submit')).toBeInTheDocument();
  });

  it('should render link to login page', () => {
    renderRegister();

    const link = screen.getByTestId('register-login-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });

  it('should show validation error for short password', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByTestId('register-email'), 'new@example.com');
    await user.type(screen.getByTestId('register-firstname'), 'John');
    await user.type(screen.getByTestId('register-lastname'), 'Doe');
    await user.type(screen.getByTestId('register-password'), 'short');
    await user.type(screen.getByTestId('register-confirm-password'), 'short');
    await user.click(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('register-password-error')).toBeInTheDocument();
    });
  });

  it('should show validation error for password mismatch', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByTestId('register-email'), 'new@example.com');
    await user.type(screen.getByTestId('register-firstname'), 'John');
    await user.type(screen.getByTestId('register-lastname'), 'Doe');
    await user.type(screen.getByTestId('register-password'), 'StrongPass12!@');
    await user.type(screen.getByTestId('register-confirm-password'), 'DifferentPass12!@');
    await user.click(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('register-confirm-error')).toBeInTheDocument();
    });
  });

  it('should show validation error for whitespace-only firstName', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByTestId('register-email'), 'new@example.com');
    await user.type(screen.getByTestId('register-firstname'), '   ');
    await user.type(screen.getByTestId('register-lastname'), 'Doe');
    await user.type(screen.getByTestId('register-password'), 'StrongPass12!@');
    await user.type(screen.getByTestId('register-confirm-password'), 'StrongPass12!@');
    await user.click(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('register-firstname-error')).toBeInTheDocument();
    });
  });

  it('should call register and navigate to login on success', async () => {
    mockRegister.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByTestId('register-email'), 'new@example.com');
    await user.type(screen.getByTestId('register-firstname'), 'John');
    await user.type(screen.getByTestId('register-lastname'), 'Doe');
    await user.type(screen.getByTestId('register-password'), 'StrongPass12!@');
    await user.type(screen.getByTestId('register-confirm-password'), 'StrongPass12!@');
    await user.click(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'StrongPass12!@',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should display email conflict error from API', async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 409, data: { error: { code: 'CONFLICT', message: 'Email already registered' } } },
    };
    mockRegister.mockRejectedValue(axiosError);
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByTestId('register-email'), 'existing@example.com');
    await user.type(screen.getByTestId('register-firstname'), 'John');
    await user.type(screen.getByTestId('register-lastname'), 'Doe');
    await user.type(screen.getByTestId('register-password'), 'StrongPass12!@');
    await user.type(screen.getByTestId('register-confirm-password'), 'StrongPass12!@');
    await user.click(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('register-email-error')).toHaveTextContent('Email already registered');
    });
  });
});
