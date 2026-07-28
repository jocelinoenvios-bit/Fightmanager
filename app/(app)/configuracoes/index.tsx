import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAcademia } from '@/contexts/AcademiaContext';
import { Avatar, Badge, Button, Card, Input, PhotoPicker, Screen, ScreenHeader, SelectField } from '@/components';
import { updateAcademia } from '@/services/academia';
import { uploadImageAsync } from '@/services/uploadImage';
import { noticesService } from '@/services/notices';
import { invitesService } from '@/services/invites';
import { signOutUser } from '@/services/auth';
import { Invite, Notice, Role } from '@/types';

const CONVIDAVEIS: Role[] = ['professor', 'recepcionista'];

export default function ConfiguracoesScreen() {
  const { colors, mode, setMode } = useTheme();
  const { profile, academiaId, role } = useAuth();
  const { academia } = useAcademia();

  const [nome, setNome] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [endereco, setEndereco] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [pixChave, setPixChave] = useState('');
  const [bancoNome, setBancoNome] = useState('');
  const [bancoAgencia, setBancoAgencia] = useState('');
  const [bancoConta, setBancoConta] = useState('');
  const [horarioFuncionamento, setHorarioFuncionamento] = useState('');
  const [saving, setSaving] = useState(false);

  const [notices, setNotices] = useState<Notice[]>([]);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaMensagem, setNovaMensagem] = useState('');

  const [invites, setInvites] = useState<Invite[]>([]);
  const [conviteEmail, setConviteEmail] = useState('');
  const [conviteRole, setConviteRole] = useState<Role>('professor');
  const [convidando, setConvidando] = useState(false);
  const [conviteError, setConviteError] = useState('');

  useEffect(() => {
    if (!academia) return;
    setNome(academia.nome ?? '');
    setLogoUrl(academia.logoUrl);
    setEndereco(academia.endereco ?? '');
    setWhatsapp(academia.whatsapp ?? '');
    setInstagram(academia.instagram ?? '');
    setFacebook(academia.facebook ?? '');
    setPixChave(academia.pixChave ?? '');
    setBancoNome(academia.bancoNome ?? '');
    setBancoAgencia(academia.bancoAgencia ?? '');
    setBancoConta(academia.bancoConta ?? '');
    setHorarioFuncionamento(academia.horarioFuncionamento ?? '');
  }, [academia]);

  useEffect(() => {
    if (!academiaId) return;
    noticesService(academiaId)
      .list()
      .then((list) => setNotices(list.sort((a, b) => b.createdAt - a.createdAt)));
  }, [academiaId]);

  useEffect(() => {
    if (!academiaId || role !== 'admin') return;
    invitesService(academiaId)
      .list()
      .then((list) => setInvites(list.sort((a, b) => b.createdAt - a.createdAt)));
  }, [academiaId, role]);

  const handlePickLogo = async (localUri: string) => {
    if (!academiaId) return;
    const url = await uploadImageAsync(localUri, `academias/${academiaId}/logo-${Date.now()}.jpg`);
    setLogoUrl(url);
  };

  const handleSave = async () => {
    if (!academiaId) return;
    setSaving(true);
    try {
      await updateAcademia(academiaId, {
        nome,
        logoUrl,
        endereco,
        whatsapp,
        instagram,
        facebook,
        pixChave,
        bancoNome,
        bancoAgencia,
        bancoConta,
        horarioFuncionamento,
      });
      Alert.alert('Sucesso', 'Configurações salvas.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNotice = async () => {
    if (!academiaId || !novoTitulo.trim() || !novaMensagem.trim()) return;
    await noticesService(academiaId).create({
      academiaId,
      titulo: novoTitulo.trim(),
      mensagem: novaMensagem.trim(),
      createdAt: Date.now(),
    });
    setNovoTitulo('');
    setNovaMensagem('');
    const list = await noticesService(academiaId).list();
    setNotices(list.sort((a, b) => b.createdAt - a.createdAt));
  };

  const handleDeleteNotice = async (id: string) => {
    if (!academiaId) return;
    await noticesService(academiaId).remove(id);
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  const handleInvite = async () => {
    setConviteError('');
    const email = conviteEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setConviteError('Informe um e-mail válido.');
      return;
    }
    if (!academiaId) return;
    setConvidando(true);
    try {
      await invitesService(academiaId).upsert(email, {
        academiaId,
        email,
        role: conviteRole,
        createdAt: Date.now(),
      });
      setConviteEmail('');
      const list = await invitesService(academiaId).list();
      setInvites(list.sort((a, b) => b.createdAt - a.createdAt));
    } catch {
      setConviteError('Não foi possível criar o convite.');
    } finally {
      setConvidando(false);
    }
  };

  const handleRemoveInvite = async (id: string) => {
    if (!academiaId) return;
    await invitesService(academiaId).remove(id);
    setInvites((prev) => prev.filter((i) => i.id !== id));
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOutUser() },
    ]);
  };

  return (
    <Screen>
      <ScreenHeader title="Configurações" onBack={() => router.back()} />

      <Card style={styles.profileCard}>
        <Avatar uri={profile?.fotoUrl} name={profile?.nome ?? '?'} size={48} />
        <View style={{ marginLeft: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>{profile?.nome}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>{profile?.email} · {profile?.role}</Text>
        </View>
      </Card>

      <Text style={[styles.section, { color: colors.textSecondary }]}>DADOS DA ACADEMIA</Text>
      <PhotoPicker uri={logoUrl} name={nome || 'Academia'} onPick={handlePickLogo} />
      <Input label="Nome da academia" value={nome} onChangeText={setNome} />
      <Input label="Endereço" value={endereco} onChangeText={setEndereco} />
      <Input label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
      <Input label="Instagram" value={instagram} onChangeText={setInstagram} placeholder="@suaacademia" />
      <Input label="Facebook" value={facebook} onChangeText={setFacebook} />
      <Input label="Horário de funcionamento" value={horarioFuncionamento} onChangeText={setHorarioFuncionamento} placeholder="Seg a Sex, 6h-22h" />

      <Text style={[styles.section, { color: colors.textSecondary }]}>DADOS FINANCEIROS</Text>
      <Input label="Chave Pix" value={pixChave} onChangeText={setPixChave} />
      <Input label="Banco" value={bancoNome} onChangeText={setBancoNome} />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Input label="Agência" value={bancoAgencia} onChangeText={setBancoAgencia} />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="Conta" value={bancoConta} onChangeText={setBancoConta} />
        </View>
      </View>

      <Button label="Salvar configurações" onPress={handleSave} loading={saving} fullWidth size="lg" style={{ marginBottom: 24 }} />

      <Text style={[styles.section, { color: colors.textSecondary }]}>APARÊNCIA</Text>
      <View style={styles.row}>
        <Button label="Escuro" size="sm" variant={mode === 'dark' ? 'primary' : 'outline'} onPress={() => setMode('dark')} />
        <Button label="Claro" size="sm" variant={mode === 'light' ? 'primary' : 'outline'} onPress={() => setMode('light')} />
      </View>

      {role === 'admin' && (
        <>
          <Text style={[styles.section, { color: colors.textSecondary, marginTop: 24 }]}>EQUIPE</Text>
          <Card style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>Código da academia</Text>
            <Text selectable style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
              {academiaId}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>
              Compartilhe este código com professores e recepcionistas para que eles se cadastrem em "Tenho um
              convite" na tela de login.
            </Text>
          </Card>
          <Card style={{ marginBottom: 16 }}>
            <Input label="E-mail do convidado" value={conviteEmail} onChangeText={setConviteEmail} placeholder="professor@email.com" autoCapitalize="none" keyboardType="email-address" />
            <SelectField label="Função" value={conviteRole} options={CONVIDAVEIS} onChange={setConviteRole} />
            {!!conviteError && <Text style={{ color: colors.danger, marginBottom: 8 }}>{conviteError}</Text>}
            <Button label="Convidar" onPress={handleInvite} loading={convidando} variant="outline" fullWidth />
          </Card>
          {invites.map((invite) => (
            <Card key={invite.id} style={styles.noticeCard}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{invite.email}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>Convite pendente</Text>
              </View>
              <Badge label={invite.role} tone="primary" />
              <Button label="Remover" size="sm" variant="danger" onPress={() => handleRemoveInvite(invite.id)} />
            </Card>
          ))}
        </>
      )}

      <Text style={[styles.section, { color: colors.textSecondary, marginTop: 24 }]}>AVISOS DA ACADEMIA</Text>
      <Card style={{ marginBottom: 16 }}>
        <Input label="Título" value={novoTitulo} onChangeText={setNovoTitulo} placeholder="Ex: Aula cancelada" />
        <Input label="Mensagem" value={novaMensagem} onChangeText={setNovaMensagem} placeholder="Detalhes do aviso" multiline numberOfLines={2} />
        <Button label="Publicar aviso" onPress={handleAddNotice} variant="outline" fullWidth />
      </Card>
      {notices.map((n) => (
        <Card key={n.id} style={styles.noticeCard}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{n.titulo}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{n.mensagem}</Text>
          </View>
          <Button label="Remover" size="sm" variant="danger" onPress={() => handleDeleteNotice(n.id)} />
        </Card>
      ))}

      <Button label="Sair da conta" variant="danger" icon="log-out-outline" fullWidth onPress={handleLogout} style={{ marginTop: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginBottom: 10, marginTop: 8 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  noticeCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
});
