-- Add the current user as an administrator
INSERT INTO public.admin_users (user_id, email, role, is_active)
VALUES (
  '63da872a-1998-49be-b159-150ace038d11',
  'gomz.kevin@gmail.com', 
  'admin',
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  is_active = true,
  role = 'admin',
  updated_at = now();