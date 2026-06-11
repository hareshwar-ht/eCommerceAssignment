import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ProtectedRoute, GuestRoute } from "./guards";
import { PageLoader } from "@/components/ui/spinner";

const HomePage = lazy(() => import("@/pages/HomePage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));

function withSuspense(element: React.ReactElement) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(<HomePage />),
  },
  {
    path: "/login",
    element: withSuspense(
      <GuestRoute>
        <LoginPage />
      </GuestRoute>,
    ),
  },
  {
    path: "/register",
    element: withSuspense(
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>,
    ),
  },
  {
    path: "/dashboard",
    element: withSuspense(
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>,
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
