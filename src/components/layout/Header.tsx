import { Menu, X, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import tfsLogo from "@/assets/tfs-logo.png";

const getNavItems = (pathname: string) => {
  // Show context-aware navigation based on current section
  if (pathname.startsWith("/site-safety")) {
    return [
      { name: "Portal", href: "/" },
      { name: "Site Safety", href: "/site-safety" },
    ];
  }
  if (pathname.startsWith("/my-employment")) {
    return [
      { name: "Portal", href: "/" },
      { name: "My Employment", href: "/my-employment" },
    ];
  }
  if (pathname.startsWith("/runsheets") || pathname.startsWith("/new-entry") || pathname.startsWith("/logs")) {
    return [
      { name: "Portal", href: "/" },
      { name: "Run Sheets", href: "/runsheets" },
      { name: "New Entry", href: "/new-entry" },
      { name: "Logs", href: "/logs" },
    ];
  }
  return [
    { name: "Portal", href: "/" },
  ];
};

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const navItems = getNavItems(location.pathname);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-card safe-area-top">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        <Link to="/" className="flex items-center gap-2 sm:gap-3">
          <img src={tfsLogo} alt="TFS Demolition" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold leading-tight text-foreground">TFS Demolition</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">Driver Portal</span>
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
          className="md:hidden h-10 w-10 touch-target"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border bg-card animate-fade-in safe-area-bottom">
          <div className="container py-3 px-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3.5 rounded-lg text-base font-medium transition-colors touch-target ${
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted"
                }`}
              >
                {item.name}
              </Link>
            ))}
            {user && (
              <Button 
                variant="ghost" 
                onClick={handleSignOut} 
                className="justify-start px-4 py-3.5 h-auto text-base touch-target"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </Button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
