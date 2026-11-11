export interface ColdStorageTelemetry {
  temperature: number;
  humidity: number;
  doorOpen: boolean;
  exposureSec: number;
}

export interface MqttLogEntry {
  id: string;
  time: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface MqttConnectionConfig {
  url: string;
  username?: string;
  password?: string;
  topic: string;
}

export interface MqttHandlers {
  onTelemetry: (telemetry: ColdStorageTelemetry) => void;
  onAlert: (durationMs: number) => void;
  onStatus: (status: 'connected' | 'connecting' | 'offline' | 'error') => void;
  onError: (message: string) => void;
  onLog?: (entry: MqttLogEntry) => void;
}

export type MqttUnsubscribe = () => void;
