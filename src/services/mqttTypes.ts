export interface ColdStorageTelemetry {
  temperature: number;
  humidity: number;
  doorOpen: boolean;
  exposureSec: number;
}

export interface MqttHandlers {
  onTelemetry: (telemetry: ColdStorageTelemetry) => void;
  onAlert: (durationMs: number) => void;
  onStatus: (status: 'connected' | 'connecting' | 'offline') => void;
  onError: (message: string) => void;
}

export type MqttUnsubscribe = () => void;
