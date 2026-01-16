import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import tfsLogo from "@/assets/tfs-logo.png";
import { getAuthErrorMessage } from "@/lib/auth-utils";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", fullName: "" });

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    
    if (error) {
      // For password reset, always show success to prevent email enumeration
      toast.success("Check your email", {
        description: "If an account exists with that email, you will receive a reset link.",
      });
      setShowForgotPassword(false);
      setResetEmail("");
    } else {
      toast.success("Check your email", {
        description: "We've sent you a password reset link.",
      });
      setShowForgotPassword(false);
      setResetEmail("");
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(loginData.email, loginData.password);
    
    if (error) {
      toast.error("Login failed", {
        description: getAuthErrorMessage(error),
      });
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (!signupData.fullName.trim()) {
      toast.error("Please enter your full name");
      setLoading(false);
      return;
    }
    
    const { error } = await signUp(signupData.email, signupData.password, signupData.fullName);
    
    if (error) {
      toast.error("Signup failed", {
        description: getAuthErrorMessage(error),
      });
    } else {
      toast.success("Account created successfully!", {
        description: "You can now log in with your credentials.",
      });
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4 safe-area-top safe-area-bottom">
      <Card className="w-full max-w-md shadow-elevated animate-slide-up">
        <CardHeader className="text-center pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <img src={tfsLogo} alt="TFS Demolition" className="h-14 w-14 sm:h-16 sm:w-16 object-contain" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">TFS Demolition</CardTitle>
          <CardDescription className="text-sm">Driver Runsheet Management System</CardDescription>
        </CardHeader>
        <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-11 sm:h-10">
              <TabsTrigger value="login" className="text-base sm:text-sm">Login</TabsTrigger>
              <TabsTrigger value="signup" className="text-base sm:text-sm">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="login-email" className="text-sm">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="driver@tfsdemolition.com.au"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    className="h-11 sm:h-10 text-base sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="login-password" className="text-sm">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    className="h-11 sm:h-10 text-base sm:text-sm"
                  />
                </div>
                <Button type="submit" className="w-full h-11 sm:h-10 text-base sm:text-sm touch-target" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-primary active:text-primary transition-colors touch-target"
                >
                  Forgot your password?
                </button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="signup-name" className="text-sm">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Smith"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    required
                    className="h-11 sm:h-10 text-base sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="signup-email" className="text-sm">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="driver@tfsdemolition.com.au"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                    className="h-11 sm:h-10 text-base sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="signup-password" className="text-sm">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                    minLength={6}
                    className="h-11 sm:h-10 text-base sm:text-sm"
                  />
                </div>
                <Button type="submit" className="w-full h-11 sm:h-10 text-base sm:text-sm touch-target" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          {showForgotPassword && (
            <div className="absolute inset-0 bg-background rounded-xl p-6 flex flex-col animate-fade-in">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>
              <h3 className="text-lg font-semibold mb-2">Reset Password</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleForgotPassword} className="space-y-4 flex-1">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="driver@tfsdemolition.com.au"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
