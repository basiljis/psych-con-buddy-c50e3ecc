import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Section {
  title: string;
  text: string;
}

export function DataProcessingAgreement() {
  const { t } = useTranslation('auth');
  const sections = t('dataProcessingAgreement.sections', { returnObjects: true }) as Section[];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="h-auto p-0 text-sm text-primary hover:underline">
          {t('dataProcessingAgreement.trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t('dataProcessingAgreement.title')}</DialogTitle>
          <DialogDescription>
            {t('dataProcessingAgreement.description')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            {sections.map((section, index) => (
              <section key={index}>
                <h3 className="font-semibold mb-2">{section.title}</h3>
                <p className="text-muted-foreground">{section.text}</p>
              </section>
            ))}
            <section className="pt-4 border-t">
              <p className="text-muted-foreground italic">
                {t('dataProcessingAgreement.footer')}
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
