import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import {
  Plus,
  Home as HomeIcon,
  BarChart3,
  Bell,
  Settings,
  Zap,
  ChevronRight,
  Check,
  X,
  Sliders,
} from 'lucide-react-native';
import { useColdStorage } from '../context/ColdStorageContext';
import { useSendData } from '../Provider/BTContextProvider';
import CategoryBar from '../components/CategoryBar';
import ControlScreen from '../screens/ControlScreen';
import { DeviceCategory } from '../config/categories';

export default function ColdStorageHomeScreen() {
  const {
    temperature,
    humidity,
    doorOpen,
    isTempCritical,
    isBuzzerActive,
    hasTelemetry,
    connectionStatus,
    setTemperatureDirect,
    mqttConfig,
    serverUrl,
    isPushRegistered,
  } = useColdStorage();

  const sendData = useSendData();

  // Tabs: ROOMS vs DEVICES
  const [activeTab, setActiveTab] = useState<'rooms' | 'devices'>('devices');
  // Selected Category
  const [selectedCatId, setSelectedCatId] = useState<string>('thermostat');

  // Main cooling system switch state
  const [isSystemActive, setIsSystemActive] = useState(true);

  // Modal chỉnh sửa nhiệt độ nhanh
  const [showEditTempModal, setShowEditTempModal] = useState(false);
  const [inputCustomTemp, setInputCustomTemp] = useState(
    hasTelemetry ? temperature.toFixed(1) : '-18.5'
  );

  const handleToggleSystem = () => {
    setIsSystemActive((prev) => !prev);
    sendData('B');
  };

  const handleSaveCustomTemp = () => {
    const parsed = parseFloat(inputCustomTemp);
    if (!isNaN(parsed)) {
      setTemperatureDirect(parsed);
      setShowEditTempModal(false);
    } else {
      alert('Vui lòng nhập giá trị nhiệt độ hợp lệ!');
    }
  };

  const handleCategorySelect = (cat: DeviceCategory) => {
    setSelectedCatId(cat.id);
    if (cat.route) {
      router.push(cat.route as any);
    }
  };

  const tempDisplay = hasTelemetry ? temperature.toFixed(1) : '-18.5';
  const brokerHost = mqttConfig.url.replace(/^wss?:\/\//, '').split(/[:/]/)[0];

  return (
    <View style={styles.screenWrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* ========================================================= */}
        {/* 1. DARK HEADER (Home, Avatar, ROOMS / DEVICES, Red Plus) */}
        {/* ========================================================= */}
        <View style={styles.darkHeader}>
          {/* Top Row */}
          <View style={styles.headerTopRow}>
            <Text style={styles.homeTitle}>Home</Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/settings')}
              style={styles.avatarWrap}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>KL</Text>
              </View>
              {/* Status indicator dot */}
              <View
                style={[
                  styles.avatarBadgeDot,
                  {
                    backgroundColor: isBuzzerActive
                      ? '#ff3b30'
                      : connectionStatus === 'connected'
                      ? '#2ed573'
                      : '#ffa502',
                  },
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Sub Tabs: ROOMS | DEVICES + Red Plus (+) Button */}
          <View style={styles.tabsRow}>
            <View style={styles.tabsLeft}>
              <TouchableOpacity
                onPress={() => setActiveTab('rooms')}
                style={styles.tabItem}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'rooms' && styles.tabTextActive,
                  ]}
                >
                  ROOMS
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('devices')}
                style={styles.tabItem}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'devices' && styles.tabTextActive,
                  ]}
                >
                  DEVICES
                </Text>
              </TouchableOpacity>
            </View>

            {/* Red Circle Plus (+) Button -> Mở màn hình Thermostat chỉnh nhiệt */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/temperature')}
              style={styles.redPlusBtn}
            >
              <Plus size={22} color="#ffffff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================= */}
        {/* 2. MODULAR CATEGORY STRIP */}
        {/* ========================================================= */}
        <CategoryBar
          activeId={selectedCatId}
          onSelect={handleCategorySelect}
        />

        {/* ========================================================= */}
        {/* 3. MAIN CONTROLLER CARD (Kho Lạnh / Radial Arc Dial) */}
        {/* ========================================================= */}
        <View style={styles.mainDeviceCard}>
          {/* Card Header: Title + Switch */}
          <View style={styles.mainCardTopRow}>
            <View>
              <Text style={styles.deviceCardTitle}>Kho Lạnh Bảo Quản</Text>
              <Text style={styles.deviceCardSub}>Khu vực đông sâu (DHT22)</Text>
            </View>

            {/* Red pill toggle switch */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleToggleSystem}
              style={[
                styles.customSwitch,
                isSystemActive ? styles.customSwitchOn : styles.customSwitchOff,
              ]}
            >
              {isSystemActive && <Text style={styles.switchTextOn}>On</Text>}
              <View style={styles.switchKnob} />
              {!isSystemActive && <Text style={styles.switchTextOff}>Off</Text>}
            </TouchableOpacity>
          </View>

          {/* Middle: Left Metric + Right Radial Gradient Arc */}
          <View style={styles.cardCenterRow}>
            {/* Left Metric Info */}
            <View style={styles.metricLeftCol}>
              <View style={styles.bigValRow}>
                <Text style={styles.bigValNum}>{tempDisplay}</Text>
                <Text style={styles.bigValUnit}>°C</Text>
              </View>
              <Text style={styles.bigValDesc}>
                {isTempCritical ? '⚠️ Vượt ngưỡng an toàn' : 'Nhiệt độ hiện tại (DHT22)'}
              </Text>

              {/* Action pills at bottom left */}
              <View style={styles.miniPillRow}>
                <View style={styles.miniPill}>
                  <View style={styles.miniPillIconBg}>
                    <Zap size={13} color="#64748b" />
                  </View>
                  <Text style={styles.miniPillText}>12Kw</Text>
                </View>

                {/* Nút sửa nhiệt độ nhanh */}
                <TouchableOpacity
                  style={[styles.miniPill, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}
                  onPress={() => setShowEditTempModal(true)}
                >
                  <View style={[styles.miniPillIconBg, { backgroundColor: '#ffedd5' }]}>
                    <Sliders size={13} color="#ea580c" />
                  </View>
                  <Text style={[styles.miniPillText, { color: '#ea580c' }]}>Sửa nhiệt</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right: SVG Semi-Circular Colorful Radial Dial */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/temperature')}
              style={styles.dialRightCol}
            >
              <Svg width={170} height={170} viewBox="0 0 170 170">
                <Defs>
                  <LinearGradient id="radialRainbow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#ec4899" />
                    <Stop offset="35%" stopColor="#8b5cf6" />
                    <Stop offset="70%" stopColor="#f59e0b" />
                    <Stop offset="100%" stopColor="#eab308" />
                  </LinearGradient>
                </Defs>

                {/* Outer Circular Track */}
                <Path
                  d="M 25 140 A 60 60 0 0 1 145 140"
                  stroke="#f1f5f9"
                  strokeWidth={6}
                  fill="none"
                />

                {/* Filled Colorful Pie Arc */}
                <Path
                  d="M 85 85 L 30 135 A 70 70 0 0 1 140 135 Z"
                  fill="url(#radialRainbow)"
                  opacity={0.9}
                />

                {/* Inner white circle for donut effect */}
                <Circle cx={85} cy={130} r={26} fill="#ffffff" />

                {/* Active Orange slider track on left */}
                <Path
                  d="M 36 125 A 60 60 0 0 1 32 100"
                  stroke="#f97316"
                  strokeWidth={4}
                  fill="none"
                  strokeLinecap="round"
                />

                {/* Indicator Knob */}
                <Circle
                  cx={33}
                  cy={100}
                  r={8}
                  fill="#ff3b30"
                  stroke="#ffffff"
                  strokeWidth={2.5}
                />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================= */}
        {/* 4. MODULAR HARDWARE CONTROL GRID (Khớp ArduinoCode.ino) */}
        {/* ========================================================= */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>THIẾT BỊ PHẦN CỨNG (ARDUINO / WOKWI)</Text>
          <TouchableOpacity onPress={() => router.push('/scan' as any)}>
            <Text style={styles.sectionHeaderLink}>Bluetooth ›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <ControlScreen />
        </View>

        {/* ========================================================= */}
        {/* 5. CONNECTION STATUS FOOTER (MQTT & FCM) */}
        {/* ========================================================= */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/settings')}
          style={styles.connectionFooterCard}
        >
          <View style={styles.footerLeft}>
            <View
              style={[
                styles.footerDot,
                {
                  backgroundColor:
                    connectionStatus === 'connected' ? '#2ed573' : '#ff3b30',
                },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.footerStatusText}>
                EMQX MQTT: {connectionStatus.toUpperCase()} ({mqttConfig.topic})
              </Text>
              <Text style={styles.footerSubText} numberOfLines={1}>
                Server: {serverUrl} • FCM: {isPushRegistered ? 'Đã kết nối' : 'Chưa kết nối'} (Chạm để cài đặt)
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>
      </ScrollView>

      {/* ========================================================= */}
      {/* 6. BOTTOM NAVIGATION BAR (Home, Statics, Routines, Setting) */}
      {/* ========================================================= */}
      <View style={styles.bottomNav}>
        {/* Home */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {}}
        >
          <View style={styles.navIconActiveWrap}>
            <HomeIcon size={20} color="#ff3b30" strokeWidth={2.5} />
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        {/* Statics (Charts / Thermostat) */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/temperature')}
        >
          <BarChart3 size={20} color="#94a3b8" />
          <Text style={styles.navLabel}>Statics</Text>
        </TouchableOpacity>

        {/* Routines (Alerts / Door) */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/alerts')}
        >
          <Bell size={20} color="#94a3b8" />
          <Text style={styles.navLabel}>Routines</Text>
        </TouchableOpacity>

        {/* Setting */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/settings')}
        >
          <Settings size={20} color="#94a3b8" />
          <Text style={styles.navLabel}>Setting</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL: SỬA NHIỆT ĐỘ NHANH */}
      <Modal
        visible={showEditTempModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditTempModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sửa Nhiệt Độ Kho Lạnh</Text>
              <TouchableOpacity onPress={() => setShowEditTempModal(false)}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Nhập giá trị nhiệt độ muốn thiết lập (Ví dụ: -18.5, -20.0, -12.0)
            </Text>

            <View style={styles.modalInputRow}>
              <TextInput
                value={inputCustomTemp}
                onChangeText={setInputCustomTemp}
                keyboardType="numeric"
                style={styles.modalTextInput}
                placeholder="-18.5"
                autoFocus
              />
              <Text style={styles.modalUnitText}>°C</Text>
            </View>

            {/* Quick Presets */}
            <View style={styles.quickPresetRow}>
              {[-22.0, -18.5, -15.0, -10.0].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={styles.quickPresetBtn}
                  onPress={() => setInputCustomTemp(t.toFixed(1))}
                >
                  <Text style={styles.quickPresetBtnText}>{t}°C</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowEditTempModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveCustomTemp}
              >
                <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.modalSaveText}>Lưu Nhiệt Độ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingBottom: 90,
  },

  // Dark Header Styles
  darkHeader: {
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#475569',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  avatarBadgeDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    marginRight: 24,
    paddingVertical: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  redPlusBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },

  // Main Controller Card
  mainDeviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  mainCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  deviceCardSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  customSwitch: {
    width: 60,
    height: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  customSwitchOn: {
    backgroundColor: '#ff3b30',
    justifyContent: 'space-between',
  },
  customSwitchOff: {
    backgroundColor: '#e2e8f0',
    justifyContent: 'space-between',
  },
  switchTextOn: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
  },
  switchTextOff: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    marginRight: 6,
  },
  switchKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  cardCenterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  metricLeftCol: {
    flex: 1,
  },
  bigValRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bigValNum: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ff3b30',
    letterSpacing: -1,
  },
  bigValUnit: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ff3b30',
    marginTop: 6,
    marginLeft: 4,
  },
  bigValDesc: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
    marginTop: -2,
    marginBottom: 16,
  },
  miniPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  miniPillIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  miniPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  dialRightCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Functions Section
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  sectionHeaderLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },

  // Connection Footer
  connectionFooterCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
    marginBottom: 14,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  footerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  footerStatusText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  footerSubText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },

  // Bottom Navigation Bar
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconActiveWrap: {
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#ff3b30',
    fontWeight: '800',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalDesc: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 16,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#ff3b30',
    paddingVertical: 10,
  },
  modalUnitText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#64748b',
  },
  quickPresetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  quickPresetBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickPresetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 6,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  modalSaveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: '#ff3b30',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
