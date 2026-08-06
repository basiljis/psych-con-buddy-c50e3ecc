import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavbarBackground } from "@/components/NavbarBackground";
import { supabase } from "@/integrations/supabase/client";
import {
  Heart, Menu, GraduationCap, Building2, Home, BookOpen, Scale, Newspaper, Wallet, UserPlus, LayoutDashboard
} from "lucide-react";
import brandLogo from "@/assets/brand-logo.png";

interface PublicNavbarProps {
  showHomeButton?: boolean;
  currentPage?: 'organizations' | 'specialists' | 'parents' | 'auth' | 'landing' | 'catalog-specialists' | 'catalog-organizations' | 'privacy' | 'partnership' | 'instructions' | 'legal' | 'blog' | 'other';
  showSecondaryNav?: boolean;
  authLink?: string;
}

type PageKey = NonNullable<PublicNavbarProps['currentPage']>;

function getPageKeyFromPath(pathname: string): PageKey {
  const path = pathname.toLowerCase();
  if (path.startsWith('/for-organizations')) return 'organizations';
  if (path.startsWith('/for-specialists')) return 'specialists';
  if (path.startsWith('/for-parents')) return 'parents';
  if (path.startsWith('/specialists')) return 'catalog-specialists';
  if (path.startsWith('/organizations')) return 'catalog-organizations';
  if (path.startsWith('/instructions')) return 'instructions';
  if (path.startsWith('/legal')) return 'legal';
  if (path.startsWith('/blog')) return 'blog';
  if (path.startsWith('/auth')) return 'auth';
  if (path === '/' || path.startsWith('/landing')) return 'landing';
  if (path.startsWith('/privacy')) return 'privacy';
  if (path.startsWith('/partnership')) return 'partnership';
  return 'other';
}

export function PublicNavbar({
  showHomeButton = true,
  currentPage,
  showSecondaryNav = true,
  authLink = '/auth'
}: PublicNavbarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobileMenu = () => setMobileOpen(false);
  const activePage = currentPage ?? getPageKeyFromPath(location.pathname);
  const isSpecialistsCatalog = activePage === 'catalog-specialists';
  const isOrganizationsCatalog = activePage === 'catalog-organizations';

  // Если пользователь уже вошёл — показываем возврат в кабинет вместо «Войти»
  const [cabinetPath, setCabinetPath] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const resolve = async (userId: string | null) => {
      if (!mounted) return;
      if (!userId) {
        setCabinetPath(null);
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (!mounted) return;
      const isParent = roles?.some((r: { role: string }) => r.role === "parent");
      setCabinetPath(isParent ? "/parent" : "/app");
    };

    supabase.auth.getSession().then(({ data }) => resolve(data?.session?.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      resolve(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);



  return (
    <>
      {/* Main Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <NavbarBackground />
        <div className="container mx-auto flex h-16 items-center px-4 relative z-10">
          <Link to="/" className="flex items-center gap-2">
            <img src={brandLogo} alt="universum. — логотип образовательной платформы" className="h-9 w-9 object-contain" />
            <span className="text-xl font-bold">universum.</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
            <Link
              to="/for-organizations"
              className={`text-sm ${activePage === 'organizations' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
            >
              {t('nav.organizations')}
            </Link>
            <Link
              to="/for-specialists"
              className={`text-sm ${activePage === 'specialists' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
            >
              {t('nav.specialists')}
            </Link>
            <Link
              to="/for-parents"
              className={`text-sm ${activePage === 'parents' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
            >
              {t('nav.parents')}
            </Link>
            <span className="h-5 w-px bg-border mx-2" aria-hidden="true" />
            <Link
              to="/instructions"
              className={`text-sm ${activePage === 'instructions' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
            >
              {t('nav.instructions')}
            </Link>
            <Link
              to="/legal"
              className={`text-sm ${activePage === 'legal' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
            >
              {t('nav.legal')}
            </Link>
            <Link
              to="/blog"
              className={`text-sm ${activePage === 'blog' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
            >
              {t('nav.blog')}
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            {cabinetPath ? (
              <Link to={cabinetPath}>
                <Button size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  {t('nav.cabinet', 'В кабинет')}
                </Button>
              </Link>
            ) : (
              <Link to={authLink}>
                <Button size="sm">{t('nav.login')}</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageToggle />
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label={t('nav.menu')}>
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-80 max-w-[90vw] flex flex-col p-0 gap-0"
                onInteractOutside={closeMobileMenu}
                onEscapeKeyDown={closeMobileMenu}
              >
                <SheetHeader className="px-6 pt-6 pb-3 shrink-0 border-b">
                  <SheetTitle>{t('nav.menu')}</SheetTitle>
                </SheetHeader>
                <div
                  className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-10 pt-4"
                  style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground px-3">{t('nav.catalog')}</p>
                      <Link
                        to="/specialists"
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSpecialistsCatalog ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                      >
                        <GraduationCap className="h-4 w-4" />
                        {t('nav.findSpecialist')}
                      </Link>
                      <Link
                        to="/organizations"
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isOrganizationsCatalog ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                      >
                        <Building2 className="h-4 w-4" />
                        {t('nav.findOrganization')}
                      </Link>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground px-3">{t('nav.info')}</p>
                      <Link
                        to="/for-organizations"
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'organizations' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                      >
                        <Building2 className="h-4 w-4" />
                        {t('nav.organizations')}
                      </Link>
                      <Link
                        to="/for-specialists"
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'specialists' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                      >
                        <GraduationCap className="h-4 w-4" />
                        {t('nav.specialists')}
                      </Link>
                      <Link
                        to="/for-parents"
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'parents' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                      >
                        <Heart className="h-4 w-4" />
                        {t('nav.parents')}
                      </Link>
                      <Link
                        to="/pricing"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted"
                      >
                        <Wallet className="h-4 w-4" />
                        {t('nav.pricing', 'Тарифы')}
                      </Link>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground px-3">{t('nav.resources', 'Ресурсы')}</p>
                      <Link
                        to="/blog"
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'blog' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                      >
                        <Newspaper className="h-4 w-4" />
                        {t('nav.blog')}
                      </Link>
                      <Link
                        to="/instructions"
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'instructions' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                      >
                        <BookOpen className="h-4 w-4" />
                        {t('nav.instructions')}
                      </Link>
                      <Link
                        to="/legal"
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'legal' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                      >
                        <Scale className="h-4 w-4" />
                        {t('nav.legal')}
                      </Link>
                    </div>

                    {showHomeButton && (
                      <div className="border-t pt-4">
                        <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                          <Home className="h-4 w-4" />
                          {t('nav.home')}
                        </Link>
                      </div>
                    )}

                    <div className="border-t pt-4 space-y-2">
                      {cabinetPath ? (
                        <Link to={cabinetPath} onClick={closeMobileMenu} className="block">
                          <Button className="w-full gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            {t('nav.cabinet', 'В кабинет')}
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Link to={authLink} onClick={closeMobileMenu} className="block">
                            <Button className="w-full">{t('nav.login')}</Button>
                          </Link>
                          <Link to="/register" onClick={closeMobileMenu} className="block">
                            <Button variant="outline" className="w-full gap-2">
                              <UserPlus className="h-4 w-4" />
                              {t('nav.register', 'Регистрация')}
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Secondary navigation bar */}
      {showSecondaryNav && (
        <div className="hidden md:block fixed top-16 left-0 right-0 z-40 bg-muted/50 backdrop-blur border-b">
          <div className="container mx-auto flex h-10 items-center justify-center gap-6 px-4">
            <Link
              to="/specialists"
              className={`text-sm transition-colors flex items-center gap-1.5 ${isSpecialistsCatalog ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              {t('nav.findSpecialist')}
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <Link
              to="/organizations"
              className={`text-sm transition-colors flex items-center gap-1.5 ${isOrganizationsCatalog ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Building2 className="h-3.5 w-3.5" />
              {t('nav.findOrganization')}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

// Simplified search bar component
export function SearchNavBar({ currentPage }: { currentPage?: 'specialists' | 'organizations' }) {
  const { t } = useTranslation();
  return (
    <div className="hidden md:block fixed top-16 left-0 right-0 z-40 bg-muted/50 backdrop-blur border-b">
      <div className="container mx-auto flex h-10 items-center justify-center gap-6 px-4">
        <Link
          to="/specialists"
          className={`text-sm transition-colors flex items-center gap-1.5 ${currentPage === 'specialists' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <GraduationCap className="h-3.5 w-3.5" />
          {t('nav.findSpecialist')}
        </Link>
        <span className="text-muted-foreground/30">|</span>
        <Link
          to="/organizations"
          className={`text-sm transition-colors flex items-center gap-1.5 ${currentPage === 'organizations' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Building2 className="h-3.5 w-3.5" />
          {t('nav.findOrganization')}
        </Link>
      </div>
    </div>
  );
}
