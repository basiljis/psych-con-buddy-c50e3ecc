import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Heart } from "lucide-react";

interface AuthFooterProps {
  mode?: "teacher" | "parent";
}

interface Section {
  title: string;
  text: string;
}

export const AuthFooter = ({ mode = "teacher" }: AuthFooterProps) => {
  const { t } = useTranslation('auth');
  const [offerOpen, setOfferOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);

  const offerSections = t('authFooter.offerDialog.sections', { returnObjects: true }) as Section[];
  const privacySections = t('authFooter.privacyDialog.sections', { returnObjects: true }) as Section[];
  const contactsSections = t('authFooter.contactsDialog.sections', { returnObjects: true }) as Section[];

  return (
    <>
      <footer className="bg-background border-t py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            {/* Переключатель режима авторизации */}
            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
              <Link
                to="/auth"
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === "teacher"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-4 w-4" />
                {t('authFooter.forTeachers')}
              </Link>
              <Link
                to="/parent-auth"
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === "parent"
                    ? "bg-pink-600 text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart className="h-4 w-4" />
                {t('authFooter.forParents')}
              </Link>
            </div>

            {/* Кнопки для модальных окон */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <button
                onClick={() => setOfferOpen(true)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t('authFooter.offer')}
              </button>
              <button
                onClick={() => setPrivacyOpen(true)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t('authFooter.privacy')}
              </button>
              <button
                onClick={() => setContactsOpen(true)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t('authFooter.contacts')}
              </button>
            </div>

            {/* Данные ИП */}
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>{t('authFooter.developer')}</p>
              <p>{t('authFooter.tin')} | {t('authFooter.psrn')}</p>
              <p>© 2025-26 {t('authFooter.rights')}</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Модальное окно: Оферта */}
      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('authFooter.offerDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('authFooter.offerDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {offerSections.map((section, index) => (
              <section key={index}>
                <h3 className="font-semibold mb-2">{section.title}</h3>
                <p className="text-muted-foreground whitespace-pre-line">{section.text}</p>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно: Политика конфиденциальности */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('authFooter.privacyDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('authFooter.privacyDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {privacySections.map((section, index) => (
              <section key={index}>
                <h3 className="font-semibold mb-2">{section.title}</h3>
                <p className="text-muted-foreground whitespace-pre-line">{section.text}</p>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно: Контакты */}
      <Dialog open={contactsOpen} onOpenChange={setContactsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('authFooter.contactsDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('authFooter.contactsDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {contactsSections.map((section, index) => (
              <section key={index}>
                <h3 className="font-semibold mb-2">{section.title}</h3>
                <div className="text-sm text-muted-foreground whitespace-pre-line">
                  {section.text}
                </div>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
