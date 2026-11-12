import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ColdStorageProvider } from '../context/ColdStorageContext';
import BTContextProvider from '../Provider/BTContextProvider';

function CustomHeader() {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View style={styles.headerSpacer} />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Kho Lạnh Thông Minh</Text>
          <Text style={styles.headerSubtitle}>ESP32 Wokwi • Quản Lý Nhiệt Độ</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Mở cài đặt"
          activeOpacity={0.75}
          onPress={() => router.push('/settings')}
          style={styles.settingsButton}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ColdStorageProvider>
      <BTContextProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0984e3',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
            },
            contentStyle: {
              backgroundColor: '#f1f2f6',
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="temperature"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: 'Cài Đặt',
              headerBackTitle: 'Quay lại',
            }}
          />
          <Stack.Screen
            name="door"
            options={{
              title: 'Cảm Biến Cửa & Phơi Nhiễm',
              headerBackTitle: 'Quay lại',
            }}
          />
          <Stack.Screen
            name="alerts"
            options={{
              title: 'Nhật Ký Cảnh Báo',
              headerBackTitle: 'Quay lại',
            }}
          />
          <Stack.Screen
            name="scan"
            options={{
              title: 'Quét Thiết Bị',
              headerBackTitle: 'Quay lại',
            }}
          />
        </Stack>
      </BTContextProvider>
    </ColdStorageProvider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#0984e3',
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  headerContent: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerSpacer: {
    width: 44,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  settingsButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  settingsIcon: {
    color: '#ffffff',
    fontSize: 23,
    lineHeight: 28,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#dff9fb',
    fontWeight: '500',
    marginTop: 2,
  },
});
