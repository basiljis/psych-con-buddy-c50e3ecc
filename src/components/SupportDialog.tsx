import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Mail, Clock, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HelpItem {
  label: string;
  value: string;
}

export const SupportDialog = () => {
  const { t } = useTranslation('auth');
  const helpItems = t('supportDialog.helpWith.items', { returnObjects: true }) as string[];

  const contacts: HelpItem[] = [
    { label: t('supportDialog.email.label'), value: t('supportDialog.email.value') },
    { label: t('supportDialog.hours.label'), value: t('supportDialog.hours.value') },
    { label: t('supportDialog.chat.label'), value: t('supportDialog.chat.value') },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <HelpCircle className="mr-2 h-4 w-4" />
          {t('supportDialog.trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t('supportDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('supportDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <p
                className="text-muted-foreground mb-4"
                dangerouslySetInnerHTML={{ __html: t('supportDialog.intro') }}
              />
              
              <div className="space-y-3">
                {contacts.map((contact, index) => {
                  const Icon = index === 0 ? Mail : index === 1 ? Clock : MessageCircle;
                  return (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-foreground">{contact.label}</div>
                        {index === 0 ? (
                          <a href={`mailto:${contact.value}`} className="text-primary hover:underline">
                            {contact.value}
                          </a>
                        ) : (
                          <div className="text-muted-foreground">{contact.value}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">{t('supportDialog.helpWith.title')}</h3>
              <ul className="space-y-2 text-muted-foreground">
                {helpItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="pt-4 border-t">
              <p className="text-center text-muted-foreground italic">
                {t('supportDialog.thanks')}
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
