import { router } from 'expo-router';
import {
  Bell,
  Lightbulb,
  Refrigerator,
  Thermometer
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColdStorage } from '../../context/ColdStorageContext';
import { useSendData } from '../../Provider/BTContextProvider';

export default function ControlScreen() {
  const {
    temperature,
    humidity,
    doorOpen,
    exposureSec,
    isTempCritical,
    isBuzzerActive,
    hasTelemetry,
    toggleDoorSim,
    connectionStatus,
  } = useColdStorage();

  const sendData = useSendData();
  const [isLightManualOn, setIsLightManualOn] = React.useState(false);

  // Đèn tự bật khi cửa mở (theo ArduinoCode.ino line 141) hoặc bật thủ công
  const isLightActive = doorOpen || isLightManualOn;

  const handleToggleLight = () => {
    setIsLightManualOn((prev) => !prev);
    sendData('B');
  };

  const handleToggleDoor = () => {
    toggleDoorSim();
    sendData('F');
  };

  const tempDisplay = hasTelemetry ? `${temperature.toFixed(1)}°C` : '-18.5°C';

  return (
    <View style={styles.container}>
      {/* Lưới 4 thiết bị phần cứng thực tế theo ArduinoCode.ino */}
      <View style={styles.grid}>
        {/* 1. Thermostat (DHT22 - Pin 15) */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.push('/temperature')}
          style={[
            styles.card,
            isTempCritical && styles.cardDanger,
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: isTempCritical ? '#fee2e2' : '#f0f9ff' },
            ]}
          >
            <Thermometer
              size={24}
              color={isTempCritical ? '#ef4444' : '#0284c7'}
            />
          </View>
          <Text style={styles.cardVal}>{tempDisplay}</Text>
          <Text style={styles.cardTitle}>DHT22 (Pin 15)</Text>
          <Text style={styles.cardSub}>
            {hasTelemetry ? `Độ ẩm: ${humidity.toFixed(0)}%` : 'Kho đông sâu'}
          </Text>
          <View
            style={[
              styles.pillBadge,
              { backgroundColor: isTempCritical ? '#fee2e2' : '#e0f2fe' },
            ]}
          >
            <Text
              style={[
                styles.pillBadgeText,
                { color: isTempCritical ? '#ef4444' : '#0284c7' },
              ]}
            >
              {isTempCritical ? 'QUÁ NHIỆT' : 'AN TOÀN'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* 2. Cửa kho (Button - Pin 14) */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleToggleDoor}
          style={[
            styles.card,
            doorOpen && styles.cardWarning,
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: doorOpen ? '#fff7ed' : '#f1f5f9' },
            ]}
          >
            <Refrigerator
              size={24}
              color={doorOpen ? '#ea580c' : '#64748b'}
            />
          </View>
          <Text style={styles.cardVal}>
            {doorOpen ? `MỞ (${exposureSec}s)` : 'ĐÓNG'}
          </Text>
          <Text style={styles.cardTitle}>Cửa Kho (Pin 14)</Text>
          <Text style={styles.cardSub}>
            {doorOpen ? 'Chạm để đóng cửa' : 'Chạm để mở cửa'}
          </Text>
          <View
            style={[
              styles.pillBadge,
              { backgroundColor: doorOpen ? '#ffedd5' : '#f1f5f9' },
            ]}
          >
            <Text
              style={[
                styles.pillBadgeText,
                { color: doorOpen ? '#ea580c' : '#64748b' },
              ]}
            >
              {doorOpen ? 'PHƠI NHIỄM' : 'KÍN'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* 3. Đèn kho lạnh (Light - Pin 18 & LDR Pin 34) */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleToggleLight}
          style={[
            styles.card,
            isLightActive && styles.cardActiveLight,
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: isLightActive ? '#fef9c3' : '#f1f5f9' },
            ]}
          >
            <Lightbulb
              size={24}
              color={isLightActive ? '#ca8a04' : '#64748b'}
            />
          </View>
          <Text style={styles.cardVal}>
            {isLightActive ? 'BẬT SÁNG' : 'TẮT'}
          </Text>
          <Text style={styles.cardTitle}>Đèn Kho (Pin 18)</Text>
          <Text style={styles.cardSub}>
            {doorOpen ? 'Tự bật khi mở cửa' : 'Điều khiển thủ công'}
          </Text>
          <View
            style={[
              styles.pillBadge,
              { backgroundColor: isLightActive ? '#fef08a' : '#f1f5f9' },
            ]}
          >
            <Text
              style={[
                styles.pillBadgeText,
                { color: isLightActive ? '#a16207' : '#94a3b8' },
              ]}
            >
              {isLightActive ? 'LIGHT ON' : 'LIGHT OFF'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* 4. Còi Buzzer & LED cảnh báo (Pin 4 & Pin 2) */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.push('/alerts')}
          style={[
            styles.card,
            isBuzzerActive && styles.cardDanger,
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: isBuzzerActive ? '#fee2e2' : '#f1f5f9' },
            ]}
          >
            <Bell
              size={24}
              color={isBuzzerActive ? '#dc2626' : '#64748b'}
            />
          </View>
          <Text style={styles.cardVal}>
            {isBuzzerActive ? 'HÚ CÒI' : 'IM LẶNG'}
          </Text>
          <Text style={styles.cardTitle}>Còi & LED (Pin 4/2)</Text>
          <Text style={styles.cardSub}>
            {isBuzzerActive ? 'Cảnh báo vi phạm!' : 'Hệ thống an toàn'}
          </Text>
          <View
            style={[
              styles.pillBadge,
              { backgroundColor: isBuzzerActive ? '#fecaca' : '#f1f5f9' },
            ]}
          >
            <Text
              style={[
                styles.pillBadgeText,
                { color: isBuzzerActive ? '#b91c1c' : '#94a3b8' },
              ]}
            >
              {isBuzzerActive ? '🚨 ALARM' : 'NORMAL'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDanger: {
    borderColor: '#ef4444',
    backgroundColor: '#fffdfd',
  },
  cardWarning: {
    borderColor: '#ea580c',
    backgroundColor: '#fffaf5',
  },
  cardActiveLight: {
    borderColor: '#eab308',
    backgroundColor: '#fefce8',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  cardSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 8,
  },
  pillBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
