import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  ShoppingBag,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "About", href: "/#about" },
] as const;

interface NavItemsProps {
  onNavigate?: () => void;
}

function NavItems({ onNavigate }: NavItemsProps) {
  return (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          onClick={onNavigate}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}

interface AuthButtonsProps {
  user: { name: string } | null;
  isAuthenticated: boolean;
  onLogout: () => void;
}

function AuthButtons({ user, isAuthenticated, onLogout }: AuthButtonsProps) {
  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {user?.name}
        </span>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard">
            <LayoutDashboard className="mr-1 size-4" />
            Dashboard
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="mr-1 size-4" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/login">Login</Link>
      </Button>
      <Button size="sm" asChild>
        <Link to="/register">Register</Link>
      </Button>
    </div>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <ShoppingBag className="size-5" />
          <span className="hidden sm:inline">ShopHub</span>
        </Link>

        <nav className="ml-8 hidden items-center gap-6 md:flex">
          <NavItems />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex">
            <AuthButtons
              user={user}
              isAuthenticated={isAuthenticated}
              onLogout={handleLogout}
            />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="size-5" />
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  3
                </span>
                <span className="sr-only">Open Cart</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-full flex-col sm:max-w-lg"
            >
              <div className="flex items-center justify-between pb-4 border-b">
                <h2 className="text-lg font-semibold">Shopping Cart</h2>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                {/* Mock Cart Items */}
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center gap-4">
                      <div className="h-16 w-16 shrink-0 rounded bg-muted overflow-hidden">
                        <img
                          src={`https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80`}
                          alt="Product"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-1">
                          Premium Wireless Headphones
                        </h4>
                        <p className="text-sm text-muted-foreground">Qty: 1</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">$199.99</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 mt-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>$599.97</span>
                </div>
                <Button className="w-full">Checkout</Button>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-4 pt-8">
                <NavItems onNavigate={closeMenu} />
                <Separator className="my-2" />
                <div className="flex flex-col gap-2">
                  <AuthButtons
                    user={user}
                    isAuthenticated={isAuthenticated}
                    onLogout={handleLogout}
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
