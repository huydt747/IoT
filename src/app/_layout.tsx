import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ColdStorageProvider } from '../context/ColdStorageContext';
import BTContextProvider from '../Provider/BTContextProvider';

function CustomHeader() {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Kho Lạnh Thông Minh</Text>
      <Text style={styles.headerSubtitle}>ESP32 Wokwi • Quản Lý Nhiệt Độ</Text>
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
              header: () => <CustomHeader />,
            }}
          />
          <Stack.Screen
            name="temperature"
            options={{
              title: 'Nhiệt Độ & Lịch Sử Đo',
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
  headerTitle: {
    fontSize: 22,
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
