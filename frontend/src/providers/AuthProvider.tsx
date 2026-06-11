import { useState, useEffect, useCallback, type ReactNode } from "react";
import api, { setAccessToken } from "@/api/client";
import type { User, LoginInput, RegisterInput } from "@/types/auth";
import { AuthContext } from "@/context/auth-context";
import { SESSION_ACTIVE_KEY } from "@/config/constants";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Attempt to restore session from refresh-token cookie on app boot */
  useEffect(() => {
    let cancelled = false;

    const initSession = async () => {
      const sessionActive = localStorage.getItem(SESSION_ACTIVE_KEY) === "true";
      if (!sessionActive) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const response = await api.post("/api/user/refresh");
        const token: string = response.data.data.accessToken;
        setAccessToken(token);

        const profile = await api.get("/api/user/profile");
        if (!cancelled) {
          setUser(profile.data.data.user as User);
        }
      } catch {
        // No valid session — stay logged out
        setAccessToken(null);
        localStorage.removeItem(SESSION_ACTIVE_KEY);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void initSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (data: LoginInput) => {
    const response = await api.post("/api/user/login", data);
    const { user: userData, accessToken: token } = response.data.data as {
      user: User;
      accessToken: string;
    };
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem(SESSION_ACTIVE_KEY, "true");
  }, []);

  const registerInitiate = useCallback(async (data: RegisterInput) => {
    await api.post("/api/user/register/initiate", data);
  }, []);

  const registerVerify = useCallback(async (phone: string, otp: string) => {
    const response = await api.post("/api/user/register/verify", {
      phone,
      otp,
    });
    const { user: userData, accessToken: token } = response.data.data as {
      user: User;
      accessToken: string;
    };
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem(SESSION_ACTIVE_KEY, "true");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/user/logout");
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem(SESSION_ACTIVE_KEY);
    }
  }, []);

  const updateProfile = useCallback(
    async (data: { name: string; email: string; phone?: string }) => {
      const response = await api.put("/api/user/profile", data);
      setUser(response.data.data.user);
    },
    [],
  );

  const deleteProfile = useCallback(async () => {
    try {
      await api.delete("/api/user/profile");
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem(SESSION_ACTIVE_KEY);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerInitiate,
        registerVerify,
        logout,
        updateProfile,
        deleteProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
