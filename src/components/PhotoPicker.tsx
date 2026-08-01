import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { notifyMessage } from '@/utils/confirm';
import { Avatar } from './Avatar';

export function PhotoPicker({
  uri,
  name,
  onPick,
}: {
  uri?: string;
  name: string;
  onPick: (localUri: string) => Promise<void> | void;
}) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  // Shows the freshly picked photo right away instead of waiting for the
  // upload to finish, and falls back to the last saved photo if the upload fails.
  const [previewUri, setPreviewUri] = useState(uri);

  useEffect(() => {
    setPreviewUri(uri);
  }, [uri]);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const localUri = result.assets[0].uri;
    setPreviewUri(localUri);
    setBusy(true);
    try {
      await onPick(localUri);
    } catch (error) {
      setPreviewUri(uri);
      notifyMessage('Falha ao enviar foto', 'Não foi possível carregar a imagem. Verifique sua conexão e tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable onPress={pick} style={styles.wrapper}>
      <Avatar uri={previewUri} name={name} size={88} />
      <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
        {busy ? (
          <ActivityIndicator size="small" color={colors.onPrimary} />
        ) : (
          <Ionicons name="camera" size={14} color={colors.onPrimary} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignSelf: 'center', marginBottom: 20 },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
