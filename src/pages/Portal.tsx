import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Briefcase, ClipboardList } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

const Portal = () => {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const portalOptions = [
    {
      title: "Site Safety",
      description: "Access site documents, SWMS, inductions, and project enrollments",
      icon: Shield,
      href: "/site-safety",
      color: "bg-success/10 text-success",
    },
    {
      title: "My Employment",
      description: "View timesheets, training records, and employment documents",
      icon: Briefcase,
      href: "/my-employment",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Run Sheets",
      description: "Complete and submit daily runsheets for assets and jobs",
      icon: ClipboardList,
      href: "/runsheets",
      color: "bg-secondary/10 text-secondary",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 sm:py-10 px-3 sm:px-4 safe-area-bottom">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              TFS Portal
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Select a module to continue
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {portalOptions.map((option) => (
              <Link key={option.href} to={option.href} className="block">
                <Card className="h-full transition-all duration-200 hover:shadow-elevated hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/30">
                  <CardHeader className="text-center pb-2 sm:pb-4">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-xl ${option.color} flex items-center justify-center mb-3 sm:mb-4`}>
                      <option.icon className="h-7 w-7 sm:h-8 sm:w-8" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">{option.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-center text-xs sm:text-sm">
                      {option.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      
      <InstallPrompt />
    </div>
  );
};

export default Portal;
