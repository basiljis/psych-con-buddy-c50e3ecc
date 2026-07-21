import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { DataProcessingAgreement } from "@/components/DataProcessingAgreement";
import { Checkbox } from "@/components/ui/checkbox";
import { SystemInfoDialog } from "@/components/SystemInfoDialog";
import { SupportDialog } from "@/components/SupportDialog";
import { AuthFooter } from "@/components/AuthFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { fetchSystemSetting } from "@/hooks/useSystemSetting";
import { AutoApproveStatusHint } from "@/components/AutoApproveStatusHint";

// Positions excluded for private practice
const EXCLUDED_POSITIONS = [
  "медицинский работник",
  "председатель ппк",
  "руководитель организации",
  "секретарь ппк"
];

const Auth = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect if already authenticated
  if (user) {
    navigate("/");
    return null;
  }

  // Localized validation schemas
  const signupSchema = z.object({
    fullName: z.string()
      .trim()
      .min(1, t('validation.fullNameRequired'))
      .max(200, t('validation.fullNameTooLong'))
      .regex(/^[а-яА-ЯёЁa-zA-Z\s\-]+$/, t('validation.fullNameInvalid')),
    phone: z.string()
      .regex(/^\+?7[0-9]{10}$/, t('validation.phoneInvalid'))
      .transform(val => val.replace(/[^0-9+]/g, '')),
    email: z.string()
      .trim()
      .email(t('validation.emailInvalid'))
      .max(255, t('validation.emailTooLong')),
    password: z.string()
      .min(8, t('validation.passwordMin'))
      .regex(/[A-ZА-Я]/, t('validation.passwordUppercase'))
      .regex(/[0-9]/, t('validation.passwordDigit')),
    positionId: z.string().min(1, t('validation.positionRequired')),
    regionId: z.string().min(1, t('validation.regionRequired')),
    organizationId: z.string().min(1, t('validation.organizationRequired')),
    role: z.enum(["user", "regional_operator", "admin"], { 
      errorMap: () => ({ message: t('validation.roleRequired') })
    }),
    dataProcessingConsent: z.boolean().refine(val => val === true, {
      message: t('validation.consentRequired')
    }),
  });

  const privateSignupSchema = z.object({
    fullName: z.string()
      .trim()
      .min(1, t('validation.fullNameRequired'))
      .max(200, t('validation.fullNameTooLong'))
      .regex(/^[а-яА-ЯёЁa-zA-Z\s\-]+$/, t('validation.fullNameInvalid')),
    phone: z.string()
      .regex(/^\+?7[0-9]{10}$/, t('validation.phoneInvalid'))
      .transform(val => val.replace(/[^0-9+]/g, '')),
    email: z.string()
      .trim()
      .email(t('validation.emailInvalid'))
      .max(255, t('validation.emailTooLong')),
    password: z.string()
      .min(8, t('validation.passwordMin'))
      .regex(/[A-ZА-Я]/, t('validation.passwordUppercase'))
      .regex(/[0-9]/, t('validation.passwordDigit')),
    positionId: z.string().min(1, t('validation.positionRequired')),
    regionId: z.string().min(1, t('validation.regionRequired')),
    dataProcessingConsent: z.boolean().refine(val => val === true, {
      message: t('validation.consentRequired')
    }),
  });

  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupData, setSignupData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    positionId: "",
    regionId: "",
    organizationId: "",
    role: "user" as "user" | "regional_operator" | "admin",
    dataProcessingConsent: false,
  });

  // Validation errors
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // Reset password form
  const [resetEmail, setResetEmail] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  // Success dialog for registration
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  
  // Welcome dialog for login
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
  const [welcomeUserName, setWelcomeUserName] = useState("");

  // Registration mode: 'organization' or 'private'
  const [searchParams] = useSearchParams();
  const [registrationMode, setRegistrationMode] = useState<'organization' | 'private'>(
    searchParams.get('mode') === 'organization' ? 'organization' : 'private'
  );

  // Sync mode from URL on change
  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'organization' || m === 'private') setRegistrationMode(m);
  }, [searchParams]);
  
  // Private signup form
  const [privateSignupData, setPrivateSignupData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    positionId: "",
    regionId: "",
    dataProcessingConsent: false,
  });
  
  const [privateSignupErrors, setPrivateSignupErrors] = useState<Record<string, string>>({});

  // Load reference data
  useEffect(() => {
    const loadRefData = async () => {
      const [regionsRes, positionsRes] = await Promise.all([
        supabase.from("regions").select("*").order("name"),
        supabase.from("positions").select("*").order("name"),
      ]);

      if (regionsRes.data) setRegions(regionsRes.data);
      if (positionsRes.data) setPositions(positionsRes.data);
    };
    loadRefData();
  }, []);
  
  // Filter positions for private practice (exclude certain roles)
  const privatePositions = positions.filter(
    p => !EXCLUDED_POSITIONS.includes(p.name.toLowerCase())
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      // Check if user is blocked
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_blocked")
        .eq("id", data.user.id)
        .single();

      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        toast({
          title: t('errors.blockedTitle'),
          description: t('errors.blockedDescription'),
          variant: "destructive",
        });
        return;
      }

      // Get user profile for name
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.user.id)
        .single();

      // If access request is pending/rejected, redirect to status page
      const { data: reqs } = await supabase
        .from("access_requests")
        .select("status")
        .eq("user_id", data.user.id)
        .order("requested_at", { ascending: false })
        .limit(1);
      const request = reqs?.[0];
      if (request && request.status !== "approved") {
        navigate("/access-status");
        return;
      }

      // Show welcome dialog
      setWelcomeUserName(userProfile?.full_name || t('user.fallbackName'));
      setWelcomeDialogOpen(true);
    } catch (error: any) {
      toast({
        title: t('errors.loginErrorTitle'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSignupErrors({});

    try {
      // Validate form data
      const result = signupSchema.safeParse(signupData);
      
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const path = issue.path[0] as string;
          errors[path] = issue.message;
        });
        setSignupErrors(errors);
        setLoading(false);
        return;
      }
      
      const validatedData = result.data;

      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', validatedData.email)
        .maybeSingle();

      if (checkError) {
        console.error('[Auth] Error checking existing user:', checkError);
      }

      if (existingUser) {
        toast({
          title: t('errors.emailExistsTitle'),
          description: t('errors.emailExistsDescription'),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: validatedData.fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error(t('errors.userCreateError'));

      // Check global setting: auto-approve org users (skip admin validation)
      const autoApprove = await fetchSystemSetting<boolean>(
        'auto_approve_org_users',
        true
      );

      if (autoApprove) {
        // Direct profile creation — no access request
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          full_name: validatedData.fullName,
          phone: validatedData.phone,
          email: validatedData.email,
          position_id: validatedData.positionId,
          region_id: validatedData.regionId,
          organization_id: validatedData.organizationId,
          is_blocked: false,
        });
        if (profileError) throw profileError;

        // Assign chosen role directly
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          role: validatedData.role,
        });
        if (roleError) throw roleError;
      } else {
        // Legacy flow: create access request for manual approval
        const { error: requestError } = await supabase.from("access_requests").insert({
          user_id: authData.user.id,
          full_name: validatedData.fullName,
          phone: validatedData.phone,
          email: validatedData.email,
          position_id: validatedData.positionId,
          region_id: validatedData.regionId,
          organization_id: validatedData.organizationId,
          role: validatedData.role,
          status: "pending",
        });
        if (requestError) throw requestError;
      }

      // Send registration confirmation email
      try {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", validatedData.organizationId)
          .single();

        await supabase.functions.invoke('send-registration-email', {
          body: {
            email: validatedData.email,
            fullName: validatedData.fullName,
            organizationName: orgData?.name,
          },
        });
      } catch (emailError) {
        console.error("Error sending registration email:", emailError);
        // Don't fail registration if email fails
      }

      if (autoApprove) {
        toast({
          title: t('errors.signupSuccessTitle'),
          description: t('errors.signupSuccessDescription'),
        });
        navigate("/");
      } else {
        // Save pending_user_id for status page
        console.log("[Auth] Saving pending_user_id to localStorage:", authData.user.id);
        localStorage.setItem("pending_user_id", authData.user.id);

        // Show success modal
        setSuccessDialogOpen(true);

        // Auto-close modal and navigate to status page after 5 seconds
        setTimeout(() => {
          setSuccessDialogOpen(false);
          console.log("[Auth] Navigating to /access-status");
          navigate("/access-status");
        }, 5000);
      }

      // Clear form
      setSignupData({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        positionId: "",
        regionId: "",
        organizationId: "",
        role: "user",
        dataProcessingConsent: false,
      });
    } catch (error: any) {
      toast({
        title: t('errors.signupErrorTitle'),
        description: error.message || t('errors.registrationFailed'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrivateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPrivateSignupErrors({});

    try {
      // Validate form data
      const result = privateSignupSchema.safeParse(privateSignupData);
      
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const path = issue.path[0] as string;
          errors[path] = issue.message;
        });
        setPrivateSignupErrors(errors);
        setLoading(false);
        return;
      }
      
      const validatedData = result.data;

      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', validatedData.email)
        .maybeSingle();

      if (checkError) {
        console.error('[Auth] Error checking existing user:', checkError);
      }

      if (existingUser) {
        toast({
          title: t('errors.emailExistsTitle'),
          description: t('errors.emailExistsDescription'),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: validatedData.fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error(t('errors.userCreateError'));

      // Create profile directly for private specialists (no access request needed)
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        full_name: validatedData.fullName,
        phone: validatedData.phone,
        email: validatedData.email,
        position_id: validatedData.positionId,
        region_id: validatedData.regionId,
        organization_id: null, // No organization for private specialists
        is_blocked: false,
      });

      if (profileError) throw profileError;

      // Assign private_specialist role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role: 'private_specialist',
      });

      if (roleError) throw roleError;

      // Send registration confirmation email
      try {
        await supabase.functions.invoke('send-registration-email', {
          body: {
            email: validatedData.email,
            fullName: validatedData.fullName,
            organizationName: t('signup.organizationNamePrivate'),
          },
        });
      } catch (emailError) {
        console.error("Error sending registration email:", emailError);
      }

      toast({
        title: t('errors.signupSuccessTitle'),
        description: t('errors.signupSuccessDescription'),
      });

      // Clear form and switch to login
      setPrivateSignupData({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        positionId: "",
        regionId: "",
        dataProcessingConsent: false,
      });
      
      // Navigate to main app
      navigate("/");
    } catch (error: any) {
      toast({
        title: t('errors.signupErrorTitle'),
        description: error.message || t('errors.registrationFailed'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValue = resetEmail?.trim() || "";
    
    if (!emailValue) {
      toast({
        title: t('errors.errorTitle'),
        description: t('errors.resetEmailRequired'),
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      toast({
        title: t('errors.errorTitle'),
        description: t('errors.resetEmailInvalid'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: t('errors.resetEmailSentTitle'),
        description: t('errors.resetEmailSentDescription'),
      });
      setResetEmail("");
      setResetDialogOpen(false);
    } catch (error: any) {
      toast({
        title: t('errors.resetErrorTitle'),
        description: error.message || t('errors.resetErrorDescription'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar currentPage="auth" />
      
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4 pt-32">
        
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-0 bg-background rounded-2xl shadow-2xl overflow-hidden">
        {/* Left side - Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
            <p className="text-muted-foreground text-lg">{t('tagline')}</p>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">{t('login.tab')}</TabsTrigger>
              <TabsTrigger value="signup">{t('signup.tab')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <h2 className="text-2xl font-bold mb-2">{t('login.title')}</h2>
              <p className="text-muted-foreground text-sm mb-6">{t('login.description')}</p>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium">{t('login.emailLabel')}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder={t('login.emailPlaceholder')}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium">{t('login.passwordLabel')}</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder={t('login.passwordPlaceholder')}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium" 
                  disabled={loading}
                >
                  {loading ? t('login.submitLoading') : t('login.submit')}
                </Button>
                
                <div className="space-y-2">
                  <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="w-full text-sm text-muted-foreground hover:text-primary">
                        {t('forgotPassword.trigger')}
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('forgotPassword.title')}</DialogTitle>
                      <DialogDescription>
                        {t('forgotPassword.description')}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">{t('forgotPassword.emailLabel')}</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder={t('forgotPassword.emailPlaceholder')}
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? t('forgotPassword.submitLoading') : t('forgotPassword.submit')}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                
                <div className="space-y-2">
                  <SystemInfoDialog />
                  <SupportDialog />
                </div>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <h2 className="text-2xl font-bold mb-2">{t('signup.title')}</h2>
              <p className="text-muted-foreground text-sm mb-4">{t('signup.description')}</p>
              
              {/* Registration mode tabs */}
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={registrationMode === 'private' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRegistrationMode('private')}
                  className="flex-1"
                >
                  {t('signup.mode.private')}
                </Button>
                <Button
                  type="button"
                  variant={registrationMode === 'organization' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRegistrationMode('organization')}
                  className="flex-1"
                >
                  {t('signup.mode.organization')}
                </Button>
              </div>

              {registrationMode === 'organization' ? (
                <form onSubmit={handleSignup} className="space-y-3">
                  <AutoApproveStatusHint mode="organization" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="fullName" className="text-sm">{t('signup.fullNameLabel')}</Label>
                      <Input
                        id="fullName"
                        value={signupData.fullName}
                        onChange={(e) => {
                          setSignupData({ ...signupData, fullName: e.target.value });
                          setSignupErrors({ ...signupErrors, fullName: "" });
                        }}
                        required
                        className={`h-10 ${signupErrors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      {signupErrors.fullName && (
                        <p className="text-sm text-destructive">{signupErrors.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm">{t('signup.phoneLabel')}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={t('signup.phonePlaceholder')}
                        value={signupData.phone}
                        onChange={(e) => {
                          setSignupData({ ...signupData, phone: e.target.value });
                          setSignupErrors({ ...signupErrors, phone: "" });
                        }}
                        required
                        className={`h-10 ${signupErrors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      {signupErrors.phone && (
                        <p className="text-sm text-destructive">{signupErrors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">{t('signup.emailLabel')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={signupData.email}
                        onChange={(e) => {
                          setSignupData({ ...signupData, email: e.target.value });
                          setSignupErrors({ ...signupErrors, email: "" });
                        }}
                        required
                        className={`h-10 ${signupErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      {signupErrors.email && (
                        <p className="text-sm text-destructive">{signupErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm">{t('signup.passwordLabel')}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={signupData.password}
                        onChange={(e) => {
                          setSignupData({ ...signupData, password: e.target.value });
                          setSignupErrors({ ...signupErrors, password: "" });
                        }}
                        required
                        className={`h-10 ${signupErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      {signupErrors.password && (
                        <p className="text-sm text-destructive">{signupErrors.password}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position" className="text-sm">{t('signup.positionLabel')}</Label>
                      <Select
                        value={signupData.positionId}
                        onValueChange={(value) => {
                          setSignupData({ ...signupData, positionId: value });
                          setSignupErrors({ ...signupErrors, positionId: "" });
                        }}
                        required
                      >
                        <SelectTrigger className={`h-10 ${signupErrors.positionId ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                          <SelectValue placeholder={t('signup.positionPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {positions.map((position) => (
                            <SelectItem key={position.id} value={position.id}>
                              {position.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {signupErrors.positionId && (
                        <p className="text-sm text-destructive">{signupErrors.positionId}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="region" className="text-sm">{t('signup.regionLabel')}</Label>
                      <Select
                        value={signupData.regionId}
                        onValueChange={(value) => {
                          setSignupData({ ...signupData, regionId: value });
                          setSignupErrors({ ...signupErrors, regionId: "" });
                        }}
                        required
                      >
                        <SelectTrigger className={`h-10 ${signupErrors.regionId ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                          <SelectValue placeholder={t('signup.regionPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map((region) => (
                            <SelectItem key={region.id} value={region.id}>
                              {region.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {signupErrors.regionId && (
                        <p className="text-sm text-destructive">{signupErrors.regionId}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm">{t('signup.roleLabel')}</Label>
                      <Select
                        value={signupData.role}
                        onValueChange={(value: "user" | "regional_operator" | "admin") => {
                          setSignupData({ ...signupData, role: value });
                          setSignupErrors({ ...signupErrors, role: "" });
                        }}
                        required
                      >
                        <SelectTrigger className={`h-10 ${signupErrors.role ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                          <SelectValue placeholder={t('signup.rolePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">{t('signup.role.user')}</SelectItem>
                          <SelectItem value="regional_operator">{t('signup.role.regional_operator')}</SelectItem>
                          <SelectItem value="admin">{t('signup.role.admin')}</SelectItem>
                        </SelectContent>
                      </Select>
                      {signupErrors.role && (
                        <p className="text-sm text-destructive">{signupErrors.role}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <OrganizationSelector
                        value={signupData.organizationId}
                        onChange={(value) => {
                          setSignupData({ ...signupData, organizationId: value });
                          setSignupErrors({ ...signupErrors, organizationId: "" });
                        }}
                        placeholder={t('signup.organizationPlaceholder')}
                        regionFilter={signupData.regionId}
                      />
                      {signupErrors.organizationId && (
                        <p className="text-sm text-destructive">{signupErrors.organizationId}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="dataProcessingConsent"
                          checked={signupData.dataProcessingConsent}
                          onCheckedChange={(checked) => {
                            setSignupData({ ...signupData, dataProcessingConsent: checked as boolean });
                            setSignupErrors({ ...signupErrors, dataProcessingConsent: "" });
                          }}
                          className={signupErrors.dataProcessingConsent ? "border-destructive" : ""}
                        />
                        <label
                          htmlFor="dataProcessingConsent"
                          className="text-sm leading-tight cursor-pointer"
                        >
                          {t('signup.dataConsentText')}{" "}
                          <DataProcessingAgreement />
                        </label>
                      </div>
                      {signupErrors.dataProcessingConsent && (
                        <p className="text-sm text-destructive">{signupErrors.dataProcessingConsent}</p>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium" 
                    disabled={loading}
                  >
                    {loading ? t('signup.submitLoading') : t('signup.submit')}
                  </Button>
                  
                  <div className="space-y-2">
                    <SystemInfoDialog />
                    <SupportDialog />
                  </div>
                </form>
              ) : (
                /* Private practice registration form */
                <form onSubmit={handlePrivateSignup} className="space-y-3">
                  <AutoApproveStatusHint mode="private" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="privateFullName" className="text-sm">{t('signup.fullNameLabel')}</Label>
                      <Input
                        id="privateFullName"
                        value={privateSignupData.fullName}
                        onChange={(e) => {
                          setPrivateSignupData({ ...privateSignupData, fullName: e.target.value });
                          setPrivateSignupErrors({ ...privateSignupErrors, fullName: "" });
                        }}
                        required
                        className={`h-10 ${privateSignupErrors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      {privateSignupErrors.fullName && (
                        <p className="text-sm text-destructive">{privateSignupErrors.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="privatePhone" className="text-sm">{t('signup.phoneLabel')}</Label>
                      <Input
                        id="privatePhone"
                        type="tel"
                        placeholder={t('signup.phonePlaceholder')}
                        value={privateSignupData.phone}
                        onChange={(e) => {
                          setPrivateSignupData({ ...privateSignupData, phone: e.target.value });
                          setPrivateSignupErrors({ ...privateSignupErrors, phone: "" });
                        }}
                        required
                        className={`h-10 ${privateSignupErrors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      {privateSignupErrors.phone && (
                        <p className="text-sm text-destructive">{privateSignupErrors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="privateEmail" className="text-sm">{t('signup.emailLabel')}</Label>
                      <Input
                        id="privateEmail"
                        type="email"
                        value={privateSignupData.email}
                        onChange={(e) => {
                          setPrivateSignupData({ ...privateSignupData, email: e.target.value });
                          setPrivateSignupErrors({ ...privateSignupErrors, email: "" });
                        }}
                        required
                        className={`h-10 ${privateSignupErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      {privateSignupErrors.email && (
                        <p className="text-sm text-destructive">{privateSignupErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="privatePassword" className="text-sm">{t('signup.passwordLabel')}</Label>
                      <Input
                        id="privatePassword"
                        type="password"
                        value={privateSignupData.password}
                        onChange={(e) => {
                          setPrivateSignupData({ ...privateSignupData, password: e.target.value });
                          setPrivateSignupErrors({ ...privateSignupErrors, password: "" });
                        }}
                        required
                        className={`h-10 ${privateSignupErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      {privateSignupErrors.password && (
                        <p className="text-sm text-destructive">{privateSignupErrors.password}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="privatePosition" className="text-sm">{t('signup.positionLabel')}</Label>
                      <Select
                        value={privateSignupData.positionId}
                        onValueChange={(value) => {
                          setPrivateSignupData({ ...privateSignupData, positionId: value });
                          setPrivateSignupErrors({ ...privateSignupErrors, positionId: "" });
                        }}
                        required
                      >
                        <SelectTrigger className={`h-10 ${privateSignupErrors.positionId ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                          <SelectValue placeholder={t('signup.positionPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {privatePositions.map((position) => (
                            <SelectItem key={position.id} value={position.id}>
                              {position.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {privateSignupErrors.positionId && (
                        <p className="text-sm text-destructive">{privateSignupErrors.positionId}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="privateRegion" className="text-sm">{t('signup.regionLabel')}</Label>
                      <Select
                        value={privateSignupData.regionId}
                        onValueChange={(value) => {
                          setPrivateSignupData({ ...privateSignupData, regionId: value });
                          setPrivateSignupErrors({ ...privateSignupErrors, regionId: "" });
                        }}
                        required
                      >
                        <SelectTrigger className={`h-10 ${privateSignupErrors.regionId ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                          <SelectValue placeholder={t('signup.regionPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map((region) => (
                            <SelectItem key={region.id} value={region.id}>
                              {region.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {privateSignupErrors.regionId && (
                        <p className="text-sm text-destructive">{privateSignupErrors.regionId}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="privateDataProcessingConsent"
                          checked={privateSignupData.dataProcessingConsent}
                          onCheckedChange={(checked) => {
                            setPrivateSignupData({ ...privateSignupData, dataProcessingConsent: checked as boolean });
                            setPrivateSignupErrors({ ...privateSignupErrors, dataProcessingConsent: "" });
                          }}
                          className={privateSignupErrors.dataProcessingConsent ? "border-destructive" : ""}
                        />
                        <label
                          htmlFor="privateDataProcessingConsent"
                          className="text-sm leading-tight cursor-pointer"
                        >
                          {t('signup.dataConsentText')}{" "}
                          <DataProcessingAgreement />
                        </label>
                      </div>
                      {privateSignupErrors.dataProcessingConsent && (
                        <p className="text-sm text-destructive">{privateSignupErrors.dataProcessingConsent}</p>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium" 
                    disabled={loading}
                  >
                    {loading ? t('signup.submitLoading') : t('signup.submit')}
                  </Button>
                  
                  <div className="space-y-2">
                    <SystemInfoDialog />
                    <SupportDialog />
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right side - Feature blocks */}
        <div className="hidden md:flex flex-col relative bg-gradient-to-br from-primary to-primary/80 p-8 justify-center">
          <div className="space-y-5">
            {/* Child Card Block - Core feature */}
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{t('feature.childCard.title')}</h3>
                  <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">{t('feature.childCard.badge')}</span>
                </div>
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-3">
                {t('feature.childCard.description')}
              </p>
              <div className="flex flex-wrap gap-2">
                {(t('feature.childCard.tags', { returnObjects: true }) as string[]).map((tag, index) => (
                  <span key={index} className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded">{tag}</span>
                ))}
              </div>
            </div>

            {/* Protocol PPK Block */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">{t('feature.protocol.title')}</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                {t('feature.protocol.description')}
              </p>
            </div>

            {/* Time Tracking Block */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">{t('feature.workLog.title')}</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                {t('feature.workLog.description')}
              </p>
            </div>

          </div>
        </div>
      </div>
    </main>

    {/* Success Dialog */}
    <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">{t('success.title')}</DialogTitle>
          <DialogDescription className="text-center pt-4 text-base leading-relaxed">
            {t('success.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => {
              setSuccessDialogOpen(false);
              navigate("/access-status");
            }}
            className="w-full"
          >
            {t('success.cta')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Welcome Dialog */}
    <Dialog open={welcomeDialogOpen} onOpenChange={(open) => {
      setWelcomeDialogOpen(open);
      if (!open) {
        // Navigate after closing dialog
        setTimeout(() => {
          navigate("/");
        }, 100);
      }
    }}>
      <DialogContent className="sm:max-w-xl bg-gradient-to-br from-background via-background to-primary/5 border-2 border-primary shadow-2xl">
        <DialogHeader className="space-y-4 pt-6">
          <div className="flex justify-center mb-4">
            <div className="relative w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary shadow-lg">
              <img 
                src="/lovable-uploads/f971f75e-c922-48b7-a527-0263972e4807.png" 
                alt={t('welcome.alt')} 
                className="w-20 h-20 object-contain"
              />
            </div>
          </div>
          <DialogTitle className="text-center text-3xl font-bold text-foreground">
            {t('welcome.title')}
          </DialogTitle>
          <DialogDescription className="text-center text-xl font-medium text-foreground pt-2">
            {welcomeUserName}
          </DialogDescription>
          <p className="text-center text-muted-foreground text-base pt-2">
            {t('welcome.subtitle')}
          </p>
        </DialogHeader>
        <div className="flex justify-center pt-6 pb-4">
          <Button
            onClick={() => {
              setWelcomeDialogOpen(false);
            }}
            className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg"
            size="lg"
          >
            {t('welcome.cta')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    
    <AuthFooter />
  </div>
  );
};

export default Auth;
