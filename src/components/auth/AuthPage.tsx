import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Mode = 'signin' | 'signup' | 'forgot';

const AuthPage = () => {
  const { signIn, signUp, user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('signin');
  const [hasInvitation, setHasInvitation] = useState<boolean | null>(null);
  const [checkingInvitation, setCheckingInvitation] = useState(false);

  useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, navigate]);

  const checkInvitation = async () => {
    if (!email.trim()) {
      setError('Ingresa tu email primero');
      return;
    }
    setCheckingInvitation(true);
    setError('');
    const { data } = await supabase
      .from('team_invitations')
      .select('id, role')
      .eq('email', email.trim().toLowerCase())
      .eq('status', 'pending')
      .single();

    if (data) {
      setHasInvitation(true);
      setMode('signup');
    } else {
      setError('No tienes una invitación pendiente. Contacta al administrador.');
      setHasInvitation(false);
    }
    setCheckingInvitation(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) setError(error.message || 'Error al iniciar sesión');
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password);
    if (error) {
      setError(error.message || 'Error al crear cuenta');
    } else {
      setSuccess('Cuenta creada. Revisa tu email para verificar tu cuenta y luego inicia sesión.');
    }
    setIsLoading(false);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setHasInvitation(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Panel de Administración</CardTitle>
          <CardDescription>
            Acceso restringido para el equipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'forgot' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              {success ? (
                <Alert><AlertDescription>✓ {success}</AlertDescription></Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
                  </div>
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  <Button className="w-full" disabled={isLoading} onClick={async () => {
                    if (!email) { setError('Ingresa tu email'); return; }
                    setIsLoading(true); setError('');
                    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
                    if (resetError) setError(resetError.message); else setSuccess('Revisa tu email para restablecer tu contraseña');
                    
                    setIsLoading(false);
                  }}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar enlace
                  </Button>
                </>
              )}
              <button type="button" className="w-full text-sm text-muted-foreground hover:text-primary underline" onClick={() => switchMode('signin')}>
                Volver al inicio de sesión
              </button>
            </div>
          )}

          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesión
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={checkInvitation} disabled={checkingInvitation}>
                {checkingInvitation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Registrarme con invitación
              </Button>
              <button type="button" className="w-full text-sm text-muted-foreground hover:text-primary underline" onClick={() => switchMode('forgot')}>
                ¿Olvidaste tu contraseña?
              </button>
            </form>
          )}

          {mode === 'signup' && hasInvitation && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>✓ Invitación encontrada para <strong>{email}</strong>. Crea tu contraseña.</AlertDescription>
              </Alert>
              {success ? (
                <div className="space-y-3">
                  <Alert><AlertDescription>{success}</AlertDescription></Alert>
                  <Button className="w-full" variant="outline" onClick={() => switchMode('signin')}>Ir a Iniciar Sesión</Button>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••" />
                  </div>
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Cuenta
                  </Button>
                </form>
              )}
              <button type="button" className="w-full text-sm text-muted-foreground hover:text-primary underline" onClick={() => switchMode('signin')}>
                Volver al inicio de sesión
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
