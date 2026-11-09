import React from 'react';
import { Text, StyleSheet, Platform, View } from 'react-native';
import { SymbolView, SFSymbol } from 'expo-symbols';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

// Map Ionicons names to SF Symbols and Unicode emojis/characters
const ICON_MAP: Record<string, { sfSymbol: SFSymbol; emoji: string }> = {
  'bug-outline': { sfSymbol: 'ant', emoji: '🪲' },
  'bulb-outline': { sfSymbol: 'lightbulb', emoji: '💡' },
  'tv-outline': { sfSymbol: 'tv', emoji: '📺' },
  'musical-notes-outline': { sfSymbol: 'music.note', emoji: '🎵' },
  'alarm-outline': { sfSymbol: 'alarm', emoji: '⏰' },
  'lock-closed-outline': { sfSymbol: 'lock.fill', emoji: '🔒' },
  'thermometer-outline': { sfSymbol: 'thermometer.medium', emoji: '🌡️' },
  'finger-print-outline': { sfSymbol: 'touchid', emoji: '🛡️' },
  'cloudy-outline': { sfSymbol: 'cloud.sun.fill', emoji: '⛅' },
};

export default function Icon({ name, size = 24, color = '#000' }: IconProps) {
  const iconConfig = ICON_MAP[name];

  if (Platform.OS === 'ios' && iconConfig?.sfSymbol) {
    try {
      return (
        <SymbolView
          name={iconConfig.sfSymbol}
          style={{ width: size, height: size }}
          tintColor={color}
          resizeMode="scaleAspectFit"
        />
      );
    } catch {
      // Fallback if SymbolView fails
    }
  }

  const emoji = iconConfig?.emoji || '⚙️';
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={{ fontSize: size * 0.75, textAlign: 'center' }}>
        {emoji}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
