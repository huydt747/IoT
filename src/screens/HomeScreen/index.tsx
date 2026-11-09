import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import ControlScreen from '../ControlScreen';
import {
  DeviceContext,
  useDisconnectDevice,
} from '../../Provider/BTContextProvider';

export default function HomeScreen() {
  const { connectedDevice, isConnected } = useContext(DeviceContext);
  const disconnectDevice = useDisconnectDevice();

  return (
    <View style={styles.outerContainer}>
      <ControlScreen />

      <View style={styles.footerContainer}>
        {isConnected ? (
          <View style={styles.connectedCard}>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.connectedDeviceText} numberOfLines={1}>
                {connectedDevice}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => disconnectDevice()}
              style={[styles.actionButton, styles.disconnectButton]}
            >
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/scan' as any)}
            style={[styles.actionButton, styles.scanButton]}
          >
            <Text style={styles.buttonText}>Scan and Connect</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  connectedCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1dd1a1',
    marginRight: 8,
  },
  connectedDeviceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d3436',
  },
  actionButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButton: {
    backgroundColor: '#ff6b6b',
  },
  disconnectButton: {
    backgroundColor: '#d63031',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
