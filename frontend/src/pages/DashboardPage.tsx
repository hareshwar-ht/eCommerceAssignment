import { useState } from "react";
import {
  LogOut,
  LayoutDashboard,
  Package,
  Heart,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

import OverviewTab from "@/features/dashboard/OverviewTab";
import OrdersTab from "@/features/dashboard/OrdersTab";
import WishlistTab from "@/features/dashboard/WishlistTab";
import ProfileSettingsTab from "@/features/dashboard/ProfileSettingsTab";

const SIDEBAR_NAV = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    component: OverviewTab,
  },
  { id: "orders", label: "Orders", icon: Package, component: OrdersTab },
  { id: "wishlist", label: "Wishlist", icon: Heart, component: WishlistTab },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    component: ProfileSettingsTab,
  },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/", { replace: true });
  };

  const ActiveComponent =
    SIDEBAR_NAV.find((item) => item.id === activeTab)?.component || OverviewTab;

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                My Account
              </h1>
              <p className="mt-1 text-muted-foreground">
                Welcome back, {user?.name}. Manage your account here.
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 size-4" />
              Sign Out
            </Button>
          </div>

          <div className="flex flex-col gap-8 md:flex-row">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 shrink-0">
              <nav className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1 overflow-x-auto pb-4 md:pb-0">
                {SIDEBAR_NAV.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "secondary" : "ghost"}
                    className={`justify-start ${activeTab === item.id ? "bg-secondary font-medium" : ""}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon className="mr-2 size-4" />
                    {item.label}
                  </Button>
                ))}
              </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 rounded-xl border bg-background p-6 shadow-sm">
              <ActiveComponent />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
