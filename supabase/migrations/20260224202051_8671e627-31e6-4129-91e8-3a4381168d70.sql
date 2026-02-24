
-- Manually link kevin@alanto.mx since auto-link failed due to timing
INSERT INTO public.admin_users (user_id, email, role, is_active)
VALUES ('f366cd7c-ee1e-404c-9292-3f2f175660b1', 'kevin@alanto.mx', 'operador', true);

-- Mark invitation as accepted
UPDATE public.team_invitations 
SET status = 'accepted', accepted_at = now()
WHERE email = 'kevin@alanto.mx' AND status = 'pending';
