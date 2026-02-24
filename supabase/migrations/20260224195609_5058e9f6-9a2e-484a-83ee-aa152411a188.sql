
-- Allow authenticated users to insert themselves into admin_users (for auto-linking invitations)
CREATE POLICY "Allow self-insert from invitation"
  ON public.admin_users
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to delete team invitations
CREATE POLICY "Admins can delete invitations"
  ON public.team_invitations
  FOR DELETE
  USING (is_admin(auth.uid()));
