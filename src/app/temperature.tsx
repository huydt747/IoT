import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Line,
  G,
} from 'react-native-svg';
import {
  ArrowLeft,
  Plus,
  Minus,
  Power,
  Snowflake,
  Flame,
  Fan,
  Check,
  X,
  History,
  TrendingDown,
  TrendingUp,
  Activity,
} from 'lucide-react-native';
import CategoryBar from '../components/CategoryBar';
import { useColdStorage } from '../context/ColdStorageContext';

export default function TemperatureScreen() {
  const {
    temperature,
    humidity,
    tempThreshold,
    setTempThreshold,
    isTempCritical,
    minTemp,
    maxTemp,
    avgTemp,
    history,
    hasTelemetry,
    setTemperatureDirect,
    clearHistory,
    isBuzzerActive,
  } = useColdStorage();

  const [mode, setMode] = useState<'cooling' | 'heating' | 'fan'>('cooling');
  const [isPowerOn, setIsPowerOn] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [inputCustomTemp, setInputCustomTemp] = useState(
    hasTelemetry ? temperature.toFixed(1) : '-18.0'
  );
  const [showHistorySection, setShowHistorySection] = useState(false);

  // Chỉnh sửa nhiệt độ tăng / giảm
  const handleAdjustTemp = (delta: number) => {
    const current = hasTelemetry ? temperature : -18.0;
    const nextTemp = parseFloat((current + delta).toFixed(1));
    setTemperatureDirect(nextTemp);
  };

  const handleSaveCustomTemp = () => {
    const parsed = parseFloat(inputCustomTemp);
    if (!isNaN(parsed)) {
      setTemperatureDirect(parsed);
      setShowEditModal(false);
    } else {
      alert('Vui lòng nhập số nhiệt độ hợp lệ!');
    }
  };

  const displayTemp = hasTelemetry ? temperature : -18.0;
  const isSafe = !isTempCritical;

  // Tính toán vị trí SVG Dial
  // Giả định dải nhiệt độ từ -30°C đến +30°C (khoảng 60 độ)
  const MIN_TEMP = -30;
  const MAX_TEMP = 30;
  const clampedTemp = Math.max(MIN_TEMP, Math.min(MAX_TEMP, displayTemp));
  const tempPercent = (clampedTemp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);

  // Góc xoay từ 140° đến 400° (260 độ)
  const START_ANGLE = 140;
  const END_ANGLE = 400;
  const TOTAL_ANGLE = END_ANGLE - START_ANGLE;
  const currentAngle = START_ANGLE + tempPercent * TOTAL_ANGLE;
  const currentAngleRad = (currentAngle * Math.PI) / 180;

  const SVG_SIZE = 260;
  const CX = SVG_SIZE / 2;
  const CY = SVG_SIZE / 2;
  const RADIUS = 88;

  // Tính tọa độ núm xoay (knob handle)
  const knobX = CX + RADIUS * Math.cos(currentAngleRad);
  const knobY = CY + RADIUS * Math.sin(currentAngleRad);

  // Vẽ các vạch tick marks xung quanh vòng tròn
  const TICK_COUNT = 40;
  const ticks = [];
  for (let i = 0; i < TICK_COUNT; i++) {
    const angle = START_ANGLE + (i / (TICK_COUNT - 1)) * TOTAL_ANGLE;
    const rad = (angle * Math.PI) / 180;
    const isPast = angle <= currentAngle;
    const innerR = RADIUS + 12;
    const outerR = RADIUS + (i % 5 === 0 ? 22 : 18);

    const x1 = CX + innerR * Math.cos(rad);
    const y1 = CY + innerR * Math.sin(rad);
    const x2 = CX + outerR * Math.cos(rad);
    const y2 = CY + outerR * Math.sin(rad);

    ticks.push({
      x1,
      y1,
      x2,
      y2,
      isPast,
      color: isPast ? (angle > 270 ? '#ff4757' : '#2563eb') : '#e2e8f0',
      strokeWidth: i % 5 === 0 ? 2.5 : 1.5,
    });
  }

  // Vẽ arc đường cong nhiệt độ
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const startRad = (endAngle * Math.PI) / 180;
    const endRad = (startAngle * Math.PI) / 180;
    const startX = x + radius * Math.cos(startRad);
    const startY = y + radius * Math.sin(startRad);
    const endX = x + radius * Math.cos(endRad);
    const endY = y + radius * Math.sin(endRad);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${endX} ${endY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${startX} ${startY}`;
  };

  const bgArcPath = describeArc(CX, CY, RADIUS, START_ANGLE, END_ANGLE);
  const activeArcPath = describeArc(CX, CY, RADIUS, START_ANGLE, Math.max(START_ANGLE + 1, currentAngle));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. White Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.headerBackBtn}
        >
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Kho Lạnh Đông Sâu</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowEditModal(true)}
          style={styles.headerActionBtn}
        >
          <Plus size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* 2. Modular Horizontal Category Strip */}
      <CategoryBar activeId="thermostat" />

      {/* 3. Screen Main Title */}
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>Thermostat</Text>
        <Text style={styles.mainSubtitle}>
          {isPowerOn ? 'Hệ thống làm lạnh đang hoạt động' : 'Hệ thống đang TẮT'}
        </Text>
      </View>

      {/* 4. Mode Selection (Cooling, Heating, Fan) */}
      <View style={styles.modeRow}>
        {/* Cooling */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setMode('cooling')}
          style={[
            styles.modeCard,
            mode === 'cooling' && styles.modeCardActiveCooling,
          ]}
        >
          <Snowflake
            size={28}
            color={mode === 'cooling' ? '#ffffff' : '#94a3b8'}
          />
          <Text
            style={[
              styles.modeLabel,
              mode === 'cooling' && styles.modeLabelActive,
            ]}
          >
            Cooling
          </Text>
        </TouchableOpacity>

        {/* Heating / Defrost */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setMode('heating')}
          style={[
            styles.modeCard,
            mode === 'heating' && styles.modeCardActiveHeating,
          ]}
        >
          <Flame
            size={28}
            color={mode === 'heating' ? '#ffffff' : '#94a3b8'}
          />
          <Text
            style={[
              styles.modeLabel,
              mode === 'heating' && styles.modeLabelActive,
            ]}
          >
            Heating
          </Text>
        </TouchableOpacity>

        {/* Fan */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setMode('fan')}
          style={[
            styles.modeCard,
            mode === 'fan' && styles.modeCardActiveFan,
          ]}
        >
          <Fan
            size={28}
            color={mode === 'fan' ? '#ffffff' : '#94a3b8'}
          />
          <Text
            style={[
              styles.modeLabel,
              mode === 'fan' && styles.modeLabelActive,
            ]}
          >
            Fan
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5. Circular Thermostat Gauge Dial */}
      <View style={styles.dialContainer}>
        <Svg width={SVG_SIZE} height={SVG_SIZE} style={styles.dialSvg}>
          <Defs>
            <LinearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#2563eb" />
              <Stop offset="50%" stopColor="#38bdf8" />
              <Stop offset="100%" stopColor="#ff4757" />
            </LinearGradient>
          </Defs>

          {/* Tick marks */}
          {ticks.map((t, idx) => (
            <Line
              key={idx}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.color}
              strokeWidth={t.strokeWidth}
              strokeLinecap="round"
            />
          ))}

          {/* Background Arc Track */}
          <Path
            d={bgArcPath}
            stroke="#f1f5f9"
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
          />

          {/* Active Arc Track */}
          <Path
            d={activeArcPath}
            stroke="url(#arcGrad)"
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
          />

          {/* Knob handle */}
          <Circle
            cx={knobX}
            cy={knobY}
            r={11}
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth={4}
          />
        </Svg>

        {/* Central Controls: Minus, Big Red Temp, Plus */}
        <View style={styles.centerControlBox}>
          {/* Minus Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleAdjustTemp(-0.5)}
            style={styles.adjustBtn}
          >
            <Minus size={22} color="#475569" strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Central Temperature Display */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowEditModal(true)}
            style={styles.centerTempWrap}
          >
            <Text style={styles.centerTempVal}>
              {displayTemp > 0 ? `+${displayTemp.toFixed(1)}` : displayTemp.toFixed(1)}
            </Text>
            <Text style={styles.centerTempUnit}>°C</Text>
            <Text style={styles.centerTapHint}>Chạm để nhập số</Text>
          </TouchableOpacity>

          {/* Plus Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleAdjustTemp(+0.5)}
            style={styles.adjustBtn}
          >
            <Plus size={22} color="#475569" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Bottom Circular Power Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsPowerOn(!isPowerOn)}
          style={[
            styles.powerBtn,
            isPowerOn ? styles.powerBtnActive : styles.powerBtnInactive,
          ]}
        >
          <Power
            size={22}
            color={isPowerOn ? '#ff3b30' : '#94a3b8'}
            strokeWidth={2.5}
          />
        </TouchableOpacity>
      </View>

      {/* 6. Bottom 2 Comparison Cards (This Room / Outside) */}
      <View style={styles.comparisonRow}>
        {/* Card 1: Trong kho (This Room) */}
        <View style={styles.compareCard}>
          <Text style={styles.compareTitle}>This room (Trong kho)</Text>
          <View style={styles.compareMetricRow}>
            <Text style={styles.compareLabel}>Temperature</Text>
            <Text style={[styles.compareVal, { color: '#ff3b30' }]}>
              {displayTemp.toFixed(1)}°
            </Text>
          </View>
          <View style={styles.compareMetricRow}>
            <Text style={styles.compareLabel}>Air humidity</Text>
            <Text style={[styles.compareVal, { color: '#2563eb' }]}>
              {hasTelemetry ? `${humidity.toFixed(0)}%` : '76%'}
            </Text>
          </View>
        </View>

        {/* Card 2: Ngoài môi trường (Outside) */}
        <View style={styles.compareCard}>
          <Text style={styles.compareTitle}>Outside (Môi trường)</Text>
          <View style={styles.compareMetricRow}>
            <Text style={styles.compareLabel}>Temperature</Text>
            <Text style={[styles.compareVal, { color: '#ff3b30' }]}>30°</Text>
          </View>
          <View style={styles.compareMetricRow}>
            <Text style={styles.compareLabel}>Air humidity</Text>
            <Text style={[styles.compareVal, { color: '#2563eb' }]}>65%</Text>
          </View>
        </View>
      </View>

      {/* 7. Quick Edit Temperature Button */}
      <TouchableOpacity
        style={styles.editActionBanner}
        onPress={() => setShowEditModal(true)}
      >
        <Text style={styles.editActionBannerText}>
          ✏️ Bấm vào đây để nhập chính xác nhiệt độ kho
        </Text>
      </TouchableOpacity>

      {/* 8. Collapsible Stats & History Section */}
      <View style={styles.historyContainer}>
        <TouchableOpacity
          style={styles.historyToggleHeader}
          onPress={() => setShowHistorySection(!showHistorySection)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Activity size={18} color="#2563eb" style={{ marginRight: 8 }} />
            <Text style={styles.historyToggleTitle}>
              Thống Kê Min / Max & Nhật Ký Đo ({history.length} bản ghi)
            </Text>
          </View>
          <Text style={styles.historyToggleArrow}>
            {showHistorySection ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {showHistorySection && (
          <View style={styles.historyBody}>
            {/* Stats row */}
            <View style={styles.statsSummaryRow}>
              <View style={styles.statPill}>
                <TrendingDown size={16} color="#0984e3" />
                <Text style={styles.statPillLabel}>Thấp nhất</Text>
                <Text style={[styles.statPillVal, { color: '#0984e3' }]}>
                  {minTemp.toFixed(1)}°C
                </Text>
              </View>

              <View style={styles.statPill}>
                <Activity size={16} color="#2d3436" />
                <Text style={styles.statPillLabel}>Trung bình</Text>
                <Text style={styles.statPillVal}>{avgTemp.toFixed(1)}°C</Text>
              </View>

              <View style={styles.statPill}>
                <TrendingUp size={16} color="#d63031" />
                <Text style={styles.statPillLabel}>Cao nhất</Text>
                <Text style={[styles.statPillVal, { color: '#d63031' }]}>
                  {maxTemp.toFixed(1)}°C
                </Text>
              </View>
            </View>

            {/* History list */}
            {history.slice(0, 10).map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <Text style={styles.historyTime}>{item.timeStr}</Text>
                <Text
                  style={[
                    styles.historyTemp,
                    item.isAlert ? { color: '#d63031' } : { color: '#0984e3' },
                  ]}
                >
                  {item.temperature.toFixed(1)}°C
                </Text>
                <Text style={styles.historyHum}>{item.humidity.toFixed(1)}%</Text>
                <Text
                  style={[
                    styles.historyDoor,
                    item.doorOpen ? { color: '#e67e22' } : { color: '#2ed573' },
                  ]}
                >
                  {item.doorOpen ? 'Cửa Mở' : 'Đóng'}
                </Text>
              </View>
            ))}

            {history.length > 0 && (
              <TouchableOpacity
                onPress={clearHistory}
                style={styles.clearHistoryBtn}
              >
                <Text style={styles.clearHistoryText}>Xóa lịch sử đo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* MODAL: SỬA NHIỆT ĐỘ TRỰC TIẾP */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sửa Nhiệt Độ Kho Lạnh</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
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
                placeholder="-18.0"
                autoFocus
              />
              <Text style={styles.modalUnitText}>°C</Text>
            </View>

            {/* Gợi ý mức nhiệt nhanh */}
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
                onPress={() => setShowEditModal(false)}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  categoryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoryItem: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  categoryItemActive: {
    position: 'relative',
  },
  categoryText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 4,
  },
  categoryTextActive: {
    color: '#ff3b30',
    fontWeight: '800',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ff3b30',
    marginTop: 3,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 14,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
  },
  mainSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modeCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  modeCardActiveCooling: {
    backgroundColor: '#ff3b30',
    borderColor: '#ff3b30',
    shadowColor: '#ff3b30',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  modeCardActiveHeating: {
    backgroundColor: '#e67e22',
    borderColor: '#e67e22',
    shadowColor: '#e67e22',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  modeCardActiveFan: {
    backgroundColor: '#0984e3',
    borderColor: '#0984e3',
    shadowColor: '#0984e3',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 8,
  },
  modeLabelActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  dialContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    position: 'relative',
    height: 300,
  },
  dialSvg: {
    position: 'absolute',
  },
  centerControlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  adjustBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  centerTempWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  centerTempVal: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ff3b30',
    letterSpacing: -1,
  },
  centerTempUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: -4,
  },
  centerTapHint: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
  },
  powerBtn: {
    position: 'absolute',
    bottom: 24,
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  powerBtnActive: {
    borderColor: '#fee2e2',
    backgroundColor: '#fff5f5',
  },
  powerBtnInactive: {
    backgroundColor: '#f8fafc',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
  },
  compareCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  compareTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  compareMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  compareLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  compareVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  editActionBanner: {
    marginHorizontal: 20,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  editActionBannerText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700',
  },
  historyContainer: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  historyToggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f8fafc',
  },
  historyToggleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  historyToggleArrow: {
    fontSize: 12,
    color: '#64748b',
  },
  historyBody: {
    padding: 14,
  },
  statsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  statPillLabel: {
    fontSize: 9.5,
    color: '#64748b',
    marginTop: 2,
  },
  statPillVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyTime: {
    fontSize: 11,
    color: '#64748b',
  },
  historyTemp: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyHum: {
    fontSize: 11,
    color: '#334155',
  },
  historyDoor: {
    fontSize: 11,
    fontWeight: '600',
  },
  clearHistoryBtn: {
    marginTop: 10,
    alignSelf: 'center',
  },
  clearHistoryText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
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
