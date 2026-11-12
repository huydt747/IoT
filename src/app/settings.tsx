import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColdStorage } from '../context/ColdStorageContext';

export default function SettingsScreen() {
  const {
    hasTelemetry,
    connectionStatus,
    mqttConfig,
    updateMqttConfig,
    mqttLogs,
    clearMqttLogs,
    isSimulatedMode,
    toggleSimulatedMode,
    isPushRegistered,
    pushStatusMessage,
    pushToken,
    serverUrl,
    updateServerUrlAndConnect,
    triggerTestPush,
  } = useColdStorage();

  const [testPushLoading, setTestPushLoading] = useState(false);
  const [inputUrl, setInputUrl] = useState(serverUrl || 'http://192.168.32.61:3000');
  const [isConnectingServer, setIsConnectingServer] = useState(false);
  const [showUrlSettings, setShowUrlSettings] = useState(!isPushRegistered);
  const [showTokenBox, setShowTokenBox] = useState(false);
  const [showMqttPanel, setShowMqttPanel] = useState(connectionStatus !== 'connected');
  const [inputMqttUrl, setInputMqttUrl] = useState(mqttConfig.url);
  const [inputMqttTopic, setInputMqttTopic] = useState(mqttConfig.topic);
  const [inputMqttUser, setInputMqttUser] = useState(mqttConfig.username || '');
  const [inputMqttPass, setInputMqttPass] = useState(mqttConfig.password || '');

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

  const handleTestPush = async (type: 'temp_critical' | 'door_timeout') => {
    setTestPushLoading(true);
    const result = await triggerTestPush(type);
    setTestPushLoading(false);
    alert(result.message);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.mqttPanelCard}>
        <View style={styles.mqttPanelHeader}>
          <View style={styles.mqttPanelHeading}>
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
            <Text style={styles.inputGroupLabel}>Chọn cấu hình nhanh (Preset):</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={[styles.presetBtn, mqttConfig.topic === 'test' && styles.presetBtnActive]}
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
                <View style={[styles.mqttInputCol, styles.mqttCredentialInput]}>
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
                <View style={[styles.mqttInputCol, styles.mqttCredentialInput]}>
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
                  isSimulatedMode && styles.mqttSimToggleBtnActive,
                ]}
                onPress={toggleSimulatedMode}
              >
                <Text style={styles.mqttSimToggleBtnText}>
                  {isSimulatedMode ? 'Đang Mô Phỏng (Tắt)' : 'Bật Giả Lập'}
                </Text>
              </TouchableOpacity>
            </View>

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
                  <Text style={styles.logEmptyText}>
                    Chưa có log. Đang chờ phản hồi từ mạng...
                  </Text>
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
                        <Text
                          style={[
                            styles.logMessage,
                            { color: item.level === 'error' ? '#ff6b81' : '#f1f2f6' },
                          ]}
                        >
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
                  const result = await updateServerUrlAndConnect(inputUrl);
                  setIsConnectingServer(false);
                  alert(result.message);
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
              💡 Mẹo: Dán link Cloudflare Tunnel (in ra khi chạy &quot;npm start&quot; ở server) hoặc IP máy tính
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
                {showTokenBox
                  ? '▲ Ẩn mã FCM Token'
                  : '🔑 Xem & Sao chép FCM Token (cho Firebase Console)'}
              </Text>
            </TouchableOpacity>

            {showTokenBox && (
              <View style={styles.tokenBox}>
                <Text style={styles.tokenInstruction}>
                  📌 <Text style={styles.tokenInstructionEmphasis}>Hướng dẫn Test on device:</Text>{' '}
                  Firebase Console không tự hiện thiết bị. Hãy bôi đen copy toàn bộ đoạn mã bên
                  dưới và dán vào ô &quot;Add a Firebase Installation ID or FCM registration token&quot;:
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
  mqttPanelHeading: {
    flex: 1,
    marginRight: 8,
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
  mqttCredentialInput: {
    flex: 1,
    marginHorizontal: 6,
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
  mqttSimToggleBtnActive: {
    backgroundColor: '#e67e22',
  },
  mqttSimToggleBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
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
  tokenInstructionEmphasis: {
    fontWeight: '700',
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
});
