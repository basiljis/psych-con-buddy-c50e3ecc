import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Users, FileText, Calendar, BarChart3, ClipboardCheck, TrendingUp, Target, UserCheck, Gamepad2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommercialOfferRequestForm } from "@/components/CommercialOfferRequestForm";
import { Card, CardContent } from "@/components/ui/card";

interface ChildCardItem {
  title: string;
  description: string;
}

export const SystemInfoDialog = () => {
  const { t } = useTranslation('auth');

  const features = t('systemInfo.features.items', { returnObjects: true }) as string[];
  const workflowSteps = t('systemInfo.workflow.steps', { returnObjects: true }) as string[];
  const childCardItems = t('systemInfo.childCard.cards', { returnObjects: true }) as Record<string, ChildCardItem>;

  const childCardKeys = Object.keys(childCardItems);
  const childCardIcons = [Users, FileText, TrendingUp, Target, ClipboardCheck, BarChart3];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Info className="mr-2 h-4 w-4" />
          {t('systemInfo.trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('systemInfo.title')}</DialogTitle>
          <DialogDescription className="text-sm">
            {t('systemInfo.tagline')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">{t('systemInfo.purpose.title')}</h3>
              <p className="text-muted-foreground mb-3">
                {t('systemInfo.purpose.intro')}
              </p>
              <div className="space-y-2 text-muted-foreground">
                <div className="border-l-2 border-orange-500 pl-3">
                  <strong className="text-foreground">{t('systemInfo.purpose.childCard.title')}</strong>
                  <p className="mt-1">{t('systemInfo.purpose.childCard.description')}</p>
                </div>
                <div className="border-l-2 border-primary pl-3">
                  <strong className="text-foreground">{t('systemInfo.purpose.protocols.title')}</strong>
                  <p className="mt-1">{t('systemInfo.purpose.protocols.description')}</p>
                </div>
                <div className="border-l-2 border-primary pl-3">
                  <strong className="text-foreground">{t('systemInfo.purpose.workLog.title')}</strong>
                  <p className="mt-1">{t('systemInfo.purpose.workLog.description')}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">{t('systemInfo.features.title')}</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {features.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">{t('systemInfo.childCard.title')}</h3>
              <p className="text-muted-foreground mb-3">
                {t('systemInfo.childCard.intro')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {childCardKeys.map((key, index) => {
                  const Icon = childCardIcons[index] ?? UserCheck;
                  const item = childCardItems[key];
                  return (
                    <Card key={key} className="bg-muted/50 border-muted">
                      <CardContent className="p-3 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-foreground">{item.title}</h4>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">{t('systemInfo.roles.title')}</h3>
              <div className="space-y-2 text-muted-foreground">
                <div>
                  <strong>{t('systemInfo.roles.specialist')}</strong>
                </div>
                <div>
                  <strong>{t('systemInfo.roles.admin')}</strong>
                </div>
                <div>
                  <strong>{t('systemInfo.roles.regional')}</strong>
                </div>
                <div>
                  <strong>{t('systemInfo.roles.systemAdmin')}</strong>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">{t('systemInfo.workflow.title')}</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                {workflowSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">{t('systemInfo.support.title')}</h3>
              <p className="text-muted-foreground">
                {t('systemInfo.support.text')}
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">{t('systemInfo.security.title')}</h3>
              <p className="text-muted-foreground">
                {t('systemInfo.security.text')}
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">{t('systemInfo.developer.title')}</h3>
              <div className="space-y-1 text-muted-foreground bg-muted/50 p-4 rounded-lg">
                <div><strong className="text-foreground">{t('systemInfo.developer.name')}</strong></div>
                <div>{t('systemInfo.developer.tin')}</div>
                <div>{t('systemInfo.developer.psrn')}</div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">{t('systemInfo.pricing.title')}</h3>
              <div className="space-y-3 mb-4">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">{t('systemInfo.pricing.monthly.title')}</h4>
                      <p className="text-sm text-muted-foreground">{t('systemInfo.pricing.monthly.description')}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">{t('systemInfo.pricing.monthly.price')}</div>
                      <div className="text-sm text-muted-foreground">{t('systemInfo.pricing.monthly.period')}</div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-primary/5 border-primary">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">{t('systemInfo.pricing.yearly.title')}</h4>
                      <p className="text-sm text-muted-foreground">{t('systemInfo.pricing.yearly.description')}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">{t('systemInfo.pricing.yearly.price')}</div>
                      <div className="text-sm text-muted-foreground">{t('systemInfo.pricing.yearly.period')}</div>
                      <div className="text-xs text-primary font-medium">{t('systemInfo.pricing.yearly.note')}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    {t('systemInfo.pricing.trial.text')}
                  </p>
                </div>
              </div>

              <h3 className="font-semibold text-base mb-2 mt-6">{t('systemInfo.pricing.types.title')}</h3>
              <div className="space-y-3 text-muted-foreground">
                <div className="border-l-2 border-primary pl-3">
                  <strong className="text-foreground">{t('systemInfo.pricing.types.card.title')}</strong>
                  <p className="mt-1">{t('systemInfo.pricing.types.card.description')}</p>
                </div>
                <div className="border-l-2 border-primary pl-3">
                  <strong className="text-foreground">{t('systemInfo.pricing.types.invoice.title')}</strong>
                  <p className="mt-1">{t('systemInfo.pricing.types.invoice.description')}</p>
                </div>
                <div className="border-l-2 border-primary pl-3">
                  <strong className="text-foreground">{t('systemInfo.pricing.types.portal.title')}</strong>
                  <p className="mt-1">{t('systemInfo.pricing.types.portal.description')}</p>
                </div>
              </div>

              <div className="mt-4">
                <CommercialOfferRequestForm />
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
