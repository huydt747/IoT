import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Cấu hình cách hiển thị thông báo khi app đang mở (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export const NOTIFICATION_CHANNEL_ID = 'cold_storage_alerts';
export const DEFAULT_TOPIC = process.env.EXPO_PUBLIC_NOTIFICATION_TOPIC || 'kholanh_alerts';

// Kiểm tra xem ứng dụng có đang chạy trong Expo Go hay không
export const isExpoGo =
  Constants.appOwnership === 'expo' ||
  (Constants as any).executionEnvironment === 'storeClient';

let customServerUrl: string | null = null;

export function setCustomServerUrl(url: string) {
  customServerUrl = url.trim().replace(/\/$/, '');
}

export function getServerUrl(): string {
  if (customServerUrl && customServerUrl.length > 0) {
    return customServerUrl;
  }
  const envUrl = process.env.EXPO_PUBLIC_SERVER_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/$/, '');
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
}

/**
 * Đăng ký token trực tiếp lên Server Node.js (hỗ trợ đổi URL động)
 */
export async function registerTokenWithServer(
  token: string,
  targetUrl?: string
): Promise<{ success: boolean; message: string }> {
  if (targetUrl) {
    setCustomServerUrl(targetUrl);
  }
  const serverUrl = getServerUrl();
  try {
    const response = await fetch(`${serverUrl}/api/topic/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokens: [token],
        topic: DEFAULT_TOPIC,
      }),
    });
    const data = await response.json();
    if (data.success) {
      return { success: true, message: `Đã kết nối thành công với Server (${serverUrl})!` };
    }
    return { success: false, message: data.message || 'Server từ chối đăng ký token.' };
  } catch (err: any) {
    return {
      success: false,
      message: `Không thể kết nối đến ${serverUrl}: ${err.message}`,
    };
  }
}

export interface PushRegistrationResult {
  token: string | null;
  isRegisteredOnServer: boolean;
  isExpoGo: boolean;
  error: string | null;
}

/**
 * Khởi tạo kênh thông báo Android (Bỏ qua hoàn toàn trên Expo Go để tránh NullPointerException)
 */
export async function setupNotificationChannelAsync(): Promise<void> {
  // Expo Go trên Android không có NotificationsChannelsProvider độc lập, bắt buộc phải bỏ qua
  if (isExpoGo || Platform.OS !== 'android') {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Cảnh Báo Kho Lạnh',
      description: 'Thông báo khẩn cấp khi nhiệt độ vượt ngưỡng hoặc cửa mở quá 3 phút',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#d63031',
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
    });
  } catch {
    // Bỏ qua nếu môi trường không hỗ trợ
  }
}

/**
 * Đăng ký nhận Push Notification
 */
export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  try {
    if (Platform.OS === 'web') {
      return {
        token: null,
        isRegisteredOnServer: false,
        isExpoGo,
        error: 'Push notification chạy tối ưu trên thiết bị di động (Android / iOS).',
      };
    }

    // 1. Nếu đang chạy trong Expo Go:
    // Expo từ SDK 53 đã ngừng hỗ trợ Remote FCM trong Expo Go.
    // Thay vào đó, app sẽ dùng Local Notification (thông báo cục bộ) để phát chuông & banner.
    if (isExpoGo) {
      console.log('📌 [Push] Chế độ Expo Go: Kích hoạt Thông Báo Cục Bộ (Local Notifications).');
      // Vẫn xin quyền thông báo để hiển thị banner & chuông
      const { status } = await Notifications.requestPermissionsAsync();
      return {
        token: null,
        isRegisteredOnServer: false,
        isExpoGo: true,
        error: status === 'granted' ? null : 'Vui lòng cho phép quyền thông báo trong cài đặt máy.',
      };
    }

    // 2. Chế độ Development Build hoặc Bản cài APK/AAB độc lập:
    await setupNotificationChannelAsync();

    if (!Device.isDevice) {
      return {
        token: null,
        isRegisteredOnServer: false,
        isExpoGo: false,
        error: 'Cần thiết bị thật để nhận Push Notification qua Firebase FCM.',
      };
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return {
        token: null,
        isRegisteredOnServer: false,
        isExpoGo: false,
        error: 'Người dùng từ chối cấp quyền thông báo.',
      };
    }

    let token: string | null = null;
    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      token = typeof deviceToken.data === 'string' ? deviceToken.data : JSON.stringify(deviceToken.data);
    } catch (e: any) {
      console.warn('[Push] Thử lấy Expo Token:', e.message);
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? (Constants as any)?.easConfig?.projectId;
        const expoToken = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        token = expoToken.data;
      } catch {}
    }

    let isRegisteredOnServer = false;
    const serverUrl = getServerUrl();
    if (token) {
      try {
        const response = await fetch(`${serverUrl}/api/topic/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokens: [token],
            topic: DEFAULT_TOPIC,
          }),
        });
        const data = await response.json();
        isRegisteredOnServer = data.success === true;
      } catch {}
    }

    return {
      token,
      isRegisteredOnServer,
      isExpoGo: false,
      error: null,
    };
  } catch (err: any) {
    return {
      token: null,
      isRegisteredOnServer: false,
      isExpoGo,
      error: err.message || null,
    };
  }
}

/**
 * Hiển thị thông báo cảnh báo ngay lập tức trên máy (hoạt động 100% trên Expo Go & APK)
 */
export async function triggerLocalAlertNotification(
  type: 'temp_critical' | 'door_timeout',
  temperature: number,
  durationSec: number
): Promise<void> {
  const isDoor = type === 'door_timeout';
  const alertTitle = isDoor
    ? '🚨 CẢNH BÁO: Cửa Kho Lạnh Mở Quá Lâu!'
    : '⚠️ CẢNH BÁO: Nhiệt Độ Kho Lạnh Vượt Ngưỡng!';
  const alertBody = isDoor
    ? `Cửa kho đã mở quá ${Math.floor(durationSec / 60)} phút. Nhiệt độ có nguy cơ tăng nhanh!`
    : `Nhiệt độ hiện tại ${temperature.toFixed(1)}°C vượt quá ngưỡng an toàn (-15.0°C)!`;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: alertTitle,
        body: alertBody,
        data: {
          screen: isDoor ? 'door' : 'temperature',
          type,
          temperature,
          durationSec,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // Bắn ngay lập tức
    });
  } catch (err: any) {
    console.warn('[Push] Lỗi hiển thị thông báo cục bộ:', err.message);
  }
}

/**
 * Gửi thông báo test: Bắn ngay thông báo trên máy & gọi Node.js Server nếu có
 */
export async function sendTestPushAlertAsync(
  type: 'temp_critical' | 'door_timeout' = 'temp_critical',
  temperature = -11.5,
  doorDurationSec = 210,
  targetServerUrl?: string
): Promise<{ success: boolean; message: string }> {
  // 1. Luôn bắn thông báo chuông & banner trên điện thoại
  await triggerLocalAlertNotification(type, temperature, doorDurationSec);

  // 2. Gửi thêm yêu cầu tới Server Node.js (nếu server đang bật)
  const serverUrl = targetServerUrl || getServerUrl();
  try {
    await fetch(`${serverUrl}/api/notify/alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        temperature,
        doorDurationSec,
        topic: DEFAULT_TOPIC,
      }),
    });
  } catch {}

  return {
    success: true,
    message: 'Đã bắn thông báo chuông & banner cảnh báo thành công trên điện thoại!',
  };
}
