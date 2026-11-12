import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import {
  Bluetooth,
  BluetoothConnected,
  Plus,
  Zap,
} from 'lucide-react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import ControlScreen from '../ControlScreen';
import CategoryBar from '../../components/CategoryBar';
import { DeviceCategory } from '../../config/categories';
import {
  DeviceContext,
  useDisconnectDevice,
} from '../../Provider/BTContextProvider';
import { useColdStorage } from '../../context/ColdStorageContext';

export default function HomeScreen() {
  const { connectedDevice, isConnected } = useContext(DeviceContext);
  const disconnectDevice = useDisconnectDevice();
  const { temperature, hasTelemetry } = useColdStorage();

  const [activeTab, setActiveTab] = useState<'rooms' | 'devices'>('devices');
  const [selectedCatId, setSelectedCatId] = useState<string>('thermostat');
  const [isMainOn, setIsMainOn] = useState(true);

  const handleSelectCategory = (cat: DeviceCategory) => {
    setSelectedCatId(cat.id);
    if (cat.route) {
      router.push(cat.route as any);
    }
  };

  const tempVal = hasTelemetry ? temperature.toFixed(1) : '-18.5';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Dark Top Header */}
      <View style={styles.darkHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.homeTitle}>Home</Text>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.avatarText}>KL</Text>
            <View
              style={[
                styles.avatarDot,
                { backgroundColor: isConnected ? '#2ed573' : '#ff4757' },
              ]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsRow}>
          <View style={styles.tabsLeft}>
            <TouchableOpacity onPress={() => setActiveTab('rooms')}>
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
              style={{ marginLeft: 20 }}
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

          <TouchableOpacity
            style={styles.redPlus}
            onPress={() => router.push('/temperature')}
          >
            <Plus size={22} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Modular Horizontal Category Strip */}
      <CategoryBar
        activeId={selectedCatId}
        onSelect={handleSelectCategory}
      />

      {/* 3. Main Device Card with SVG Dial */}
      <View style={styles.mainCard}>
        <View style={styles.mainCardHeader}>
          <View>
            <Text style={styles.mainCardTitle}>Kho Lạnh Bảo Quản</Text>
            <Text style={styles.mainCardSub}>Khu vực đông sâu (DHT22)</Text>
          </View>

          <TouchableOpacity
            onPress={() => setIsMainOn(!isMainOn)}
            style={[
              styles.switchBtn,
              isMainOn ? styles.switchOn : styles.switchOff,
            ]}
          >
            {isMainOn && <Text style={styles.switchTxtOn}>On</Text>}
            <View style={styles.switchCircle} />
            {!isMainOn && <Text style={styles.switchTxtOff}>Off</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.mainCardBody}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={styles.mainNum}>{tempVal}</Text>
              <Text style={styles.mainUnit}>°C</Text>
            </View>
            <Text style={styles.mainDesc}>Nhiệt độ hiện tại (DHT22)</Text>

            <View style={styles.pillsRow}>
              <View style={styles.pill}>
                <Zap size={14} color="#64748b" style={{ marginRight: 4 }} />
                <Text style={styles.pillTxt}>12Kw</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/temperature')}
                style={[styles.pill, { marginLeft: 6, backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}
              >
                <View style={styles.orangeDot} />
                <Text style={[styles.pillTxt, { color: '#ea580c' }]}>Sửa nhiệt</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/temperature')}
          >
            <Svg width={140} height={140} viewBox="0 0 140 140">
              <Defs>
                <LinearGradient id="gRainbow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#ec4899" />
                  <Stop offset="40%" stopColor="#8b5cf6" />
                  <Stop offset="80%" stopColor="#f59e0b" />
                  <Stop offset="100%" stopColor="#eab308" />
                </LinearGradient>
              </Defs>
              <Path
                d="M 70 70 L 25 115 A 60 60 0 0 1 115 115 Z"
                fill="url(#gRainbow)"
              />
              <Circle cx={70} cy={110} r={22} fill="#ffffff" />
              <Path
                d="M 28 105 A 50 50 0 0 1 25 85"
                stroke="#f97316"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
              />
              <Circle cx={26} cy={85} r={6} fill="#ff3b30" stroke="#ffffff" strokeWidth={2} />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. ControlScreen (Hardware Controls matching ArduinoCode.ino) */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>THIẾT BỊ PHẦN CỨNG (WOKWI ESP32)</Text>
        <ControlScreen />
      </View>

      {/* 5. Bluetooth Status Footer */}
      <View style={styles.footerContainer}>
        {isConnected ? (
          <View style={styles.connectedCard}>
            <View style={styles.statusRow}>
              <BluetoothConnected size={20} color="#2ed573" style={{ marginRight: 8 }} />
              <Text style={styles.connectedDeviceText} numberOfLines={1}>
                {connectedDevice || 'Đã kết nối Bluetooth'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => disconnectDevice()}
              style={styles.disconnectBtn}
            >
              <Text style={styles.disconnectBtnText}>Ngắt Kết Nối</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/scan' as any)}
            style={styles.scanBtn}
          >
            <Bluetooth size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.scanBtnText}>Quét & Kết Nối Bluetooth</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingBottom: 40,
  },
  darkHeader: {
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  avatarDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
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
  redPlus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  mainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  mainCardSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  switchBtn: {
    width: 54,
    height: 28,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  switchOn: {
    backgroundColor: '#ff3b30',
    justifyContent: 'space-between',
  },
  switchOff: {
    backgroundColor: '#e2e8f0',
    justifyContent: 'space-between',
  },
  switchTxtOn: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
  },
  switchTxtOff: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    marginRight: 4,
  },
  switchCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  mainCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  mainNum: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ff3b30',
  },
  mainUnit: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ff3b30',
    marginTop: 6,
    marginLeft: 3,
  },
  mainDesc: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: 'row',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f97316',
    marginRight: 4,
  },
  pillTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 10,
  },
  footerContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  connectedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  connectedDeviceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  disconnectBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  disconnectBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scanBtn: {
    flexDirection: 'row',
    backgroundColor: '#0984e3',
    paddingVertical: 12,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
