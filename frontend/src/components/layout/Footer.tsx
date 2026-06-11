import { Link } from 'react-router-dom';
import { ShoppingBag, Mail, MapPin, Phone } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const footerLinks = {
  shop: [
    { label: 'All Products', href: '/' },
    { label: 'Categories', href: '/' },
    { label: 'Deals', href: '/' },
    { label: 'New Arrivals', href: '/' },
  ],
  company: [
    { label: 'About Us', href: '/' },
    { label: 'Careers', href: '/' },
    { label: 'Blog', href: '/' },
    { label: 'Press', href: '/' },
  ],
  support: [
    { label: 'Help Center', href: '/' },
    { label: 'Contact Us', href: '/' },
    { label: 'Shipping', href: '/' },
    { label: 'Returns', href: '/' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <ShoppingBag className="size-5" />
              <span>ShopHub</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your one-stop shop for everything you need. Quality products, fast delivery.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="size-4" />
                <span>support@shophub.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-4 text-sm font-semibold capitalize">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} ShopHub. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/" className="hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
