import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useColdStorage } from '../context/ColdStorageContext';

export default function ColdStorageHomeScreen() {
  const {
    temperature,
    humidity,
    doorOpen,
    exposureSec,
    isTempCritical,
    isBuzzerActive,
    alerts,
    hasTelemetry,
    connectionStatus,
    connectionError,
    toggleDoorSim,
    setTemperatureDirect,
  } = useColdStorage();

  const isSafe = !isTempCritical;
  const tempColor = isSafe ? '#0984e3' : '#d63031';
  const connectionLabel = {
    connected: 'Wokwi ESP32 • MQTT Online',
    connecting: 'Đang kết nối MQTT...',
    offline: 'MQTT mất kết nối',
    error: 'Lỗi MQTT',
    simulated: 'Đang mô phỏng',
  }[connectionStatus];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Storage Overview Card */}
      <View style={styles.overviewCard}>
        <View style={styles.badgeRow}>
          <View style={[styles.connectionBadge, connectionStatus !== 'connected' && styles.connectionBadgeInactive]}>
            <View style={[styles.greenDot, connectionStatus !== 'connected' && styles.inactiveDot]} />
            <Text style={[styles.connectionText, connectionStatus !== 'connected' && styles.inactiveConnectionText]}>
              {connectionLabel}
            </Text>
          </View>
          {isBuzzerActive && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>🚨 CẢNH BÁO</Text>
            </View>
          )}
        </View>

        <Text style={styles.warehouseTitle}>Kho Lạnh Bảo Quản Đông Sâu</Text>
        <Text style={styles.warehouseDesc}>
          Topic: test | Server: EMQX
        </Text>
        {connectionError && <Text style={styles.connectionError}>{connectionError}</Text>}

        <View style={styles.quickMetricsRow}>
          {/* Quick Temp */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/temperature' as any)}
            style={styles.quickMetricBox}
          >
            <Text style={styles.quickMetricLabel}>Nhiệt độ (DHT22)</Text>
            <Text style={[styles.quickMetricVal, { color: tempColor }]}>
              {hasTelemetry ? `${temperature.toFixed(1)}°C` : '—'}
            </Text>
            <Text style={[styles.quickMetricSub, { color: tempColor }]}>
              {hasTelemetry
                ? isSafe
                  ? '❄️ An toàn'
                  : '⚠️ Quá nhiệt'
                : 'Chờ dữ liệu MQTT'}
            </Text>
          </TouchableOpacity>

          {/* Quick Humidity */}
          <View style={styles.quickMetricBox}>
            <Text style={styles.quickMetricLabel}>Độ ẩm</Text>
            <Text style={[styles.quickMetricVal, { color: '#00b894' }]}>
              {hasTelemetry ? `${humidity.toFixed(1)}%` : '—'}
            </Text>
            <Text style={styles.quickMetricSub}>Độ ẩm tối ưu</Text>
          </View>

          {/* Quick Door */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/door' as any)}
            style={styles.quickMetricBox}
          >
            <Text style={styles.quickMetricLabel}>Cửa kho (Pin 14)</Text>
            <Text
              style={[
                styles.quickMetricVal,
                { color: doorOpen ? '#e67e22' : '#2ed573' },
              ]}
            >
              {hasTelemetry ? (doorOpen ? 'ĐANG MỞ' : 'ĐÓNG') : '—'}
            </Text>
            <Text style={styles.quickMetricSub}>
              {hasTelemetry ? (doorOpen ? `${exposureSec}s` : 'Kín khít') : 'Chờ dữ liệu'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Feature Menu List */}
      <Text style={styles.menuSectionHeader}>CHỨC NĂNG QUẢN LÝ</Text>

      {/* 1. Nhiệt độ & Lịch sử */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push('/temperature' as any)}
        style={styles.menuCard}
      >
        <View style={[styles.menuIconBg, { backgroundColor: '#e1f0fa' }]}>
          <Text style={styles.menuIconEmoji}>🌡️</Text>
        </View>
        <View style={styles.menuInfo}>
          <View style={styles.menuTitleRow}>
            <Text style={styles.menuTitle}>Giám Sát Nhiệt Độ & Lịch Sử</Text>
            <Text style={[styles.menuHighlight, { color: tempColor }]}>
              {hasTelemetry ? `${temperature.toFixed(1)}°C` : '—'}
            </Text>
          </View>
          <Text style={styles.menuSubtitle}>
            Xem đồ thị biến thiên, nhiệt độ Min/Max/Avg và toàn bộ nhật ký đo.
          </Text>
        </View>
        <Text style={styles.menuChevron}>›</Text>
      </TouchableOpacity>

      {/* 2. Cửa & Thời gian phơi nhiễm */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push('/door' as any)}
        style={styles.menuCard}
      >
        <View style={[styles.menuIconBg, { backgroundColor: '#fff3e0' }]}>
          <Text style={styles.menuIconEmoji}>🚪</Text>
        </View>
        <View style={styles.menuInfo}>
          <View style={styles.menuTitleRow}>
            <Text style={styles.menuTitle}>Cảm Biến Cửa & Phơi Nhiễm</Text>
            <Text
              style={[
                styles.menuHighlight,
                { color: doorOpen ? '#e67e22' : '#2ed573' },
              ]}
            >
              {doorOpen ? `${exposureSec}s` : 'Đã đóng'}
            </Text>
          </View>
          <Text style={styles.menuSubtitle}>
            Đếm thời gian mở cửa, phát hiện cảnh báo quá 3 phút (Pin 14).
          </Text>
        </View>
        <Text style={styles.menuChevron}>›</Text>
      </TouchableOpacity>

      {/* 3. Cảnh báo & Chuông báo */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push('/alerts' as any)}
        style={styles.menuCard}
      >
        <View style={[styles.menuIconBg, { backgroundColor: '#ffebee' }]}>
          <Text style={styles.menuIconEmoji}>🚨</Text>
        </View>
        <View style={styles.menuInfo}>
          <View style={styles.menuTitleRow}>
            <Text style={styles.menuTitle}>Nhật Ký Cảnh Báo & Thiết Bị</Text>
            {alerts.length > 0 && (
              <View style={styles.alertCountBadge}>
                <Text style={styles.alertCountText}>{alerts.length}</Text>
              </View>
            )}
          </View>
          <Text style={styles.menuSubtitle}>
            Đèn LED (Pin 2), Còi Buzzer (Pin 4) và thông báo MQTT từ kho.
          </Text>
        </View>
        <Text style={styles.menuChevron}>›</Text>
      </TouchableOpacity>

      {/* Quick Test / Simulator Controls for Wokwi testing */}
      {connectionStatus === 'simulated' && (
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>Công Cụ Kiểm Thử Nhanh Wokwi</Text>
          <View style={styles.testButtonsRow}>
            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: doorOpen ? '#2ed573' : '#e67e22' }]}
              onPress={toggleDoorSim}
            >
              <Text style={styles.testBtnText}>
                {doorOpen ? 'Đóng Cửa Kho' : 'Mở Cửa Kho (Pin 14)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: isTempCritical ? '#0984e3' : '#d63031' }]}
              onPress={() => setTemperatureDirect(isTempCritical ? -18.5 : -12.0)}
            >
              <Text style={styles.testBtnText}>
                {isTempCritical ? 'Hạ nhiệt (-18.5°C)' : 'Thử quá nhiệt (-12°C)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f2f6',
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  connectionBadgeInactive: {
    backgroundColor: '#fff3e0',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2e7d32',
    marginRight: 6,
  },
  inactiveDot: {
    backgroundColor: '#e67e22',
  },
  connectionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2e7d32',
  },
  inactiveConnectionText: {
    color: '#b45f06',
  },
  connectionError: {
    color: '#d63031',
    fontSize: 12,
    marginBottom: 10,
  },
  alertBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d63031',
  },
  warehouseTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2d3436',
  },
  warehouseDesc: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 2,
    marginBottom: 16,
  },
  quickMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickMetricBox: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  quickMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#636e72',
    marginBottom: 4,
  },
  quickMetricVal: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  quickMetricSub: {
    fontSize: 10,
    fontWeight: '700',
  },
  menuSectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#636e72',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuIconEmoji: {
    fontSize: 24,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d3436',
  },
  menuHighlight: {
    fontSize: 14,
    fontWeight: '800',
    marginRight: 6,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#636e72',
    lineHeight: 16,
  },
  menuChevron: {
    fontSize: 22,
    fontWeight: '300',
    color: '#b2bec3',
    marginLeft: 6,
  },
  alertCountBadge: {
    backgroundColor: '#d63031',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginRight: 6,
  },
  alertCountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  testSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
  },
  testTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#636e72',
    marginBottom: 10,
    textAlign: 'center',
  },
  testButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  testBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
