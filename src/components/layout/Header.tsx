import { Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import tfsLogo from "@/assets/tfs-logo.png";

const navItems = [
  { name: "Dashboard", href: "/" },
  { name: "New Entry", href: "/new-entry" },
  { name: "Logs", href: "/logs" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-card">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={tfsLogo} alt="TFS Demolition" className="h-12 w-12 object-contain" />
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight text-foreground">TFS Demolition</span>
            <span className="text-xs text-muted-foreground">Driver Runsheets</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.name}
            </Link>
          ))}
          {user && (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-2">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border bg-card animate-fade-in">
          <div className="container py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.name}
              </Link>
            ))}
            {user && (
              <Button variant="ghost" onClick={handleSignOut} className="justify-start px-4">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
