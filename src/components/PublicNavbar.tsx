import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavbarBackground } from "@/components/NavbarBackground";
import {
  Heart, Menu, GraduationCap, Building2, Home, BookOpen
} from "lucide-react";
import brandLogo from "@/assets/brand-logo.png";

interface PublicNavbarProps {
  showHomeButton?: boolean;
  currentPage?: 'organizations' | 'specialists' | 'parents' | 'auth' | 'landing' | 'catalog-specialists' | 'catalog-organizations' | 'privacy' | 'partnership' | 'instructions' | 'other';
  showSecondaryNav?: boolean;
  authLink?: string;
}

export function PublicNavbar({
  showHomeButton = true,
  currentPage,
  showSecondaryNav = true,
  authLink = '/auth'
}: PublicNavbarProps) {
  const { t } = useTranslation();
  const isSpecialistsCatalog = currentPage === 'catalog-specialists';
  const isOrganizationsCatalog = currentPage === 'catalog-organizations';

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
              className={`text-sm ${currentPage === 'organizations' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
            >
              {t('nav.organizations')}
            </Link>
            <Link
              to="/for-specialists"
              className={`text-sm ${currentPage === 'specialists' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
            >
              {t('nav.specialists')}
            </Link>
            <Link
              to="/for-parents"
              className={`text-sm ${currentPage === 'parents' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
            >
              {t('nav.parents')}
            </Link>
            <span className="h-5 w-px bg-border mx-2" aria-hidden="true" />
            <Link
              to="/instructions"
              className={`text-sm ${currentPage === 'instructions' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
            >
              {t('nav.instructions')}
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <Link to={authLink}>
              <Button size="sm">{t('nav.login')}</Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageToggle />
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label={t('nav.menu')}>
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>{t('nav.menu')}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground px-3">{t('nav.catalog')}</p>
                    <Link
                      to="/specialists"
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSpecialistsCatalog ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                    >
                      <GraduationCap className="h-4 w-4" />
                      {t('nav.findSpecialist')}
                    </Link>
                    <Link
                      to="/organizations"
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${currentPage === 'organizations' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                    >
                      <Building2 className="h-4 w-4" />
                      {t('nav.organizations')}
                    </Link>
                    <Link
                      to="/for-specialists"
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${currentPage === 'specialists' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                    >
                      <GraduationCap className="h-4 w-4" />
                      {t('nav.specialists')}
                    </Link>
                    <Link
                      to="/for-parents"
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${currentPage === 'parents' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                    >
                      <Heart className="h-4 w-4" />
                      {t('nav.parents')}
                    </Link>
                    <Link
                      to="/instructions"
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${currentPage === 'instructions' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                    >
                      <BookOpen className="h-4 w-4" />
                      {t('nav.instructions')}
                    </Link>
                  </div>

                  {showHomeButton && (
                    <div className="border-t pt-4">
                      <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <Home className="h-4 w-4" />
                        {t('nav.home')}
                      </Link>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <Link to={authLink} className="block">
                      <Button className="w-full">{t('nav.login')}</Button>
                    </Link>
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
