import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useColdStorage, TempRecord } from '../context/ColdStorageContext';

export default function TemperatureScreen() {
  const {
    temperature,
    tempThreshold,
    isTempCritical,
    minTemp,
    maxTemp,
    avgTemp,
    history,
    clearHistory,
  } = useColdStorage();

  const isSafe = !isTempCritical;
  const statusColor = isSafe ? '#0984e3' : '#d63031';
  const statusBg = isSafe ? '#e1f0fa' : '#ffebee';
  const statusText = isSafe ? 'ĐẠT CHUẨN ĐÔNG SÂU (AN TOÀN)' : 'CẢNH BÁO: VƯỢT NGƯỠNG!';

  // Chart data: recent 12 points
  const recentPoints = history.slice(0, 12).reverse();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Real-time Hero Card */}
      <View style={[styles.heroCard, { borderColor: statusColor }]}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroTitle}>Nhiệt Độ Hiện Tại (DHT22)</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        <View style={styles.tempDisplayContainer}>
          <Text style={[styles.tempValue, { color: statusColor }]}>
            {temperature > 0 ? `+${temperature.toFixed(1)}` : temperature.toFixed(1)}
          </Text>
          <Text style={[styles.tempUnit, { color: statusColor }]}>°C</Text>
        </View>

        <Text style={styles.thresholdNotice}>
          Ngưỡng an toàn bảo quản: ≤ {tempThreshold.toFixed(1)}°C
        </Text>
      </View>

      {/* Stats Summary Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Thấp nhất</Text>
          <Text style={[styles.statValue, { color: '#0984e3' }]}>
            {minTemp.toFixed(1)}°C
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Trung bình</Text>
          <Text style={[styles.statValue, { color: '#2d3436' }]}>
            {avgTemp.toFixed(1)}°C
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Cao nhất</Text>
          <Text style={[styles.statValue, { color: maxTemp > tempThreshold ? '#d63031' : '#e67e22' }]}>
            {maxTemp.toFixed(1)}°C
          </Text>
        </View>
      </View>

      {/* Visual Trend Chart */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Biểu Đồ Xu Hướng Gần Đây</Text>
        <Text style={styles.sectionSubtitle}>
          Dữ liệu đo mỗi 5 giây từ Wokwi ESP32
        </Text>

        <View style={styles.chartContainer}>
          {recentPoints.map((item, index) => {
            // Normalize temperature for visual bar height (-25°C to -10°C)
            const minScale = -25;
            const maxScale = -10;
            const clamped = Math.max(minScale, Math.min(maxScale, item.temperature));
            const percentage = ((clamped - minScale) / (maxScale - minScale)) * 100;
            const barHeight = Math.max(15, (percentage / 100) * 90);
            const isPointCritical = item.temperature > tempThreshold;

            return (
              <View key={item.id + index} style={styles.barColumn}>
                <Text style={styles.barLabel}>{item.temperature.toFixed(1)}</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: isPointCritical ? '#ff7675' : '#74b9ff',
                    },
                  ]}
                />
                <Text style={styles.barTime}>{item.timeStr.slice(-5)}</Text>
              </View>
            );
          })}
        </View>

        {/* Reference Threshold Line */}
        <View style={styles.refLineRow}>
          <View style={styles.dashedLine} />
          <Text style={styles.refLineText}>Đường ngưỡng -15.0°C</Text>
        </View>
      </View>

      {/* Temperature History List */}
      <View style={styles.card}>
        <View style={styles.historyHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Lịch Sử Đo Nhiệt Độ</Text>
            <Text style={styles.sectionSubtitle}>
              Tổng số {history.length} bản ghi
            </Text>
          </View>
          {history.length > 0 && (
            <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Xóa</Text>
            </TouchableOpacity>
          )}
        </View>

        {history.map((record) => {
          const isRecCritical = record.temperature > tempThreshold;
          return (
            <View key={record.id} style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyTime}>{record.timeStr}</Text>
                <Text style={styles.historyHumidity}>
                  Độ ẩm: {record.humidity.toFixed(1)}% | Cửa: {record.doorOpen ? 'Mở' : 'Đóng'}
                </Text>
              </View>

              <View style={styles.historyRight}>
                <Text
                  style={[
                    styles.historyTemp,
                    { color: isRecCritical ? '#d63031' : '#0984e3' },
                  ]}
                >
                  {record.temperature.toFixed(2)}°C
                </Text>
                <View
                  style={[
                    styles.miniBadge,
                    { backgroundColor: isRecCritical ? '#ffebee' : '#e8f5e9' },
                  ]}
                >
                  <Text
                    style={[
                      styles.miniBadgeText,
                      { color: isRecCritical ? '#d63031' : '#2e7d32' },
                    ]}
                  >
                    {isRecCritical ? 'Nguy hiểm' : 'An toàn'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
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
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d3436',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tempDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginVertical: 12,
  },
  tempValue: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -1,
  },
  tempUnit: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 10,
    marginLeft: 4,
  },
  thresholdNotice: {
    textAlign: 'center',
    color: '#636e72',
    fontSize: 13,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#636e72',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
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
    marginBottom: 12,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 130,
    paddingTop: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#dfe6e9',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 14,
    borderRadius: 4,
    marginTop: 4,
  },
  barLabel: {
    fontSize: 9,
    color: '#636e72',
    fontWeight: '600',
  },
  barTime: {
    fontSize: 9,
    color: '#b2bec3',
    marginTop: 4,
  },
  refLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  dashedLine: {
    width: 24,
    height: 2,
    backgroundColor: '#d63031',
    marginRight: 6,
  },
  refLineText: {
    fontSize: 11,
    color: '#d63031',
    fontWeight: '600',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#dfe6e9',
    borderRadius: 8,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#636e72',
    fontWeight: '700',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  historyLeft: {
    flex: 1,
  },
  historyTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3436',
  },
  historyHumidity: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyTemp: {
    fontSize: 16,
    fontWeight: '800',
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
