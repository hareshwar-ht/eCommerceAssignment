import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterForm from '@/features/auth/RegisterForm';
import { AuthContext } from '@/context/auth-context';
import type { User } from '@/types/auth';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockRegisterInitiate = vi.fn();
const mockRegisterVerify = vi.fn();

function buildAuthContext(overrides = {}) {
  return {
    user: null as User | null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    registerInitiate: mockRegisterInitiate,
    registerVerify: mockRegisterVerify,
    logout: vi.fn(),
    updateProfile: vi.fn(),
    deleteProfile: vi.fn(),
    ...overrides,
  };
}

function renderRegisterForm(authCtx = buildAuthContext()) {
  return render(
    <AuthContext.Provider value={authCtx}>
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('RegisterForm', () => {
  beforeEach(() => {
    mockRegisterInitiate.mockReset();
    mockRegisterVerify.mockReset();
    mockNavigate.mockReset();
  });

  it('renders all registration fields initially', () => {
    renderRegisterForm();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows name validation error when name is too short', async () => {
    renderRegisterForm();
    await userEvent.type(screen.getByLabelText(/full name/i), 'J');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument();
  });

  it('calls registerInitiate with correct values and shows OTP step', async () => {
    mockRegisterInitiate.mockResolvedValue(undefined);
    renderRegisterForm();

    await userEvent.type(screen.getByLabelText(/full name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'password123');
    await userEvent.type(screen.getByLabelText(/phone number/i), '+15550199');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(mockRegisterInitiate).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '+15550199',
    });

    // Check that it transitioned to OTP screen
    expect(await screen.findByText(/verify your phone/i)).toBeInTheDocument();
  });

  it('submits OTP and navigates to dashboard on verification success', async () => {
    mockRegisterInitiate.mockResolvedValue(undefined);
    mockRegisterVerify.mockResolvedValue(undefined);
    renderRegisterForm();

    // 1. Fill register form
    await userEvent.type(screen.getByLabelText(/full name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'password123');
    await userEvent.type(screen.getByLabelText(/phone number/i), '+15550199');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    // 2. We should be on the OTP screen
    const otpInput = await screen.findByLabelText(/one-time password/i);
    expect(otpInput).toBeInTheDocument();

    // 3. Fill and submit OTP
    await userEvent.type(otpInput, '123456');
    await userEvent.click(screen.getByRole('button', { name: /verify & create account/i }));

    expect(mockRegisterVerify).toHaveBeenCalledWith('+15550199', '123456');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });
});
