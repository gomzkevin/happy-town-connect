CREATE POLICY "Admins can delete quote_services"
  ON public.quote_services
  FOR DELETE
  USING (public.is_admin(auth.uid()));