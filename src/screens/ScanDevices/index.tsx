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
  const pairedCount = scannedDevices.filter((device) => device.bonded).length;
  const unpairedCount = scannedDevices.length - pairedCount;
  const pairedPercentage = scannedDevices.length
    ? (pairedCount / scannedDevices.length) * 100
    : 0;
  const unpairedPercentage = scannedDevices.length
    ? (unpairedCount / scannedDevices.length) * 100
    : 0;

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
          <View style={styles.demoDot} />
          <Text style={styles.bannerText}>Chế độ mô phỏng Bluetooth · Demo</Text>
        </View>
      )}

      <FlatList
        data={discovering ? [] : scannedDevices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.bluetoothMark}>
                  <Text style={styles.bluetoothMarkText}>BT</Text>
                </View>
                <View style={styles.connectionBadge}>
                  <View
                    style={[
                      styles.connectionDot,
                      isConnected && styles.connectionDotActive,
                    ]}
                  />
                  <Text style={styles.connectionText}>
                    {isConnected ? 'Đã kết nối' : 'Sẵn sàng'}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>Kết nối thiết bị</Text>
              <Text style={styles.heroSubtitle}>
                Quét để tìm và quản lý các thiết bị Bluetooth ở gần bạn.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => (discovering ? stopScan() : scanDevices())}
                style={[
                  styles.scanButton,
                  discovering && styles.scanButtonActive,
                ]}
              >
                {discovering ? (
                  <ActivityIndicator size="small" color="#17324d" />
                ) : (
                  <View style={styles.scanButtonIcon}>
                    <View style={styles.scanButtonIconDot} />
                  </View>
                )}
                <Text style={styles.scanButtonText}>
                  {discovering ? 'Dừng quét' : 'Quét thiết bị'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>Tổng quan</Text>
                <Text style={styles.sectionSubtitle}>
                  {discovering ? 'Đang tìm thiết bị xung quanh' : 'Trạng thái thiết bị Bluetooth'}
                </Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{scannedDevices.length}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, styles.statIconTeal]}>
                  <View style={styles.statIconDot} />
                </View>
                <Text style={styles.statValue}>{scannedDevices.length}</Text>
                <Text style={styles.statLabel}>Thiết bị tìm thấy</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, styles.statIconBlue]}>
                  <View style={styles.statIconRing} />
                </View>
                <Text style={styles.statValue}>{pairedCount}</Text>
                <Text style={styles.statLabel}>Đã ghép đôi</Text>
              </View>
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeading}>
                <View>
                  <Text style={styles.chartTitle}>Trạng thái ghép đôi</Text>
                  <Text style={styles.chartSubtitle}>
                    Phân loại thiết bị đã quét
                  </Text>
                </View>
                <View style={styles.chartTotalBadge}>
                  <Text style={styles.chartTotal}>{scannedDevices.length}</Text>
                  <Text style={styles.chartTotalLabel}>TỔNG</Text>
                </View>
              </View>

              <View style={styles.chartPlot}>
                <View style={[styles.chartGuide, styles.chartGuideTop]} />
                <View style={[styles.chartGuide, styles.chartGuideMiddle]} />
                <View style={styles.chartGuideBottom} />
                <View style={styles.chartColumns}>
                  <View style={styles.chartColumn}>
                    <Text style={styles.chartColumnValue}>{pairedCount}</Text>
                    <View style={styles.chartBarTrack}>
                      <View
                        style={[
                          styles.chartBar,
                          styles.pairedBar,
                          {
                            height: scannedDevices.length
                              ? `${Math.max(8, pairedPercentage)}%`
                              : '4%',
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.chartColumnLabel}>
                      <View style={[styles.chartLegend, styles.pairedLegend]} />
                      <Text style={styles.chartLabel}>Đã ghép đôi</Text>
                    </View>
                  </View>
                  <View style={styles.chartColumn}>
                    <Text style={styles.chartColumnValue}>{unpairedCount}</Text>
                    <View style={styles.chartBarTrack}>
                      <View
                        style={[
                          styles.chartBar,
                          styles.unpairedBar,
                          {
                            height: scannedDevices.length
                              ? `${Math.max(8, unpairedPercentage)}%`
                              : '4%',
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.chartColumnLabel}>
                      <View style={[styles.chartLegend, styles.unpairedLegend]} />
                      <Text style={styles.chartLabel}>Thiết bị mới</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.devicesHeading}>
              <View>
                <Text style={styles.sectionTitle}>Thiết bị khả dụng</Text>
                <Text style={styles.sectionSubtitle}>
                  Chọn một thiết bị để xem thao tác
                </Text>
              </View>
              <Text style={styles.devicesCount}>
                {scannedDevices.length} thiết bị
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          discovering ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#13b8a6" />
              <Text style={styles.loadingText}>
                Đang tìm thiết bị Bluetooth...
              </Text>
              <Text style={styles.loadingHint}>
                Quá trình này có thể mất vài giây
              </Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <View style={styles.emptyIconCenter} />
              </View>
              <Text style={styles.emptyTitle}>Chưa có thiết bị nào</Text>
              <Text style={styles.emptyText}>
                Nhấn “Quét thiết bị” để tìm các thiết bị Bluetooth ở gần.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isSelected = item.id === deviceId;
          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                selectDevice(isSelected ? undefined : item);
              }}
              style={[
                styles.deviceCard,
                isSelected ? styles.deviceCardSelected : styles.deviceCardDefault,
              ]}
            >
              <View style={styles.deviceMain}>
                <View
                  style={[
                    styles.deviceIcon,
                    isSelected && styles.deviceIconSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.deviceIconText,
                      isSelected && styles.deviceIconTextSelected,
                    ]}
                  >
                    BT
                  </Text>
                </View>
                <View style={styles.deviceInfo}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.deviceName,
                      isSelected && styles.textSelected,
                    ]}
                  >
                    {item.name || 'Thiết bị chưa đặt tên'}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.deviceDetail,
                      isSelected && styles.textSelectedMuted,
                    ]}
                  >
                    {item.address}
                  </Text>
                </View>
                <View
                  style={[
                    styles.pairBadge,
                    item.bonded && styles.pairBadgePaired,
                    isSelected && styles.pairBadgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.pairBadgeText,
                      item.bonded && styles.pairBadgeTextPaired,
                      isSelected && styles.pairBadgeTextSelected,
                    ]}
                  >
                    {item.bonded ? 'Đã ghép đôi' : 'Thiết bị mới'}
                  </Text>
                </View>
              </View>

              {isSelected && (
                <View style={styles.actionContainer}>
                  {isConnected ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.disconnectBtn]}
                      onPress={() => disconnectDevice()}
                    >
                      <Text style={styles.actionBtnText}>Ngắt kết nối</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.connectBtn]}
                      onPress={() => connect(item)}
                      disabled={connecting}
                    >
                      <Text style={styles.actionBtnText}>
                        {connecting ? 'Đang kết nối...' : 'Kết nối thiết bị'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },
  banner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#edf4ff',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0eaf8',
  },
  demoDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#3d7be5',
    marginRight: 8,
  },
  bannerText: {
    color: '#3b68aa',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9edf3',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bluetoothMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#edf3ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e4edff',
  },
  bluetoothMarkText: {
    color: '#3978df',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7f3',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  connectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#f3b64c',
    marginRight: 7,
  },
  connectionDotActive: {
    backgroundColor: '#38bd92',
  },
  connectionText: {
    color: '#397e67',
    fontSize: 11,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#172b4d',
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  heroSubtitle: {
    color: '#8793a5',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#3d7be5',
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonActive: {
    backgroundColor: '#dce8ff',
  },
  scanButtonIcon: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  scanButtonIconDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#172b4d',
  },
  sectionSubtitle: {
    color: '#8a96a8',
    fontSize: 12,
    marginTop: 4,
  },
  countBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#eaf1ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeText: {
    color: '#3978df',
    fontSize: 13,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: -5,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    minHeight: 112,
    backgroundColor: '#ffffff',
    borderRadius: 17,
    marginHorizontal: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e9edf3',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconTeal: {
    backgroundColor: '#edf3ff',
  },
  statIconBlue: {
    backgroundColor: '#eef2f8',
  },
  statIconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#3d7be5',
  },
  statIconRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#7e91ad',
  },
  statValue: {
    color: '#172b4d',
    fontSize: 21,
    fontWeight: '800',
  },
  statLabel: {
    color: '#8a96a8',
    fontSize: 11,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e9edf3',
  },
  chartHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    color: '#172b4d',
    fontSize: 14,
    fontWeight: '700',
  },
  chartSubtitle: {
    color: '#97a1b0',
    fontSize: 11,
    marginTop: 3,
  },
  chartTotalBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#edf3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTotal: {
    color: '#3978df',
    fontSize: 16,
    fontWeight: '800',
  },
  chartTotalLabel: {
    color: '#7e95bd',
    fontSize: 7,
    fontWeight: '700',
    marginTop: 1,
  },
  chartPlot: {
    height: 128,
    position: 'relative',
    marginTop: 2,
  },
  chartGuide: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderColor: '#edf0f5',
  },
  chartGuideTop: {
    top: 24,
  },
  chartGuideMiddle: {
    top: 62,
  },
  chartGuideBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 100,
    borderTopWidth: 1,
    borderColor: '#e5eaf1',
  },
  chartColumns: {
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  chartColumn: {
    width: '38%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartColumnValue: {
    color: '#60718a',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  chartBarTrack: {
    height: 76,
    width: 28,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    backgroundColor: '#f3f6fa',
  },
  chartBar: {
    width: '100%',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  pairedBar: {
    backgroundColor: '#3d7be5',
  },
  unpairedBar: {
    backgroundColor: '#9abcf5',
  },
  chartColumnLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  chartLegend: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  pairedLegend: {
    backgroundColor: '#3d7be5',
  },
  unpairedLegend: {
    backgroundColor: '#9abcf5',
  },
  chartLabel: {
    color: '#758399',
    fontSize: 10,
  },
  devicesHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  devicesCount: {
    color: '#8a96a8',
    fontSize: 11,
  },
  loadingContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 17,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9edf3',
  },
  loadingText: {
    marginTop: 14,
    color: '#172b4d',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingHint: {
    marginTop: 5,
    color: '#97a1b0',
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 17,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9edf3',
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#edf3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyIconCenter: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderRadius: 7,
    borderColor: '#3d7be5',
  },
  emptyTitle: {
    color: '#172b4d',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 5,
  },
  emptyText: {
    color: '#97a1b0',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
  deviceCard: {
    padding: 14,
    borderRadius: 17,
    marginBottom: 12,
    borderWidth: 1,
  },
  deviceCardDefault: {
    backgroundColor: '#ffffff',
    borderColor: '#e9edf3',
  },
  deviceCardSelected: {
    backgroundColor: '#3d7be5',
    borderColor: '#3d7be5',
  },
  deviceMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#edf3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceIconSelected: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  deviceIconText: {
    color: '#3978df',
    fontSize: 12,
    fontWeight: '800',
  },
  deviceIconTextSelected: {
    color: '#ffffff',
  },
  deviceInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#172b4d',
  },
  deviceDetail: {
    fontSize: 11,
    color: '#8a96a8',
    marginTop: 5,
  },
  textSelected: {
    color: '#ffffff',
  },
  textSelectedMuted: {
    color: '#d7f4ed',
  },
  pairBadge: {
    backgroundColor: '#f0f3f6',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 6,
    maxWidth: 95,
  },
  pairBadgePaired: {
    backgroundColor: '#edf4ff',
  },
  pairBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  pairBadgeText: {
    color: '#758597',
    fontSize: 9,
    fontWeight: '700',
  },
  pairBadgeTextPaired: {
    color: '#3978df',
  },
  pairBadgeTextSelected: {
    color: '#ffffff',
  },
  actionContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  actionBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtn: {
    backgroundColor: '#245ec7',
  },
  disconnectBtn: {
    backgroundColor: '#c84b58',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
