import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Clock, GraduationCap, Construction, DollarSign, Upload } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { PayslipsList } from "@/components/employment/PayslipsList";
import { PayslipUploadDialog } from "@/components/employment/PayslipUploadDialog";
import { AdminPayslipsList } from "@/components/employment/AdminPayslipsList";

const MyEmployment = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("payslips");

  // Check if user is admin/manager
  const { data: isAdmin } = useQuery({
    queryKey: ["has-management-access", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .in("role", ["admin", "manager"]);
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
  });

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

  const upcomingFeatures = [
    {
      title: "Timesheets",
      description: "View and submit timesheets",
      icon: Clock,
      status: "Coming Soon",
    },
    {
      title: "Training Records",
      description: "Track certifications and training",
      icon: GraduationCap,
      status: "Coming Soon",
    },
    {
      title: "Employment Documents",
      description: "Access employment contracts and policies",
      icon: FileText,
      status: "Coming Soon",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-4 sm:py-6 px-3 sm:px-4 space-y-4 sm:space-y-6 safe-area-bottom">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                My Employment
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage payslips, timesheets, training & documents
              </p>
            </div>
          </div>

          {/* Admin Upload Button */}
          {isAdmin && activeTab === "payslips" && (
            <PayslipUploadDialog
              trigger={
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Payslip
                </Button>
              }
            />
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11 sm:h-10">
            <TabsTrigger value="payslips" className="text-xs sm:text-sm gap-2">
              <DollarSign className="h-4 w-4" />
              Payslips
            </TabsTrigger>
            <TabsTrigger value="more" className="text-xs sm:text-sm gap-2">
              <Construction className="h-4 w-4" />
              Coming Soon
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payslips" className="mt-4 space-y-6">
            {/* User's Payslips */}
            <div>
              <h2 className="text-lg font-semibold mb-4">My Payslips</h2>
              <PayslipsList />
            </div>

            {/* Admin: All Payslips */}
            {isAdmin && (
              <div>
                <AdminPayslipsList />
              </div>
            )}
          </TabsContent>

          <TabsContent value="more" className="mt-4">
            {/* Under Construction */}
            <Card className="border-dashed mb-6">
              <CardContent className="py-12 text-center">
                <Construction className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  More Features Coming Soon
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Additional employment features are currently under development. 
                  Check back soon for timesheet management, training records, and employment documents.
                </p>
              </CardContent>
            </Card>

            {/* Feature Preview */}
            <div className="grid gap-4 sm:grid-cols-3">
              {upcomingFeatures.map((feature) => (
                <Card key={feature.title} className="opacity-60">
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 mx-auto rounded-lg bg-muted flex items-center justify-center mb-2">
                      <feature.icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-center text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MyEmployment;
