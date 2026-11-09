import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColdStorage } from '../context/ColdStorageContext';

export default function DoorScreen() {
  const {
    doorOpen,
    exposureSec,
    doorThresholdSec,
    isBuzzerActive,
    isLedActive,
    toggleDoorSim,
  } = useColdStorage();

  const isOverLimit = doorOpen && exposureSec > doorThresholdSec;
  const progressPercent = Math.min(100, (exposureSec / doorThresholdSec) * 100);

  const formatSec = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins} phút ${secs < 10 ? '0' : ''}${secs} giây`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Door Status Card */}
      <View
        style={[
          styles.heroCard,
          { borderColor: doorOpen ? (isOverLimit ? '#d63031' : '#e67e22') : '#2ed573' },
        ]}
      >
        <Text style={styles.heroSub}>Trạng Thái Cảm Biến Cửa (PIN 14)</Text>
        <Text
          style={[
            styles.heroStatus,
            { color: doorOpen ? (isOverLimit ? '#d63031' : '#e67e22') : '#2ed573' },
          ]}
        >
          {doorOpen ? '🚪 CỬA ĐANG MỞ' : '🔒 CỬA ĐÃ ĐÓNG KÍN'}
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleDoorSim}
          style={[
            styles.simBtn,
            { backgroundColor: doorOpen ? '#2ed573' : '#e67e22' },
          ]}
        >
          <Text style={styles.simBtnText}>
            {doorOpen ? 'Mô phỏng Đóng cửa' : 'Mô phỏng Nhấn nút Mở cửa (Pin 14)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exposure Timer */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Thời Gian Phơi Nhiễm (Door Exposure)</Text>
        <Text style={styles.sectionSubtitle}>
          Ngưỡng tối đa cho phép: {doorThresholdSec / 60} phút ({doorThresholdSec}s)
        </Text>

        <View style={styles.timerRow}>
          <Text style={[styles.timerValue, { color: isOverLimit ? '#d63031' : '#2d3436' }]}>
            {formatSec(exposureSec)}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: isOverLimit ? '#d63031' : progressPercent > 70 ? '#e67e22' : '#2ed573',
              },
            ]}
          />
        </View>

        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>0s</Text>
          <Text style={styles.progressLabel}>Ngưỡng: {doorThresholdSec}s</Text>
        </View>

        {isOverLimit && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ CẢNH BÁO: Cửa mở quá {doorThresholdSec / 60} phút! Đã gửi thông báo đến MQTT topic "kholanh/esp32/canhbao/cua".
            </Text>
          </View>
        )}
      </View>

      {/* Local Hardware Actuators */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Thiết Bị Cảnh Báo Tại Chỗ</Text>

        <View style={styles.hardwareRow}>
          <View style={styles.hardwareItem}>
            <Text style={styles.hwIcon}>💡</Text>
            <Text style={styles.hwLabel}>Đèn LED (Pin 2)</Text>
            <Text style={[styles.hwState, { color: isLedActive ? '#d63031' : '#a4b0be' }]}>
              {isLedActive ? 'SÁNG (BẬT)' : 'TẮT'}
            </Text>
          </View>

          <View style={styles.hardwareItem}>
            <Text style={styles.hwIcon}>📢</Text>
            <Text style={styles.hwLabel}>Buzzer (Pin 4)</Text>
            <Text style={[styles.hwState, { color: isBuzzerActive ? '#d63031' : '#a4b0be' }]}>
              {isBuzzerActive ? 'HÚ CÒI (1000Hz)' : 'YÊN LẶNG'}
            </Text>
          </View>
        </View>
      </View>
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
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    elevation: 3,
  },
  heroSub: {
    fontSize: 13,
    color: '#636e72',
    fontWeight: '600',
    marginBottom: 6,
  },
  heroStatus: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 16,
  },
  simBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  simBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2d3436',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#b2bec3',
    marginTop: 2,
    marginBottom: 14,
  },
  timerRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  timerValue: {
    fontSize: 32,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 12,
    backgroundColor: '#dfe6e9',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: '#b2bec3',
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#ffebee',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  warningText: {
    color: '#d63031',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  hardwareRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
  },
  hardwareItem: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 14,
    width: '45%',
  },
  hwIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  hwLabel: {
    fontSize: 13,
    color: '#636e72',
    fontWeight: '600',
  },
  hwState: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
});
