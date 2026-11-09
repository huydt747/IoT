import mqtt from 'mqtt';
import { MqttHandlers, MqttUnsubscribe } from './mqttTypes';

const MQTT_TOPIC = 'test';

export function connectToColdStorageMqtt(handlers: MqttHandlers): MqttUnsubscribe {
  const url = process.env.EXPO_PUBLIC_MQTT_URL;
  const username = process.env.EXPO_PUBLIC_MQTT_USERNAME;
  const password = process.env.EXPO_PUBLIC_MQTT_PASSWORD;

  if (!url) {
    handlers.onError('Chưa cấu hình EXPO_PUBLIC_MQTT_URL trong file .env.');
    return () => {};
  }

  handlers.onStatus('connecting');
  const client = mqtt.connect(url, {
    username,
    password,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
    keepalive: 30,
  });

  client.on('connect', () => {
    client.subscribe(MQTT_TOPIC, (error, granted) => {
      if (error) {
        handlers.onError(`Không đăng ký được MQTT topic "${MQTT_TOPIC}": ${error.message}`);
        return;
      }
      if (!granted || granted.some((subscription) => subscription.qos === 0x80)) {
        handlers.onError(`Broker từ chối đăng ký MQTT topic "${MQTT_TOPIC}".`);
        return;
      }
      handlers.onStatus('connected');
    });
  });

  client.on('reconnect', () => handlers.onStatus('connecting'));
  client.on('offline', () => handlers.onStatus('offline'));
  client.on('close', () => handlers.onStatus('offline'));
  client.on('error', (error) => handlers.onError(`MQTT: ${error.message}`));

  client.on('message', (topic, message) => {
    const text = message.toString();
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      handlers.onError(`MQTT gửi JSON không hợp lệ trên topic "${topic}".`);
      return;
    }

    if (topic === MQTT_TOPIC) {
      if (typeof payload !== 'object' || payload === null) {
        handlers.onError(`Dữ liệu MQTT trên topic "${MQTT_TOPIC}" không đúng định dạng.`);
        return;
      }

      if ('alert' in payload) {
        if (
          payload.alert !== 'cua_mo_qua_lau' ||
          !('duration_ms' in payload) ||
          typeof payload.duration_ms !== 'number' ||
          !Number.isFinite(payload.duration_ms)
        ) {
          handlers.onError('Dữ liệu cảnh báo MQTT không đúng định dạng.');
          return;
        }
        handlers.onAlert(payload.duration_ms);
        return;
      }

      const data = payload as Record<string, unknown>;
      if (
        typeof data.temperature !== 'number' ||
        !Number.isFinite(data.temperature) ||
        typeof data.humidity !== 'number' ||
        !Number.isFinite(data.humidity) ||
        typeof data.door_open !== 'boolean' ||
        typeof data.exposure_sec !== 'number' ||
        !Number.isFinite(data.exposure_sec)
      ) {
        handlers.onError('Telemetry thiếu temperature, humidity, door_open hoặc exposure_sec hợp lệ.');
        return;
      }

      handlers.onTelemetry({
        temperature: data.temperature,
        humidity: data.humidity,
        doorOpen: data.door_open,
        exposureSec: data.exposure_sec,
      });
    }
  });

  return () => client.end(true);
}
