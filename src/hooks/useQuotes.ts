import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useServices, Service } from '@/contexts/ServicesContext';
import { useToast } from '@/hooks/use-toast';

export interface QuoteData {
  customerName: string;
  email: string;
  phone?: string;
  eventDate?: string;
  childrenCount?: number;
  ageRange?: string;
  childName?: string;
  preferences?: string[];
  location?: string;
  source: 'onboarding' | 'services';
}

export const useQuotes = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { selectedServices, clearSelection } = useServices();
  const { toast } = useToast();

  const submitQuote = async (quoteData: QuoteData) => {
    setIsSubmitting(true);
    
    try {
      // Calculate total estimate
      const totalEstimate = selectedServices.reduce((total, item) => {
        const price = parseInt(item.service.price.replace(/[^\d]/g, ''));
        return total + (price * item.quantity);
      }, 0);

      // Create the quote
        const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          customer_name: quoteData.customerName,
          email: quoteData.email,
          phone: quoteData.phone,
          event_date: quoteData.eventDate,
          children_count: quoteData.childrenCount,
          age_range: quoteData.ageRange,
          child_name: quoteData.childName,
          preferences: quoteData.preferences,
          location: quoteData.location,
          total_estimate: totalEstimate,
          source: quoteData.source,
          status: 'pending'
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote services entries
      if (selectedServices.length > 0 && quote) {
        const quoteServices = selectedServices.map(item => ({
          quote_id: quote.id,
          service_id: item.service.id,
          service_name: item.service.title,
          service_price: parseInt(item.service.price.replace(/[^\d]/g, '')),
          quantity: item.quantity
        }));

        const { error: servicesError } = await supabase
          .from('quote_services')
          .insert(quoteServices);

        if (servicesError) throw servicesError;
      }

      // Send email via Edge Function
      const emailData = {
        quoteId: quote.id, // Pass the real UUID
        customerName: quoteData.customerName,
        email: quoteData.email,
        phone: quoteData.phone,
        eventDate: quoteData.eventDate,
        childrenCount: quoteData.childrenCount,
        ageRange: quoteData.ageRange,
        childName: quoteData.childName,
        preferences: quoteData.preferences,
        location: quoteData.location,
        services: selectedServices.map(item => ({
          name: item.service.title,
          price: parseInt(item.service.price.replace(/[^\d]/g, '')),
          quantity: item.quantity
        })),
        totalEstimate
      };

      const { data: emailResult, error: emailError } = await supabase.functions.invoke(
        'send-quote-email',
        { body: emailData }
      );

      if (emailError) {
        console.error('Error sending email:', emailError);
        // Continue with success even if email fails
      }

      // Clear the cart
      clearSelection();

      toast({
        title: "¡Cotización enviada!",
        description: "Recibirás tu cotización personalizada en menos de 24 horas.",
      });

      return quote;
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu cotización. Inténtalo de nuevo.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitQuote,
    isSubmitting
  };
};