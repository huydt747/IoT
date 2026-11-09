import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { connectToColdStorageMqtt } from '../services/mqttClient';

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

const INITIAL_RECORDS: TempRecord[] = [
  { id: '1', timeStr: '09:00:00', timestamp: Date.now() - 900000, temperature: -19.2, humidity: 76.5, doorOpen: false, exposureSec: 0, isAlert: false },
  { id: '2', timeStr: '09:03:00', timestamp: Date.now() - 720000, temperature: -18.8, humidity: 77.0, doorOpen: false, exposureSec: 0, isAlert: false },
  { id: '3', timeStr: '09:06:00', timestamp: Date.now() - 540000, temperature: -18.4, humidity: 77.8, doorOpen: false, exposureSec: 0, isAlert: false },
  { id: '4', timeStr: '09:09:00', timestamp: Date.now() - 360000, temperature: -17.9, humidity: 78.2, doorOpen: false, exposureSec: 0, isAlert: false },
  { id: '5', timeStr: '09:12:00', timestamp: Date.now() - 180000, temperature: -18.1, humidity: 77.5, doorOpen: false, exposureSec: 0, isAlert: false },
  { id: '6', timeStr: '09:14:00', timestamp: Date.now() - 60000, temperature: -18.3, humidity: 76.8, doorOpen: false, exposureSec: 0, isAlert: false },
];

export function ColdStorageProvider({ children }: { children: ReactNode }) {
  const [temperature, setTemperature] = useState<number>(Platform.OS === 'web' ? 0 : -18.3);
  const [humidity, setHumidity] = useState<number>(Platform.OS === 'web' ? 0 : 76.8);
  const [doorOpen, setDoorOpen] = useState<boolean>(false);
  const [exposureSec, setExposureSec] = useState<number>(0);
  const [tempThreshold] = useState<number>(-15.0);
  const [doorThresholdSec] = useState<number>(180);
  const [history, setHistory] = useState<TempRecord[]>(
    Platform.OS === 'web' ? [] : INITIAL_RECORDS,
  );
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [hasTelemetry, setHasTelemetry] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'offline' | 'error' | 'simulated'
  >(Platform.OS === 'web' ? 'connecting' : 'simulated');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const isTempCritical = hasTelemetry && temperature > tempThreshold;
  const isDoorOverLimit = doorOpen && exposureSec > doorThresholdSec;
  const isBuzzerActive = isTempCritical || isDoorOverLimit;
  const isLedActive = isBuzzerActive;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    return connectToColdStorageMqtt({
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
          setAlerts((previous) => {
            const alreadyReported = previous.some(
              (alert) =>
                alert.type === 'temp_critical' &&
                timestamp - alert.timestamp < 60000,
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
        const now = new Date();
        const timestamp = now.getTime();
        setAlerts((previous) => [
          {
            id: timestamp.toString(),
            timeStr: now.toTimeString().split(' ')[0],
            timestamp,
            type: 'door_timeout',
            title: 'Cảnh báo: Cửa mở quá lâu',
            description: `Cửa kho lạnh đã mở ${Math.floor(durationMs / 1000)} giây.`,
          },
          ...previous,
        ]);
      },
      onStatus: (status) => {
        setConnectionStatus(status);
        if (status === 'connected') setConnectionError(null);
      },
      onError: (message) => {
        setConnectionStatus('error');
        setConnectionError(message);
      },
    });
  }, [tempThreshold]);

  // Door exposure timer
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let timer: ReturnType<typeof setInterval> | undefined;
    if (doorOpen) {
      timer = setInterval(() => {
        setExposureSec((prev) => {
          const next = prev + 1;
          if (next === doorThresholdSec) {
            // Trigger alert
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

  // Periodic Telemetry Simulator matching Wokwi (every 5 seconds like in ArduinoCode.ino)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const interval = setInterval(() => {
      setTemperature((curr) => {
        // slight fluctuation around -18.5°C, or warmer if door is open
        const delta = doorOpen ? +(Math.random() * 0.4 + 0.1) : (Math.random() * 0.4 - 0.2);
        const nextTemp = parseFloat((curr + delta).toFixed(2));
        
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

        // Check if critical temp reached
        if (nextTemp > tempThreshold) {
          setAlerts((a) => {
            if (a.length > 0 && a[0].type === 'temp_critical' && Date.now() - a[0].timestamp < 60000) {
              return a; // avoid duplicate alert within 1 minute
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
  }, [doorOpen, exposureSec, tempThreshold]);

  // Calculate stats
  const temps = history.map((h) => h.temperature);
  const minTemp = temps.length > 0 ? Math.min(...temps) : temperature;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : temperature;
  const avgTemp = temps.length > 0
    ? parseFloat((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1))
    : temperature;

  const toggleDoorSim = () => {
    if (doorOpen) setExposureSec(0);
    setDoorOpen(!doorOpen);
  };

  const setTemperatureDirect = (newTemp: number) => {
    setTemperature(newTemp);
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
        toggleDoorSim,
        setTemperatureDirect,
        clearHistory,
      }}
    >
      {children}
    </ColdStorageContext.Provider>
  );
}
