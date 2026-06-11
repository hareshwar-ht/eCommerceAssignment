import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginForm from '@/features/auth/LoginForm';
import { AuthContext } from '@/context/auth-context';
import type { User } from '@/types/auth';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogin = vi.fn();

function buildAuthContext(overrides = {}) {
  return {
    user: null as User | null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    registerInitiate: vi.fn(),
    registerVerify: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    deleteProfile: vi.fn(),
    ...overrides,
  };
}

function renderLoginForm(authCtx = buildAuthContext()) {
  return render(
    <AuthContext.Provider value={authCtx}>
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('LoginForm', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  it('renders email and password fields', () => {
    renderLoginForm();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitted empty', async () => {
    renderLoginForm();
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('calls login with correct values on valid submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLoginForm();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  it('navigates to /dashboard on successful login', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLoginForm();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });
});
