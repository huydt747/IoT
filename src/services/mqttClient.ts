import mqtt, { MqttClient } from 'mqtt';
import {
  ColdStorageTelemetry,
  MqttConnectionConfig,
  MqttHandlers,
  MqttLogEntry,
  MqttUnsubscribe,
} from './mqttTypes';

export * from './mqttTypes';

function createLog(level: MqttLogEntry['level'], message: string): MqttLogEntry {
  const now = new Date();
  const time = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time,
    level,
    message,
  };
}

export function connectToColdStorageMqtt(
  handlers: MqttHandlers,
  customConfig?: Partial<MqttConnectionConfig>
): MqttUnsubscribe {
  // Ưu tiên config tùy chỉnh, sau đó đến .env, sau đó đến config từ ArduinoCode.ino
  const url =
    customConfig?.url ||
    process.env.EXPO_PUBLIC_MQTT_URL ||
    'wss://rbd0db1d.ala.asia-southeast1.emqxsl.com:8084/mqtt';

  const username =
    customConfig?.username !== undefined
      ? customConfig.username
      : (process.env.EXPO_PUBLIC_MQTT_USERNAME ?? '3sv');

  const password =
    customConfig?.password !== undefined
      ? customConfig.password
      : (process.env.EXPO_PUBLIC_MQTT_PASSWORD ?? '1234567890');

  const topic =
    customConfig?.topic ||
    process.env.EXPO_PUBLIC_MQTT_TOPIC ||
    'test';

  const log = (level: MqttLogEntry['level'], message: string) => {
    if (handlers.onLog) {
      handlers.onLog(createLog(level, message));
    }
  };

  if (!url) {
    const msg = 'Chưa cấu hình URL MQTT Broker.';
    handlers.onError(msg);
    log('error', msg);
    return () => {};
  }

  log('info', `Bắt đầu kết nối MQTT tới: ${url}`);
  log('info', `Tài khoản: "${username || '(không)'}", Topic lắng nghe: "${topic}"`);
  handlers.onStatus('connecting');

  let client: MqttClient | null = null;
  let isClosedManually = false;

  try {
    client = mqtt.connect(url, {
      username: username || undefined,
      password: password || undefined,
      reconnectPeriod: 4000,
      connectTimeout: 12000,
      keepalive: 30,
      clean: true,
    });
  } catch (err: any) {
    const errorMsg = `Khởi tạo MQTT Client thất bại: ${err?.message || err}`;
    handlers.onError(errorMsg);
    log('error', errorMsg);
    handlers.onStatus('error');
    return () => {};
  }

  client.on('connect', () => {
    if (isClosedManually) return;
    log('success', `Đã kết nối thành công tới MQTT Broker (${url})`);
    handlers.onStatus('connected');

    // Subscribe vào topic chính và topic alert (nếu khác nhau)
    const topicsToSub = [topic];
    if (topic !== 'test') topicsToSub.push('test');
    if (topic !== 'esp8266/dht11') topicsToSub.push('esp8266/dht11');

    log('info', `Đang đăng ký (subscribe) các topics: [${topicsToSub.join(', ')}]...`);

    client?.subscribe(topicsToSub, (error, granted) => {
      if (error) {
        const errorMsg = `Lỗi subscribe topic: ${error.message}`;
        handlers.onError(errorMsg);
        log('error', errorMsg);
        return;
      }
      const grantedTopics = granted?.map((g) => `${g.topic} (QoS ${g.qos})`).join(', ');
      log('success', `Đăng ký thành công: ${grantedTopics}`);
    });
  });

  client.on('reconnect', () => {
    if (isClosedManually) return;
    log('warn', 'Mất kết nối với Broker. Đang tự động kết nối lại...');
    handlers.onStatus('connecting');
  });

  client.on('offline', () => {
    if (isClosedManually) return;
    log('warn', 'Client đang offline (chưa liên lạc được với Broker).');
    handlers.onStatus('offline');
  });

  client.on('close', () => {
    if (isClosedManually) return;
    log('warn', 'Kết nối WebSocket với MQTT Broker đã đóng.');
    handlers.onStatus('offline');
  });

  client.on('error', (error: any) => {
    if (isClosedManually) return;
    const errorMsg = `Lỗi MQTT: ${error?.message || error}`;
    log('error', errorMsg);
    handlers.onError(errorMsg);
    handlers.onStatus('error');
  });

  client.on('message', (msgTopic, messageBuffer) => {
    if (isClosedManually) return;
    const rawText = messageBuffer.toString();
    log('info', `[Nhận tin từ "${msgTopic}"]: ${rawText}`);

    let payload: any;
    try {
      payload = JSON.parse(rawText);
    } catch {
      const err = `Dữ liệu nhận từ "${msgTopic}" không phải JSON hợp lệ: ${rawText}`;
      log('warn', err);
      handlers.onError(err);
      return;
    }

    if (typeof payload !== 'object' || payload === null) {
      log('warn', `Payload từ "${msgTopic}" không phải Object.`);
      return;
    }

    // 1. Kiểm tra nếu là bản tin cảnh báo cửa
    if (payload.alert || payload.type === 'cua_mo_qua_lau') {
      const durationMs =
        typeof payload.duration_ms === 'number'
          ? payload.duration_ms
          : (payload.exposure_sec ?? 180) * 1000;
      log('warn', `Phát hiện bản tin cảnh báo cửa: ${durationMs}ms`);
      handlers.onAlert(durationMs);
      return;
    }

    // 2. Kiểm tra bản tin đo lường Telemetry (hỗ trợ nhiều định dạng từ Wokwi & MQTTX)
    const rawTemp = payload.temperature ?? payload.temp ?? payload.t;
    const rawHum = payload.humidity ?? payload.hum ?? payload.h;
    const rawDoor = payload.door_open ?? payload.doorOpen ?? payload.door;
    const rawExposure = payload.exposure_sec ?? payload.exposureSec ?? payload.exposure ?? 0;

    const tempNum = typeof rawTemp === 'number' ? rawTemp : parseFloat(rawTemp);
    const humNum = typeof rawHum === 'number' ? rawHum : parseFloat(rawHum);
    const doorBool = typeof rawDoor === 'boolean' ? rawDoor : rawDoor === 'true' || rawDoor === 1;
    const exposureNum = typeof rawExposure === 'number' ? rawExposure : parseInt(rawExposure, 10) || 0;

    if (isNaN(tempNum)) {
      log('warn', `Bản tin từ "${msgTopic}" thiếu thông số nhiệt độ hợp lệ (temperature/temp).`);
      return;
    }

    const telemetry: ColdStorageTelemetry = {
      temperature: tempNum,
      humidity: isNaN(humNum) ? 0 : humNum,
      doorOpen: doorBool,
      exposureSec: exposureNum,
    };

    log('success', `Đã cập nhật telemetry: Nhiệt độ=${telemetry.temperature}°C, Độ ẩm=${telemetry.humidity}%, Cửa=${telemetry.doorOpen ? 'MỞ' : 'ĐÓNG'} (${telemetry.exposureSec}s)`);
    handlers.onTelemetry(telemetry);
  });

  return () => {
    isClosedManually = true;
    log('info', 'Ngắt kết nối MQTT theo yêu cầu người dùng/unmount.');
    try {
      client?.end(true);
    } catch {
      // ignore
    }
  };
}
