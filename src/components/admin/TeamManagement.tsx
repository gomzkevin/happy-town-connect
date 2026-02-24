import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Mail, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from './ConfirmDialog';

interface TeamMember {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

const TeamManagement = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('operador');
  const [loading, setLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: '', type: '', email: '' });

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    const [membersRes, invitationsRes] = await Promise.all([
      supabase.from('admin_users').select('*').order('created_at'),
      supabase.from('team_invitations').select('*').order('created_at'),
    ]);
    if (membersRes.data) setMembers(membersRes.data);
    if (invitationsRes.data) setInvitations(invitationsRes.data);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !user) return;

    setLoading(true);
    try {
      // Check if already a member
      const existingMember = members.find(m => m.email === email.trim().toLowerCase());
      if (existingMember) {
        toast.error('Este email ya es miembro del equipo');
        return;
      }

      // Check if already invited
      const existingInvite = invitations.find(i => i.email === email.trim().toLowerCase() && i.status === 'pending');
      if (existingInvite) {
        toast.error('Este email ya tiene una invitación pendiente');
        return;
      }

      const trimmedEmail = email.trim().toLowerCase();
      const { error } = await supabase.from('team_invitations').insert({
        email: trimmedEmail,
        role,
        invited_by: user.id,
      });

      if (error) throw error;

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-team-invitation', {
        body: { email: trimmedEmail, role, inviterEmail: user.email },
      });

      if (emailError) {
        console.error('Email send error:', emailError);
        toast.success(`Invitación creada para ${trimmedEmail}`, {
          description: `Rol: ${role === 'admin' ? 'Administrador' : 'Operador'}. No se pudo enviar el email, comparte el link manualmente.`,
        });
      } else {
        toast.success(`Invitación enviada a ${trimmedEmail}`, {
          description: `Se envió un email con instrucciones para registrarse como ${role === 'admin' ? 'Administrador' : 'Operador'}.`,
        });
      }
      setEmail('');
      setRole('operador');
      fetchTeamData();
    } catch (error: any) {
      console.error('Error inviting:', error);
      toast.error('Error al enviar invitación', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteDialog.type === 'invitation') {
        const { error } = await supabase.from('team_invitations').delete().eq('id', deleteDialog.id);
        if (error) throw error;
        toast.success('Invitación eliminada');
      }
      // Note: removing admin_users members would require additional policy
      setDeleteDialog({ open: false, id: '', type: '', email: '' });
      fetchTeamData();
    } catch (error: any) {
      toast.error('Error al eliminar', { description: error.message });
    }
  };

  const roleBadge = (r: string) => (
    <Badge variant={r === 'admin' ? 'default' : 'secondary'}>
      <Shield className="h-3 w-3 mr-1" />
      {r === 'admin' ? 'Admin' : 'Operador'}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invitar Miembro
          </CardTitle>
          <CardDescription>
            Invita a miembros de tu equipo. Deben registrarse con el mismo email para obtener acceso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="invite-email" className="sr-only">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="email@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="w-full sm:w-40">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading}>
              <Mail className="h-4 w-4 mr-2" />
              Invitar
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            <strong>Operador:</strong> Pipeline, Calendario, Servicios, Eventos · <strong>Admin:</strong> Acceso completo
          </p>
        </CardContent>
      </Card>

      {/* Current team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Equipo Actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{m.email}</span>
                {roleBadge(m.role)}
                {m.email === user?.email && (
                  <Badge variant="outline" className="text-xs">Tú</Badge>
                )}
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No hay miembros aún</p>
          )}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {invitations.filter(i => i.status === 'pending').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invitaciones Pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitations.filter(i => i.status === 'pending').map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-dashed">
                <div className="flex items-center gap-3">
                  <span className="text-sm">{inv.email}</span>
                  {roleBadge(inv.role)}
                  <Badge variant="outline" className="text-xs">Pendiente</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteDialog({ open: true, id: inv.id, type: 'invitation', email: inv.email })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Eliminar Invitación"
        description={`¿Eliminar la invitación para "${deleteDialog.email}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
};

export default TeamManagement;
