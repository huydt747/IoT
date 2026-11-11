import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColdStorage } from '../context/ColdStorageContext';

export default function AlertsScreen() {
  const {
    alerts,
    isBuzzerActive,
    isPushRegistered,
    pushStatusMessage,
    triggerTestPush,
  } = useColdStorage();

  const [loading, setLoading] = React.useState(false);

  const handleTest = async (type: 'temp_critical' | 'door_timeout') => {
    setLoading(true);
    const res = await triggerTestPush(type);
    setLoading(false);
    alert(res.message);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hardware / Alarm Status Card */}
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

      {/* Push Notification Server Status Card */}
      <View style={styles.fcmBanner}>
        <View style={styles.fcmHeaderRow}>
          <Text style={styles.fcmTitle}>🔔 Firebase Push Notification Server</Text>
          <View style={[styles.fcmBadge, { backgroundColor: isPushRegistered ? '#e8f5e9' : '#fff3e0' }]}>
            <Text style={[styles.fcmBadgeText, { color: isPushRegistered ? '#2e7d32' : '#e67e22' }]}>
              {isPushRegistered ? 'Đang hoạt động' : 'Chưa kết nối'}
            </Text>
          </View>
        </View>
        <Text style={styles.fcmDesc}>{pushStatusMessage}</Text>

        <View style={styles.fcmBtnRow}>
          <TouchableOpacity
            disabled={loading}
            style={[styles.fcmBtn, { backgroundColor: '#e74c3c' }]}
            onPress={() => handleTest('temp_critical')}
          >
            <Text style={styles.fcmBtnText}>Gửi Push Quá Nhiệt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={loading}
            style={[styles.fcmBtn, { backgroundColor: '#e67e22' }]}
            onPress={() => handleTest('door_timeout')}
          >
            <Text style={styles.fcmBtnText}>Gửi Push Cửa Mở</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Nhật Ký Cảnh Báo MQTT & Firebase ({alerts.length})
      </Text>

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
    marginBottom: 16,
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
  fcmBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fcmHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fcmTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3436',
  },
  fcmBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  fcmBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fcmDesc: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 10,
  },
  fcmBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fcmBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  fcmBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
