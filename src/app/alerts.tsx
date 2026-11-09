import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useColdStorage } from '../context/ColdStorageContext';

export default function AlertsScreen() {
  const { alerts, isBuzzerActive } = useColdStorage();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.statusCard, { backgroundColor: isBuzzerActive ? '#ffebee' : '#e8f5e9' }]}>
        <Text style={styles.statusIcon}>{isBuzzerActive ? '🚨' : '✅'}</Text>
        <Text style={[styles.statusTitle, { color: isBuzzerActive ? '#d63031' : '#2e7d32' }]}>
          {isBuzzerActive ? 'HỆ THỐNG ĐANG BÁO ĐỘNG' : 'TẤT CẢ CHỈ SỐ BÌNH THƯỜNG'}
        </Text>
        <Text style={styles.statusDesc}>
          {isBuzzerActive
            ? 'Đèn LED và Còi Buzzer đang kích hoạt do phát hiện sự cố!'
            : 'Kho lạnh hoạt động ổn định trong tầm kiểm soát.'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Nhật Ký Cảnh Báo MQTT ({alerts.length})</Text>

      {alerts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Chưa có cảnh báo nào được ghi nhận.</Text>
        </View>
      ) : (
        alerts.map((item) => (
          <View key={item.id} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertType}>
                {item.type === 'door_timeout' ? '🚪 CẢNH BÁO CỬA' : '🌡️ CẢNH BÁO NHIỆT ĐỘ'}
              </Text>
              <Text style={styles.alertTime}>{item.timeStr}</Text>
            </View>
            <Text style={styles.alertTitle}>{item.title}</Text>
            <Text style={styles.alertDesc}>{item.description}</Text>
          </View>
        ))
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
    paddingBottom: 32,
  },
  statusCard: {
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusDesc: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2d3436',
    marginBottom: 12,
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#b2bec3',
    fontSize: 14,
  },
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#d63031',
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  alertType: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d63031',
  },
  alertTime: {
    fontSize: 11,
    color: '#b2bec3',
    fontWeight: '600',
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 4,
  },
  alertDesc: {
    fontSize: 13,
    color: '#636e72',
    lineHeight: 18,
  },
});
