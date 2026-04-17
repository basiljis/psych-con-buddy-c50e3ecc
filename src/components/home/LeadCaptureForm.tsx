import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Send } from "lucide-react";

export function LeadCaptureForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    organization_name: "",
    contact_person: "",
    phone: "",
    email: "",
    inn: "",
    comment: "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organization_name || !form.contact_person || !form.phone || !form.email) {
      toast({
        title: "Заполните обязательные поля",
        description: "Организация, контактное лицо, телефон и email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("commercial_offer_requests").insert({
        organization_name: form.organization_name,
        contact_person: form.contact_person,
        phone: form.phone,
        email: form.email,
        inn: form.inn || "—",
        comment: form.comment || null,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Заявка отправлена",
        description: "Мы свяжемся с вами в течение рабочего дня",
      });
    } catch (err: any) {
      toast({
        title: "Ошибка отправки",
        description: err.message ?? "Попробуйте позже",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-24 px-4 bg-muted/30" id="lead-form">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Получить коммерческое предложение
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Расчёт стоимости под вашу организацию, презентация, демо-доступ
          </p>
        </div>

        <Card className="border-primary/20">
          <CardContent className="p-6 md:p-10">
            {submitted ? (
              <div className="text-center py-10">
                <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Спасибо! Заявка получена</h3>
                <p className="text-muted-foreground">
                  Менеджер свяжется с вами в течение рабочего дня по указанному телефону.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org">Организация *</Label>
                    <Input
                      id="org"
                      placeholder="ГБОУ Школа № 1234"
                      value={form.organization_name}
                      onChange={update("organization_name")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="person">Контактное лицо *</Label>
                    <Input
                      id="person"
                      placeholder="Иванова Анна"
                      value={form.contact_person}
                      onChange={update("contact_person")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      value={form.phone}
                      onChange={update("phone")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="info@school.ru"
                      value={form.email}
                      onChange={update("email")}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="inn">ИНН</Label>
                    <Input
                      id="inn"
                      placeholder="7701234567"
                      value={form.inn}
                      onChange={update("inn")}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="comment">Комментарий</Label>
                    <Textarea
                      id="comment"
                      placeholder="Сколько специалистов, какие модули интересны..."
                      rows={3}
                      value={form.comment}
                      onChange={update("comment")}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Нажимая «Отправить», вы соглашаетесь на обработку персональных данных в
                  соответствии с ФЗ‑152.
                </p>

                <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Отправляем...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Отправить заявку
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
