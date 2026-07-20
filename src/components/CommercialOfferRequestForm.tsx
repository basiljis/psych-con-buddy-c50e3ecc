import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText } from 'lucide-react';

type FormValues = {
  organizationName: string;
  inn: string;
  contactPerson: string;
  email: string;
  phone: string;
  comment?: string;
};

export const CommercialOfferRequestForm = () => {
  const { t } = useTranslation('pages');
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const formSchema = z.object({
    organizationName: z.string().trim().min(3, t('commercialOffer.errors.orgMin')).max(200, t('commercialOffer.errors.orgMax')),
    inn: z.string().trim().regex(/^\d{10}$|^\d{12}$/, t('commercialOffer.errors.innFormat')),
    contactPerson: z.string().trim().min(2, t('commercialOffer.errors.personMin')).max(100, t('commercialOffer.errors.personMax')),
    email: z.string().trim().email(t('commercialOffer.errors.emailInvalid')).max(255, t('commercialOffer.errors.emailMax')),
    phone: z.string().trim().regex(/^\+?[0-9\s\-()]{10,20}$/, t('commercialOffer.errors.phoneFormat')),
    comment: z.string().trim().max(1000, t('commercialOffer.errors.commentMax')).optional(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: '',
      inn: '',
      contactPerson: '',
      email: '',
      phone: '',
      comment: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const { error: dbError } = await supabase
        .from('commercial_offer_requests')
        .insert([{
          organization_name: data.organizationName,
          inn: data.inn,
          contact_person: data.contactPerson,
          email: data.email,
          phone: data.phone,
          comment: data.comment || null,
          status: 'pending'
        }]);

      if (dbError) throw dbError;

      const { error: emailError } = await supabase.functions.invoke('send-commercial-offer-request', {
        body: data
      });

      if (emailError) {
        console.error('Email notification error:', emailError);
      }

      toast({
        title: t('commercialOffer.toastSent'),
        description: t('commercialOffer.toastSentDesc'),
      });

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error sending request:', error);
      toast({
        title: t('commercialOffer.toastError'),
        description: t('commercialOffer.toastErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FileText className="mr-2 h-4 w-4" />
          {t('commercialOffer.trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('commercialOffer.title')}</DialogTitle>
          <DialogDescription>
            {t('commercialOffer.description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('commercialOffer.orgLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('commercialOffer.orgPh')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('commercialOffer.innLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('commercialOffer.innPh')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('commercialOffer.personLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('commercialOffer.personPh')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('commercialOffer.emailLabel')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('commercialOffer.emailPh')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('commercialOffer.phoneLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('commercialOffer.phonePh')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('commercialOffer.commentLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('commercialOffer.commentPh')}
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                {t('commercialOffer.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('commercialOffer.submitting') : t('commercialOffer.submit')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
