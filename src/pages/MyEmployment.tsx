import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Clock, GraduationCap, Construction, DollarSign, Shield, Users } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { PayslipsList } from "@/components/employment/PayslipsList";
import Timesheets from "./Timesheets";
import { PayslipUploadDialog } from "@/components/employment/PayslipUploadDialog";
import { AdminPayslipsList } from "@/components/employment/AdminPayslipsList";
import { UserManagement } from "@/components/admin/UserManagement";

const MyEmployment = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("payslips");

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
                Manage payslips & timesheets
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full h-11 sm:h-10 grid-cols-2">
            <TabsTrigger value="payslips" className="text-xs sm:text-sm gap-2">
              <DollarSign className="h-4 w-4" />
              Payslips
            </TabsTrigger>
             <TabsTrigger value="timesheets" className="text-xs sm:text-sm gap-2">
              <Clock className="h-4 w-4" />
              Timesheets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payslips" className="mt-4 space-y-6">
            {/* User's Payslips */}
            <div>
              <h2 className="text-lg font-semibold mb-4">My Payslips</h2>
              <PayslipsList />
            </div>
          </TabsContent>

          <TabsContent value="timesheets" className="mt-4">
             <Timesheets embedded />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MyEmployment;
