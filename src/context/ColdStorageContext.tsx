import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import {
  connectToColdStorageMqtt,
  ColdStorageTelemetry,
  MqttConnectionConfig,
  MqttLogEntry,
} from '../services/mqttClient';
import {
  registerForPushNotificationsAsync,
  sendTestPushAlertAsync,
  triggerLocalAlertNotification,
  isExpoGo,
  getServerUrl,
  registerTokenWithServer,
} from '../services/pushNotificationService';

export interface TempRecord {
  id: string;
  timeStr: string;
  timestamp: number;
  temperature: number;
  humidity: number;
  doorOpen: boolean;
  exposureSec: number;
  isAlert: boolean;
}

export interface AlertRecord {
  id: string;
  timeStr: string;
  timestamp: number;
  type: 'door_timeout' | 'temp_critical';
  title: string;
  description: string;
}

export interface ColdStorageState {
  temperature: number;
  humidity: number;
  doorOpen: boolean;
  exposureSec: number;
  tempThreshold: number; // default -15.0 °C
  setTempThreshold: (temp: number) => void;
  doorThresholdSec: number; // default 180s (3 minutes)
  isTempCritical: boolean;
  isBuzzerActive: boolean;
  isLedActive: boolean;
  history: TempRecord[];
  alerts: AlertRecord[];
  hasTelemetry: boolean;
  connectionStatus: 'connected' | 'connecting' | 'offline' | 'error' | 'simulated';
  connectionError: string | null;
  minTemp: number;
  maxTemp: number;
  avgTemp: number;

  // MQTT Config & Logs
  mqttConfig: MqttConnectionConfig;
  updateMqttConfig: (newConfig: Partial<MqttConnectionConfig>) => void;
  reconnectMqtt: () => void;
  mqttLogs: MqttLogEntry[];
  clearMqttLogs: () => void;
  isSimulatedMode: boolean;
  toggleSimulatedMode: () => void;

  // Push Notification
  pushToken: string | null;
  isPushRegistered: boolean;
  pushStatusMessage: string;
  serverUrl: string;
  updateServerUrlAndConnect: (newUrl: string) => Promise<{ success: boolean; message: string }>;
  triggerTestPush: (type?: 'temp_critical' | 'door_timeout') => Promise<{ success: boolean; message: string }>;
  registerPush: () => Promise<void>;
  toggleDoorSim: () => void;
  setTemperatureDirect: (temp: number) => void;
  clearHistory: () => void;
}

const ColdStorageContext = createContext<ColdStorageState | undefined>(undefined);

export function useColdStorage() {
  const ctx = useContext(ColdStorageContext);
  if (!ctx) {
    throw new Error('useColdStorage must be used within a ColdStorageProvider');
  }
  return ctx;
}

// Cấu hình MQTT mặc định lấy từ .env hoặc Wokwi ESP32
const DEFAULT_MQTT_CONFIG: MqttConnectionConfig = {
  url:
    process.env.EXPO_PUBLIC_MQTT_URL ||
    'wss://rbd0db1d.ala.asia-southeast1.emqxsl.com:8084/mqtt',
  username: process.env.EXPO_PUBLIC_MQTT_USERNAME || '3sv',
  password: process.env.EXPO_PUBLIC_MQTT_PASSWORD || '1234567890',
  topic: process.env.EXPO_PUBLIC_MQTT_TOPIC || 'test',
};

export function ColdStorageProvider({ children }: { children: ReactNode }) {
  const [temperature, setTemperature] = useState<number>(0);
  const [humidity, setHumidity] = useState<number>(0);
  const [doorOpen, setDoorOpen] = useState<boolean>(false);
  const [exposureSec, setExposureSec] = useState<number>(0);
  const [tempThreshold, setTempThreshold] = useState<number>(-15.0);
  const [doorThresholdSec] = useState<number>(180);
  const [history, setHistory] = useState<TempRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [hasTelemetry, setHasTelemetry] = useState(false);

  // Mặc định luôn ở chế độ kết nối dữ liệu thật MQTT, KHÔNG TỰ ĐỘNG MÔ PHỎNG
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'offline' | 'error' | 'simulated'
  >('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);

  // MQTT Config & Logs
  const [mqttConfig, setMqttConfig] = useState<MqttConnectionConfig>(DEFAULT_MQTT_CONFIG);
  const [mqttLogs, setMqttLogs] = useState<MqttLogEntry[]>([]);
  const [reconnectTrigger, setReconnectTrigger] = useState<number>(0);

  // Push Notification state
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isPushRegistered, setIsPushRegistered] = useState<boolean>(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<string>('Đang khởi tạo...');
  const [serverUrlState, setServerUrlState] = useState<string>(getServerUrl());

  const addMqttLog = useCallback((entry: MqttLogEntry) => {
    setMqttLogs((prev) => [entry, ...prev.slice(0, 99)]);
  }, []);

  const clearMqttLogs = useCallback(() => {
    setMqttLogs([]);
  }, []);

  const reconnectMqtt = useCallback(() => {
    setReconnectTrigger((prev) => prev + 1);
  }, []);

  const updateMqttConfig = useCallback((newConfig: Partial<MqttConnectionConfig>) => {
    setMqttConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      return updated;
    });
    setReconnectTrigger((prev) => prev + 1);
  }, []);

  const toggleSimulatedMode = useCallback(() => {
    setIsSimulatedMode((prev) => {
      const next = !prev;
      if (next) {
        setConnectionStatus('simulated');
        setConnectionError(null);
      } else {
        setConnectionStatus('connecting');
        setReconnectTrigger((r) => r + 1);
      }
      return next;
    });
  }, []);

  const updateServerUrlAndConnect = async (newUrl: string): Promise<{ success: boolean; message: string }> => {
    const cleanUrl = newUrl.trim().replace(/\/$/, '');
    setServerUrlState(cleanUrl);
    setPushStatusMessage(`Đang kết nối tới ${cleanUrl}...`);

    if (!pushToken) {
      const reg = await registerForPushNotificationsAsync();
      if (reg.token) {
        setPushToken(reg.token);
        const res = await registerTokenWithServer(reg.token, cleanUrl);
        setIsPushRegistered(res.success);
        setPushStatusMessage(res.message);
        return res;
      }
      return { success: false, message: 'Chưa có Push Token trên máy để gửi lên Server.' };
    }

    const res = await registerTokenWithServer(pushToken, cleanUrl);
    setIsPushRegistered(res.success);
    setPushStatusMessage(res.message);
    return res;
  };

  const registerPush = async () => {
    setPushStatusMessage('Đang đăng ký nhận thông báo...');
    const result = await registerForPushNotificationsAsync();
    if (result.isExpoGo) {
      setIsPushRegistered(true);
      setPushStatusMessage('Chế độ Expo Go: Sẵn sàng nhận chuông & banner cảnh báo nội bộ');
    } else if (result.token) {
      setPushToken(result.token);
      setIsPushRegistered(result.isRegisteredOnServer);
      setPushStatusMessage(
        result.isRegisteredOnServer
          ? 'Đã đăng ký nhận cảnh báo từ Server FCM'
          : 'Đã có FCM Token (Server chưa phản hồi)'
      );
    } else {
      setPushStatusMessage(result.error || 'Chưa thể đăng ký thông báo');
    }
  };

  const triggerTestPush = async (type: 'temp_critical' | 'door_timeout' = 'temp_critical') => {
    if (isExpoGo) {
      if (type === 'temp_critical') {
        await triggerLocalAlertNotification('temp_critical', temperature > 0 ? temperature : -10.5, 0);
      } else {
        await triggerLocalAlertNotification('door_timeout', temperature, 210);
      }
      return { success: true, message: 'Đã phát cảnh báo thử nghiệm (Expo Go local alert)!' };
    }

    const testTemp = type === 'temp_critical' ? -10.5 : temperature;
    const testDuration = type === 'door_timeout' ? 210 : 0;
    return await sendTestPushAlertAsync(type, testTemp, testDuration, serverUrlState);
  };

  // Push Notifications Setup
  useEffect(() => {
    let isMounted = true;

    registerForPushNotificationsAsync().then((result) => {
      if (!isMounted) return;
      if (result.token) {
        setPushToken(result.token);
        setIsPushRegistered(result.isRegisteredOnServer);
        setPushStatusMessage(
          result.isRegisteredOnServer
            ? 'Đã đăng ký nhận cảnh báo từ Server FCM'
            : 'Đã có FCM Token (Server chưa phản hồi)'
        );
      } else if (result.isExpoGo) {
        setIsPushRegistered(true);
        setPushStatusMessage('Chế độ Expo Go: Sẵn sàng nhận chuông & banner cảnh báo nội bộ');
      } else {
        setPushStatusMessage(result.error || 'Chưa thể đăng ký thông báo');
      }
    });

    let notificationSubscription: { remove: () => void } | undefined;
    let responseSubscription: { remove: () => void } | undefined;

    if (Platform.OS !== 'web') {
      notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log('[Notification Received]:', notification);
      });

      responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.screen === 'temperature') {
          router.push('/temperature' as any);
        } else if (data?.screen === 'door') {
          router.push('/door' as any);
        } else {
          router.push('/alerts' as any);
        }
      });
    }

    return () => {
      isMounted = false;
      notificationSubscription?.remove();
      responseSubscription?.remove();
    };
  }, []);

  const isTempCritical = hasTelemetry && temperature > tempThreshold;
  const isDoorOverLimit = doorOpen && exposureSec > doorThresholdSec;
  const isBuzzerActive = isTempCritical || isDoorOverLimit;
  const isLedActive = isBuzzerActive;

  // ===== KẾT NỐI MQTT THỰC TẾ (CHẠY TRÊN CẢ ANDROID, IOS VÀ WEB) =====
  useEffect(() => {
    if (isSimulatedMode) {
      setConnectionStatus('simulated');
      return;
    }

    setConnectionStatus('connecting');
    setConnectionError(null);

    const unsubscribe = connectToColdStorageMqtt(
      {
        onTelemetry: (telemetry) => {
          const now = new Date();
          const timestamp = now.getTime();
          const timeStr = now.toTimeString().split(' ')[0];

          setTemperature(telemetry.temperature);
          setHumidity(telemetry.humidity);
          setDoorOpen(telemetry.doorOpen);
          setExposureSec(telemetry.exposureSec);
          setHasTelemetry(true);

          setHistory((previous) => [
            {
              id: timestamp.toString(),
              timeStr,
              timestamp,
              temperature: telemetry.temperature,
              humidity: telemetry.humidity,
              doorOpen: telemetry.doorOpen,
              exposureSec: telemetry.exposureSec,
              isAlert: telemetry.temperature > tempThreshold,
            },
            ...previous.slice(0, 49),
          ]);

          if (telemetry.temperature > tempThreshold) {
            triggerLocalAlertNotification('temp_critical', telemetry.temperature, 0);
            setAlerts((previous) => {
              const alreadyReported = previous.some(
                (alert) =>
                  alert.type === 'temp_critical' && timestamp - alert.timestamp < 60000
              );
              if (alreadyReported) return previous;
              return [
                {
                  id: timestamp.toString(),
                  timeStr,
                  timestamp,
                  type: 'temp_critical',
                  title: 'Cảnh báo: Nhiệt độ vượt ngưỡng!',
                  description: `Nhiệt độ hiện tại ${telemetry.temperature}°C cao hơn mức an toàn ${tempThreshold}°C!`,
                },
                ...previous,
              ];
            });
          }
        },
        onAlert: (durationMs) => {
          const durationSec = Math.floor(durationMs / 1000);
          triggerLocalAlertNotification('door_timeout', temperature, durationSec);
          const now = new Date();
          const timestamp = now.getTime();
          setAlerts((previous) => [
            {
              id: timestamp.toString(),
              timeStr: now.toTimeString().split(' ')[0],
              timestamp,
              type: 'door_timeout',
              title: 'Cảnh báo: Cửa mở quá lâu',
              description: `Cửa kho lạnh đã mở ${durationSec} giây.`,
            },
            ...previous,
          ]);
        },
        onStatus: (status) => {
          setConnectionStatus(status);
          if (status === 'connected') {
            setConnectionError(null);
          }
        },
        onError: (message) => {
          setConnectionStatus('error');
          setConnectionError(message);
        },
        onLog: (entry) => {
          addMqttLog(entry);
        },
      },
      mqttConfig
    );

    return () => {
      unsubscribe();
    };
  }, [isSimulatedMode, reconnectTrigger, mqttConfig, tempThreshold, addMqttLog]);

  // Bộ đếm thời gian cửa mở (nếu cửa đang mở và không có telemetry tự tăng)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (doorOpen) {
      timer = setInterval(() => {
        setExposureSec((prev) => {
          const next = prev + 1;
          if (next === doorThresholdSec) {
            const now = new Date();
            const timeStr = now.toTimeString().split(' ')[0];
            setAlerts((a) => [
              {
                id: Date.now().toString(),
                timeStr,
                timestamp: Date.now(),
                type: 'door_timeout',
                title: 'Cảnh báo: Cửa mở quá 3 phút',
                description: `Cửa kho lạnh đã mở quá ${doorThresholdSec} giây, nhiệt độ có nguy cơ tăng nhanh!`,
              },
              ...a,
            ]);
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [doorOpen, doorThresholdSec]);

  // Bộ mô phỏng dữ liệu CHỈ CHẠY KHI NGƯỜI DÙNG BẬT "isSimulatedMode"
  useEffect(() => {
    if (!isSimulatedMode) return;

    const interval = setInterval(() => {
      setTemperature((curr) => {
        const delta = doorOpen ? +(Math.random() * 0.4 + 0.1) : Math.random() * 0.4 - 0.2;
        const base = curr === 0 ? -18.3 : curr;
        const nextTemp = parseFloat((base + delta).toFixed(2));

        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];

        const newRecord: TempRecord = {
          id: Date.now().toString(),
          timeStr,
          timestamp: Date.now(),
          temperature: nextTemp,
          humidity: parseFloat((76 + Math.random() * 3).toFixed(1)),
          doorOpen,
          exposureSec,
          isAlert: nextTemp > tempThreshold,
        };

        setHumidity(newRecord.humidity);
        setHasTelemetry(true);
        setHistory((prev) => [newRecord, ...prev.slice(0, 49)]);

        if (nextTemp > tempThreshold) {
          setAlerts((a) => {
            if (a.length > 0 && a[0].type === 'temp_critical' && Date.now() - a[0].timestamp < 60000) {
              return a;
            }
            return [
              {
                id: Date.now().toString(),
                timeStr,
                timestamp: Date.now(),
                type: 'temp_critical',
                title: 'Cảnh báo: Nhiệt độ vượt ngưỡng!',
                description: `Nhiệt độ hiện tại ${nextTemp}°C cao hơn mức an toàn ${tempThreshold}°C!`,
              },
              ...a,
            ];
          });
        }

        return nextTemp;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isSimulatedMode, doorOpen, exposureSec, tempThreshold]);

  // Calculate stats
  const temps = history.map((h) => h.temperature);
  const minTemp = temps.length > 0 ? Math.min(...temps) : temperature;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : temperature;
  const avgTemp =
    temps.length > 0
      ? parseFloat((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1))
      : temperature;

  const toggleDoorSim = () => {
    if (doorOpen) setExposureSec(0);
    setDoorOpen(!doorOpen);
  };

  const setTemperatureDirect = (newTemp: number) => {
    const formatted = parseFloat(newTemp.toFixed(1));
    setTemperature(formatted);
    setHasTelemetry(true);
    const now = new Date();
    const timestamp = now.getTime();
    const timeStr = now.toTimeString().split(' ')[0];
    setHistory((prev) => [
      {
        id: timestamp.toString(),
        timeStr,
        timestamp,
        temperature: formatted,
        humidity: humidity || 76.5,
        doorOpen,
        exposureSec,
        isAlert: formatted > tempThreshold,
      },
      ...prev.slice(0, 49),
    ]);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <ColdStorageContext.Provider
      value={{
        temperature,
        humidity,
        doorOpen,
        exposureSec,
        tempThreshold,
        setTempThreshold,
        doorThresholdSec,
        isTempCritical,
        isBuzzerActive,
        isLedActive,
        history,
        alerts,
        hasTelemetry,
        connectionStatus,
        connectionError,
        minTemp,
        maxTemp,
        avgTemp,

        // MQTT
        mqttConfig,
        updateMqttConfig,
        reconnectMqtt,
        mqttLogs,
        clearMqttLogs,
        isSimulatedMode,
        toggleSimulatedMode,

        // Push
        pushToken,
        isPushRegistered,
        pushStatusMessage,
        serverUrl: serverUrlState,
        updateServerUrlAndConnect,
        triggerTestPush,
        registerPush,
        toggleDoorSim,
        setTemperatureDirect,
        clearHistory,
      }}
    >
      {children}
    </ColdStorageContext.Provider>
  );
}
