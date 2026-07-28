import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
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

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setBusy(true);
    try {
      await onPick(result.assets[0].uri);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable onPress={pick} style={styles.wrapper}>
      <Avatar uri={uri} name={name} size={88} />
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
