import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
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
    pushToken,
    isPushRegistered,
    pushStatusMessage,
    serverUrl,
    updateServerUrlAndConnect,
    triggerTestPush,
    registerPush,
    toggleDoorSim,
    setTemperatureDirect,
    mqttConfig,
    updateMqttConfig,
    reconnectMqtt,
    mqttLogs,
    clearMqttLogs,
    isSimulatedMode,
    toggleSimulatedMode,
  } = useColdStorage();

  const [testPushLoading, setTestPushLoading] = useState(false);
  const [inputUrl, setInputUrl] = useState(serverUrl || 'http://192.168.32.61:3000');
  const [isConnectingServer, setIsConnectingServer] = useState(false);
  const [showUrlSettings, setShowUrlSettings] = useState(!isPushRegistered);

  // MQTT Config Panel states
  const [showMqttPanel, setShowMqttPanel] = useState(connectionStatus !== 'connected');
  const [showMqttLogs, setShowMqttLogs] = useState(true);
  const [inputMqttUrl, setInputMqttUrl] = useState(mqttConfig.url);
  const [inputMqttTopic, setInputMqttTopic] = useState(mqttConfig.topic);
  const [inputMqttUser, setInputMqttUser] = useState(mqttConfig.username || '');
  const [inputMqttPass, setInputMqttPass] = useState(mqttConfig.password || '');
  const [showTokenBox, setShowTokenBox] = useState(false);

  // Đồng bộ khi mqttConfig thay đổi
  useEffect(() => {
    setInputMqttUrl(mqttConfig.url);
    setInputMqttTopic(mqttConfig.topic);
    setInputMqttUser(mqttConfig.username || '');
    setInputMqttPass(mqttConfig.password || '');
  }, [mqttConfig]);

  const handleTestPush = async (type: 'temp_critical' | 'door_timeout') => {
    setTestPushLoading(true);
    const result = await triggerTestPush(type);
    setTestPushLoading(false);
    alert(result.message);
  };

  const applyPresetWokwi = () => {
    const config = {
      url: 'wss://rbd0db1d.ala.asia-southeast1.emqxsl.com:8084/mqtt',
      topic: 'test',
      username: '3sv',
      password: '1234567890',
    };
    setInputMqttUrl(config.url);
    setInputMqttTopic(config.topic);
    setInputMqttUser(config.username);
    setInputMqttPass(config.password);
    updateMqttConfig(config);
  };

  const applyPresetEnv = () => {
    const config = {
      url: 'wss://q283121a.ala.asia-southeast1.emqxsl.com:8084/mqtt',
      topic: 'esp8266/dht11',
      username: 'admin',
      password: '123',
    };
    setInputMqttUrl(config.url);
    setInputMqttTopic(config.topic);
    setInputMqttUser(config.username);
    setInputMqttPass(config.password);
    updateMqttConfig(config);
  };

  const handleSaveCustomMqtt = () => {
    updateMqttConfig({
      url: inputMqttUrl.trim(),
      topic: inputMqttTopic.trim(),
      username: inputMqttUser.trim(),
      password: inputMqttPass.trim(),
    });
  };

  const isSafe = !isTempCritical;
  const tempColor = isSafe ? '#0984e3' : '#d63031';

  const connectionBadgeData = {
    connected: {
      label: 'Wokwi ESP32 • MQTT Online',
      bg: '#e8f5e9',
      dot: '#2e7d32',
      text: '#2e7d32',
    },
    connecting: {
      label: 'Đang kết nối MQTT...',
      bg: '#fff9c4',
      dot: '#f57f17',
      text: '#f57f17',
    },
    offline: {
      label: 'MQTT Mất Kết Nối',
      bg: '#ffebee',
      dot: '#d63031',
      text: '#d63031',
    },
    error: {
      label: 'Lỗi Kết Nối MQTT',
      bg: '#ffebee',
      dot: '#d63031',
      text: '#d63031',
    },
    simulated: {
      label: 'Chế độ mô phỏng',
      bg: '#fff3e0',
      dot: '#e67e22',
      text: '#e67e22',
    },
  }[connectionStatus];

  const brokerHost = mqttConfig.url.replace(/^wss?:\/\//, '').split(/[:/]/)[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Storage Overview Card */}
      <View style={styles.overviewCard}>
        <View style={styles.badgeRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowMqttPanel(!showMqttPanel)}
            style={[styles.connectionBadge, { backgroundColor: connectionBadgeData.bg }]}
          >
            <View style={[styles.statusDot, { backgroundColor: connectionBadgeData.dot }]} />
            <Text style={[styles.connectionText, { color: connectionBadgeData.text }]}>
              {connectionBadgeData.label}
            </Text>
          </TouchableOpacity>
          {isBuzzerActive && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>🚨 CẢNH BÁO</Text>
            </View>
          )}
        </View>

        <Text style={styles.warehouseTitle}>Kho Lạnh Bảo Quản Đông Sâu</Text>
        <Text style={styles.warehouseDesc}>
          Topic: <Text style={{ fontWeight: '700', color: '#0984e3' }}>{mqttConfig.topic}</Text> | Broker: {brokerHost}
        </Text>

        {connectionError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerTitle}>⚠️ LỖI KẾT NỐI BROKER:</Text>
            <Text style={styles.errorBannerText}>{connectionError}</Text>
          </View>
        )}

        <View style={styles.quickMetricsRow}>
          {/* Quick Temp */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/temperature' as any)}
            style={styles.quickMetricBox}
          >
            <Text style={styles.quickMetricLabel}>Nhiệt độ (DHT22)</Text>
            <Text style={[styles.quickMetricVal, { color: hasTelemetry ? tempColor : '#636e72' }]}>
              {hasTelemetry ? `${temperature.toFixed(1)}°C` : '—'}
            </Text>
            <Text style={[styles.quickMetricSub, { color: hasTelemetry ? tempColor : '#636e72' }]}>
              {hasTelemetry ? (isSafe ? '❄️ An toàn' : '⚠️ Quá nhiệt') : 'Chờ dữ liệu...'}
            </Text>
          </TouchableOpacity>

          {/* Quick Humidity */}
          <View style={styles.quickMetricBox}>
            <Text style={styles.quickMetricLabel}>Độ ẩm</Text>
            <Text style={[styles.quickMetricVal, { color: hasTelemetry ? '#00b894' : '#636e72' }]}>
              {hasTelemetry ? `${humidity.toFixed(1)}%` : '—'}
            </Text>
            <Text style={styles.quickMetricSub}>{hasTelemetry ? 'Độ ẩm tối ưu' : 'Chờ dữ liệu...'}</Text>
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
                { color: hasTelemetry ? (doorOpen ? '#e67e22' : '#2ed573') : '#636e72' },
              ]}
            >
              {hasTelemetry ? (doorOpen ? 'ĐANG MỞ' : 'ĐÓNG') : '—'}
            </Text>
            <Text style={styles.quickMetricSub}>
              {hasTelemetry ? (doorOpen ? `${exposureSec}s` : 'Kín khít') : 'Chờ dữ liệu...'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ======================================================= */}
      {/* MQTT REAL DATA CONNECTION & LOGS PANEL */}
      {/* ======================================================= */}
      <View style={styles.mqttPanelCard}>
        <View style={styles.mqttPanelHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.mqttPanelTitle}>📡 Kết Nối MQTT & Nhật Ký Thời Gian Thực</Text>
            <Text style={styles.mqttPanelSubtitle}>
              {hasTelemetry
                ? '🟢 Đang nhận dữ liệu trực tiếp từ ESP32 Wokwi'
                : 'Đang lắng nghe gói tin JSON từ EMQX Broker...'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.mqttPanelToggleBtn}
            onPress={() => setShowMqttPanel(!showMqttPanel)}
          >
            <Text style={styles.mqttPanelToggleText}>
              {showMqttPanel ? 'Thu gọn ▲' : 'Cấu hình & Logs ▼'}
            </Text>
          </TouchableOpacity>
        </View>

        {showMqttPanel && (
          <View style={styles.mqttPanelBody}>
            {/* Presets */}
            <Text style={styles.inputGroupLabel}>Chọn cấu hình nhanh (Preset):</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  mqttConfig.topic === 'test' && styles.presetBtnActive,
                ]}
                onPress={applyPresetWokwi}
              >
                <Text style={styles.presetBtnTitle}>⚡ Wokwi Code Hiện Tại</Text>
                <Text style={styles.presetBtnDesc}>Host: rbd0db1d | Topic: test</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  mqttConfig.topic === 'esp8266/dht11' && styles.presetBtnActive,
                ]}
                onPress={applyPresetEnv}
              >
                <Text style={styles.presetBtnTitle}>📁 File .env Ban Đầu</Text>
                <Text style={styles.presetBtnDesc}>Host: q283121a | Topic: esp8266/dht11</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Inputs */}
            <View style={styles.mqttInputGrid}>
              <View style={styles.mqttInputCol}>
                <Text style={styles.inputMiniLabel}>WebSocket Broker URL:</Text>
                <TextInput
                  value={inputMqttUrl}
                  onChangeText={setInputMqttUrl}
                  placeholder="wss://...:8084/mqtt"
                  placeholderTextColor="#a0aec0"
                  style={styles.mqttTextInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.mqttInputCol}>
                <Text style={styles.inputMiniLabel}>Topic Lắng Nghe:</Text>
                <TextInput
                  value={inputMqttTopic}
                  onChangeText={setInputMqttTopic}
                  placeholder="test hoặc esp8266/dht11"
                  placeholderTextColor="#a0aec0"
                  style={styles.mqttTextInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.mqttInputRow}>
                <View style={[styles.mqttInputCol, { flex: 1, marginRight: 6 }]}>
                  <Text style={styles.inputMiniLabel}>Username:</Text>
                  <TextInput
                    value={inputMqttUser}
                    onChangeText={setInputMqttUser}
                    placeholder="3sv"
                    placeholderTextColor="#a0aec0"
                    style={styles.mqttTextInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={[styles.mqttInputCol, { flex: 1, marginLeft: 6 }]}>
                  <Text style={styles.inputMiniLabel}>Password:</Text>
                  <TextInput
                    value={inputMqttPass}
                    onChangeText={setInputMqttPass}
                    placeholder="1234567890"
                    placeholderTextColor="#a0aec0"
                    style={styles.mqttTextInput}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.mqttActionRow}>
              <TouchableOpacity
                style={styles.mqttConnectActionBtn}
                onPress={handleSaveCustomMqtt}
              >
                <Text style={styles.mqttConnectActionBtnText}>🔄 Kết Nối Lại MQTT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mqttSimToggleBtn,
                  isSimulatedMode && { backgroundColor: '#e67e22' },
                ]}
                onPress={toggleSimulatedMode}
              >
                <Text style={styles.mqttSimToggleBtnText}>
                  {isSimulatedMode ? 'Đang Mô Phỏng (Tắt)' : 'Bật Giả Lập'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Terminal Live Logs */}
            <View style={styles.terminalContainer}>
              <View style={styles.terminalHeader}>
                <Text style={styles.terminalTitle}>📋 Nhật Ký Kết Nối (Console Logs)</Text>
                <TouchableOpacity onPress={clearMqttLogs}>
                  <Text style={styles.terminalClearBtn}>Xóa log</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.terminalLogBox}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                {mqttLogs.length === 0 ? (
                  <Text style={styles.logEmptyText}>Chưa có log. Đang chờ phản hồi từ mạng...</Text>
                ) : (
                  mqttLogs.map((item) => {
                    const color =
                      item.level === 'success'
                        ? '#2ed573'
                        : item.level === 'error'
                        ? '#ff4757'
                        : item.level === 'warn'
                        ? '#ffa502'
                        : '#70a1ff';
                    return (
                      <View key={item.id} style={styles.logRow}>
                        <Text style={styles.logTime}>[{item.time}]</Text>
                        <Text style={[styles.logLevel, { color }]}>
                          [{item.level.toUpperCase()}]
                        </Text>
                        <Text style={[styles.logMessage, { color: item.level === 'error' ? '#ff6b81' : '#f1f2f6' }]}>
                          {item.message}
                        </Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        )}
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
        <View style={[styles.menuIconBg, { backgroundColor: '#ffeaa7' }]}>
          <Text style={styles.menuIconEmoji}>🚪</Text>
        </View>
        <View style={styles.menuInfo}>
          <View style={styles.menuTitleRow}>
            <Text style={styles.menuTitle}>Trạng Thái Cửa & Phơi Nhiễm</Text>
            <Text
              style={[
                styles.menuHighlight,
                { color: doorOpen ? '#e67e22' : '#2ed573' },
              ]}
            >
              {doorOpen ? `MỞ (${exposureSec}s)` : 'ĐÓNG'}
            </Text>
          </View>
          <Text style={styles.menuSubtitle}>
            Bộ đếm thời gian mở cửa, phát hiện quên đóng cửa quá giới hạn 3 phút.
          </Text>
        </View>
        <Text style={styles.menuChevron}>›</Text>
      </TouchableOpacity>

      {/* 3. Nhật ký cảnh báo */}
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
            <Text style={styles.menuTitle}>Nhật Ký Cảnh Báo Vi Phạm</Text>
            <Text
              style={[
                styles.menuHighlight,
                { color: alerts.length > 0 ? '#d63031' : '#2ed573' },
              ]}
            >
              {alerts.length} sự kiện
            </Text>
          </View>
          <Text style={styles.menuSubtitle}>
            Danh sách cảnh báo quá nhiệt và cảnh báo cửa mở quá lâu từ Wokwi ESP32.
          </Text>
        </View>
        <Text style={styles.menuChevron}>›</Text>
      </TouchableOpacity>

      {/* Push Notification Service Status Card */}
      <View style={styles.pushCard}>
        <View style={styles.pushCardHeader}>
          <Text style={styles.pushCardTitle}>🔔 Thông Báo Đẩy Firebase (FCM)</Text>
          <View
            style={[
              styles.pushStatusBadge,
              { backgroundColor: isPushRegistered ? '#e8f5e9' : '#fff3e0' },
            ]}
          >
            <View
              style={[
                styles.pushStatusDot,
                { backgroundColor: isPushRegistered ? '#2e7d32' : '#e67e22' },
              ]}
            />
            <Text
              style={[
                styles.pushStatusText,
                { color: isPushRegistered ? '#2e7d32' : '#e67e22' },
              ]}
            >
              {isPushRegistered ? 'Đã kích hoạt' : 'Chưa kết nối'}
            </Text>
          </View>
        </View>

        <Text style={styles.pushStatusDesc}>{pushStatusMessage}</Text>

        {/* Cấu hình URL Server (Cloudflare Tunnel hoặc IP máy) */}
        {(!isPushRegistered || showUrlSettings) && (
          <View style={styles.urlInputBox}>
            <Text style={styles.urlInputLabel}>
              URL Server Node.js (Cloudflare Tunnel hoặc IP máy tính):
            </Text>
            <View style={styles.urlInputRow}>
              <TextInput
                value={inputUrl}
                onChangeText={setInputUrl}
                placeholder="https://xxx.trycloudflare.com hoặc IP:3000"
                placeholderTextColor="#a0aec0"
                style={styles.urlTextInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                disabled={isConnectingServer}
                onPress={async () => {
                  setIsConnectingServer(true);
                  const res = await updateServerUrlAndConnect(inputUrl);
                  setIsConnectingServer(false);
                  alert(res.message);
                }}
                style={styles.urlConnectBtn}
              >
                {isConnectingServer ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.urlConnectBtnText}>Kết Nối</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.urlHelpText}>
              💡 Mẹo: Dán link Cloudflare Tunnel (in ra khi chạy "npm start" ở server) hoặc IP máy tính
            </Text>
          </View>
        )}

        <View style={styles.pushActionsRow}>
          <TouchableOpacity
            disabled={testPushLoading}
            style={[styles.pushTestBtn, { backgroundColor: '#e74c3c' }]}
            onPress={() => handleTestPush('temp_critical')}
          >
            {testPushLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.pushTestBtnText}>🔥 Test Quá Nhiệt</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={testPushLoading}
            style={[styles.pushTestBtn, { backgroundColor: '#e67e22' }]}
            onPress={() => handleTestPush('door_timeout')}
          >
            {testPushLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.pushTestBtnText}>🚪 Test Cửa Mở</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setShowUrlSettings(!showUrlSettings)}
          style={styles.retryRegisterBtn}
        >
          <Text style={styles.retryRegisterText}>
            {showUrlSettings ? '▲ Ẩn cấu hình Server URL' : '⚙️ Đổi địa chỉ Server URL'}
          </Text>
        </TouchableOpacity>

        {pushToken && (
          <View style={styles.tokenContainer}>
            <TouchableOpacity
              onPress={() => setShowTokenBox(!showTokenBox)}
              style={styles.viewTokenBtn}
            >
              <Text style={styles.viewTokenText}>
                {showTokenBox ? '▲ Ẩn mã FCM Token' : '🔑 Xem & Sao chép FCM Token (cho Firebase Console)'}
              </Text>
            </TouchableOpacity>

            {showTokenBox && (
              <View style={styles.tokenBox}>
                <Text style={styles.tokenInstruction}>
                  📌 <Text style={{ fontWeight: '700' }}>Hướng dẫn Test on device:</Text> Firebase Console không tự hiện thiết bị. Hãy bôi đen copy toàn bộ đoạn mã bên dưới và dán vào ô "Add a Firebase Installation ID or FCM registration token":
                </Text>
                <TextInput
                  value={pushToken}
                  editable={false}
                  selectTextOnFocus
                  multiline
                  style={styles.tokenTextInput}
                />
              </View>
            )}
          </View>
        )}
      </View>

      {/* Quick Test Controls */}
      {isSimulatedMode && (
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>Công Cụ Kiểm Thử Giả Lập</Text>
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
    marginBottom: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '700',
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
    marginBottom: 12,
  },
  errorBanner: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ffc9c9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorBannerTitle: {
    color: '#e03131',
    fontWeight: '800',
    fontSize: 11,
    marginBottom: 2,
  },
  errorBannerText: {
    color: '#c92a2a',
    fontSize: 12,
    lineHeight: 16,
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
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  quickMetricSub: {
    fontSize: 10,
    fontWeight: '600',
  },

  // MQTT Panel Card Styles
  mqttPanelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mqttPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mqttPanelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  mqttPanelSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  mqttPanelToggleBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mqttPanelToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  mqttPanelBody: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  inputGroupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 8,
    marginHorizontal: 3,
  },
  presetBtnActive: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  presetBtnTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  presetBtnDesc: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  mqttInputGrid: {
    marginBottom: 10,
  },
  mqttInputCol: {
    marginBottom: 8,
  },
  mqttInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputMiniLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 3,
  },
  mqttTextInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#1e293b',
  },
  mqttActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mqttConnectActionBtn: {
    flex: 1.5,
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 6,
  },
  mqttConnectActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  mqttSimToggleBtn: {
    flex: 1,
    backgroundColor: '#94a3b8',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginLeft: 6,
  },
  mqttSimToggleBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Terminal Logs Styles
  terminalContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 4,
  },
  terminalTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  terminalClearBtn: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
  terminalLogBox: {
    maxHeight: 180,
  },
  logRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  logTime: {
    color: '#64748b',
    fontSize: 10,
    marginRight: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logLevel: {
    fontSize: 10,
    fontWeight: '700',
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logMessage: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
  },
  logEmptyText: {
    color: '#64748b',
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 8,
  },

  menuSectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#a4b0be',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  menuIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuIconEmoji: {
    fontSize: 22,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3436',
  },
  menuHighlight: {
    fontSize: 12,
    fontWeight: '800',
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#636e72',
    lineHeight: 15,
  },
  menuChevron: {
    fontSize: 20,
    fontWeight: '300',
    color: '#b2bec3',
    marginLeft: 8,
  },

  // Push Card
  pushCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginTop: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  pushCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pushCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2d3436',
  },
  pushStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pushStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  pushStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pushStatusDesc: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 14,
    lineHeight: 16,
  },
  urlInputBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  urlInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urlTextInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#1e293b',
    marginRight: 8,
  },
  urlConnectBtn: {
    backgroundColor: '#0984e3',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urlConnectBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  urlHelpText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 6,
    lineHeight: 14,
  },
  pushActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pushTestBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  pushTestBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  retryRegisterBtn: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 6,
  },
  retryRegisterText: {
    color: '#0984e3',
    fontSize: 12,
    fontWeight: '600',
  },
  tokenContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
    paddingTop: 8,
  },
  viewTokenBtn: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  viewTokenText: {
    color: '#636e72',
    fontSize: 11,
    fontWeight: '600',
  },
  tokenBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  tokenInstruction: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    marginBottom: 6,
  },
  tokenTextInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 6,
    padding: 8,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#0f172a',
    maxHeight: 80,
  },

  // Test section
  testSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 10,
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
