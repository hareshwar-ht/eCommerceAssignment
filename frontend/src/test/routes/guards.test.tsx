import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '@/context/auth-context';
import { ProtectedRoute, GuestRoute } from '@/routes/guards';
import type { User } from '@/types/auth';

function buildAuthContext(overrides: Partial<{
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}> = {}) {
  return {
    user: null as User | null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    registerInitiate: vi.fn(),
    registerVerify: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    deleteProfile: vi.fn(),
    ...overrides,
  };
}

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    render(
      <AuthContext.Provider value={buildAuthContext({ isAuthenticated: true, isLoading: false })}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={<ProtectedRoute><div>Dashboard</div></ProtectedRoute>}
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    render(
      <AuthContext.Provider value={buildAuthContext({ isAuthenticated: false, isLoading: false })}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={<ProtectedRoute><div>Dashboard</div></ProtectedRoute>}
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders nothing while loading', () => {
    const { container } = render(
      <AuthContext.Provider value={buildAuthContext({ isLoading: true })}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={<ProtectedRoute><div>Dashboard</div></ProtectedRoute>}
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('GuestRoute', () => {
  it('renders children when not authenticated', () => {
    render(
      <AuthContext.Provider value={buildAuthContext({ isAuthenticated: false, isLoading: false })}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<GuestRoute><div>Login</div></GuestRoute>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('redirects to /dashboard when already authenticated', () => {
    render(
      <AuthContext.Provider value={buildAuthContext({ isAuthenticated: true, isLoading: false })}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<GuestRoute><div>Login</div></GuestRoute>} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
