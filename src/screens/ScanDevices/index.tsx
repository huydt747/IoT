import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  BluetoothService,
  BluetoothDevice,
  isBluetoothSimulated,
} from '../../services/BluetoothService';
import {
  DeviceContext,
  useSelectDevice,
  useSetScannedDevice,
  useOnDeviceConnect,
  useDisconnectDevice,
} from '../../Provider/BTContextProvider';

export default function ScanDevices() {
  const [discovering, setDiscovering] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const { deviceId, scannedDevices, isConnected } = useContext(DeviceContext);
  const selectDevice = useSelectDevice();
  const setScannedDevice = useSetScannedDevice();
  const onDeviceConnect = useOnDeviceConnect();
  const disconnectDevice = useDisconnectDevice();

  async function scanDevices() {
    try {
      setDiscovering(true);
      const devices = await BluetoothService.startDiscovery();
      setScannedDevice(devices);
    } catch (err: any) {
      console.warn('Scan error:', err);
      Alert.alert('Scan Error', err?.message || 'Failed to scan for devices');
    } finally {
      setDiscovering(false);
    }
  }

  async function stopScan() {
    try {
      await BluetoothService.stopDiscovery();
      setDiscovering(false);
    } catch (e) {
      setDiscovering(false);
      console.warn(e);
    }
  }

  async function connect(targetDevice: BluetoothDevice) {
    try {
      setConnecting(true);
      const isAlreadyConnected = await BluetoothService.isDeviceConnected(
        targetDevice.address
      );

      if (!isAlreadyConnected) {
        await BluetoothService.connectToDevice(targetDevice.address, {
          CONNECTOR_TYPE: 'rfcomm',
          DELIMITER: '\n',
          DEVICE_CHARSET: Platform.OS === 'ios' ? 1536 : 'utf-8',
        });
      }

      selectDevice(targetDevice);
      onDeviceConnect(`Connected to ${targetDevice.name}`);
      setConnecting(false);
      router.back();
    } catch (e: any) {
      console.warn('Connect error:', e);
      Alert.alert('Connection Failed', e?.message || 'Could not connect to device');
      setConnecting(false);
    }
  }

  return (
    <View style={styles.container}>
      {isBluetoothSimulated && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Simulated Bluetooth Mode (Expo Go / Demo)
          </Text>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => (discovering ? stopScan() : scanDevices())}
        style={styles.scanButton}
      >
        <Text style={styles.scanButtonText}>
          {discovering ? 'Stop Scanning' : 'Scan for Devices'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.devicesHeader}>Available Devices:</Text>

      {discovering ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1dd1a1" />
          <Text style={styles.loadingText}>Searching for Bluetooth devices...</Text>
        </View>
      ) : (
        <FlatList
          data={scannedDevices}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No devices found yet. Press "Scan for Devices" above.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = item.id === deviceId;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  selectDevice(isSelected ? undefined : item);
                }}
                style={[
                  styles.deviceCard,
                  isSelected ? styles.deviceCardSelected : styles.deviceCardDefault,
                ]}
              >
                <View style={styles.deviceInfo}>
                  <Text
                    style={[
                      styles.deviceName,
                      isSelected && styles.textSelected,
                    ]}
                  >
                    {item.name || 'Unnamed Device'}
                  </Text>
                  <Text
                    style={[
                      styles.deviceDetail,
                      isSelected && styles.textSelected,
                    ]}
                  >
                    Address: {item.address}
                  </Text>
                  <Text
                    style={[
                      styles.deviceDetail,
                      isSelected && styles.textSelected,
                    ]}
                  >
                    Paired: {item.bonded ? 'Yes' : 'No'}
                  </Text>
                </View>

                {isSelected && (
                  <View style={styles.actionContainer}>
                    {isConnected ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.disconnectBtn]}
                        onPress={() => disconnectDevice()}
                      >
                        <Text style={styles.actionBtnText}>Disconnect</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.connectBtn]}
                        onPress={() => connect(item)}
                        disabled={connecting}
                      >
                        <Text style={styles.actionBtnText}>
                          {connecting ? 'Connecting...' : 'Connect'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  banner: {
    backgroundColor: '#e1f5fe',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#b3e5fc',
  },
  bannerText: {
    color: '#0288d1',
    fontSize: 12,
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#0984e3',
    marginHorizontal: 24,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  devicesHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#636e72',
    fontSize: 14,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    color: '#b2bec3',
    textAlign: 'center',
    fontSize: 14,
  },
  deviceCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  deviceCardDefault: {
    backgroundColor: '#ffffff',
  },
  deviceCardSelected: {
    backgroundColor: '#1dd1a1',
  },
  deviceInfo: {
    marginBottom: 6,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 4,
  },
  deviceDetail: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 2,
  },
  textSelected: {
    color: '#ffffff',
  },
  actionContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
    paddingTop: 10,
  },
  actionBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectBtn: {
    backgroundColor: '#2d3436',
  },
  disconnectBtn: {
    backgroundColor: '#d63031',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
