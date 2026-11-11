# 🚀 Node.js Push Notification Server (Firebase FCM)

Server Node.js Express cung cấp các API để gửi Thông Báo Đẩy (Push Notification) tới ứng dụng di động (Android / iOS) sử dụng **Firebase Cloud Messaging (FCM HTTP v1)**.

Đặc biệt tối ưu hóa cho hệ thống **Giám Sát Kho Lạnh IoT**: tự động gửi cảnh báo khi nhiệt độ vượt ngưỡng hoặc cửa mở quá 3 phút.

---

## 📁 Cấu Trúc Thư Mục

```text
server/
├── index.js                # Express Server chính & các API endpoints
├── firebase.js             # Khởi tạo Firebase Admin SDK
├── package.json            # Danh sách thư viện (express, firebase-admin, cors, dotenv)
├── test-send.js            # Script kiểm thử API gửi thông báo
├── .env.example            # Mẫu cấu hình cổng và đường dẫn
├── .gitignore              # Bảo vệ serviceAccountKey.json không bị đưa lên Git
└── serviceAccountKey.json  # File khóa bí mật từ Firebase Console (bạn cần thêm vào)
```

---

## 🔑 Bước 1: Tải file `serviceAccountKey.json` từ Firebase

1. Truy cập vào [Firebase Console](https://console.firebase.google.com/).
2. Chọn dự án (Project) của bạn (hoặc tạo một dự án mới nếu chưa có).
3. Bấm vào icon bánh răng **⚙️ (Project settings)** ở góc trên bên trái.
4. Chuyển sang tab **Service accounts** (Tài khoản dịch vụ).
5. Nhấn vào nút **Generate new private key** (Tạo khóa riêng tư mới).
6. Một file JSON sẽ được tải về máy tính của bạn.
7. Đổi tên file đó thành **`serviceAccountKey.json`** và copy vào thư mục `server/`:
   ```text
   server/serviceAccountKey.json
   ```

---

## 💻 Bước 2: Cài Đặt & Chạy Server (Kèm Cloudflare Tunnel cho Wokwi)

Mở terminal tại thư mục `server`:

```bash
cd server
npm start
```

Khi chạy `npm start`, server sẽ **tự động khởi động Cloudflare Tunnel (qua `untun`)** và in ra đường link HTTPS công khai:
```text
✅ [Firebase] Khởi tạo thành công từ file: .../server/serviceAccountKey.json
🚀 [Server] Node.js Push Notification Server đang chạy tại: http://localhost:3000

======================================================================
🌐 [Cloudflare Tunnel] URL CÔNG KHAI ĐÃ SẴN SÀNG CHO WOKWI:
👉 Base URL:    https://random-subdomain.trycloudflare.com
👉 API Cảnh Báo: https://random-subdomain.trycloudflare.com/api/notify/alert
======================================================================
```

👉 **Cách dùng trên Wokwi**: Copy đường link `https://random-subdomain.trycloudflare.com` và dán vào biến `server_tunnel_url` trong `arduino/ArduinoCode.ino`:
```cpp
const char* server_tunnel_url = "https://random-subdomain.trycloudflare.com";
```
Khi Wokwi phát hiện nhiệt độ quá ngưỡng hoặc cửa mở quá 3 phút, nó sẽ gửi `HTTP POST` qua link Cloudflare này đến Server để bắn Push Notification tới ứng dụng điện thoại!

*(Nếu bạn chỉ muốn mở riêng tunnel mà không chạy server: gõ lệnh `npm run tunnel`)*.

---

## 📡 Danh Sách Các API Endpoints

### 1. `POST /api/notify/token` (Gửi tới 1 thiết bị cụ thể)
Gửi thông báo tới thiết bị qua Device FCM Token:

- **URL**: `http://localhost:3000/api/notify/token`
- **Method**: `POST`
- **Body (JSON)**:
```json
{
  "token": "dGVzdF9mY21fdG9rZW5faGVyZQ...",
  "title": "Cảnh báo kho lạnh",
  "body": "Nhiệt độ hiện tại -12.5°C vượt quá ngưỡng an toàn!",
  "data": {
    "screen": "temperature",
    "temperature": "-12.5"
  }
}
```

---

### 2. `POST /api/notify/topic` (Gửi tới toàn bộ máy qua Topic)
Phù hợp nhất cho IoT: Bất kỳ điện thoại nhân viên/quản lý nào đăng ký topic `kholanh_alerts` đều sẽ nhận được thông báo ngay lập tức mà server không cần lưu từng token riêng lẻ.

- **URL**: `http://localhost:3000/api/notify/topic`
- **Method**: `POST`
- **Body (JSON)**:
```json
{
  "topic": "kholanh_alerts",
  "title": "Cửa kho lạnh đang mở",
  "body": "Cửa kho đã mở quá 3 phút, vui lòng kiểm tra!",
  "data": {
    "screen": "door",
    "exposureSec": "180"
  }
}
```

---

### 3. `POST /api/notify/alert` (Chuyên dụng cho sự kiện Kho Lạnh từ ESP32)
API tự động format nội dung cảnh báo, âm thanh chuông lớn và mức độ ưu tiên cao (`priority: max`):

- **URL**: `http://localhost:3000/api/notify/alert`
- **Method**: `POST`
- **Body 1: Cảnh báo quá nhiệt**:
```json
{
  "type": "temp_critical",
  "temperature": -11.8,
  "topic": "kholanh_alerts"
}
```
- **Body 2: Cảnh báo mở cửa quá lâu**:
```json
{
  "type": "door_timeout",
  "doorDurationSec": 210,
  "topic": "kholanh_alerts"
}
```

---

### 4. `POST /api/topic/subscribe` (Đăng ký token vào Topic)
- **URL**: `http://localhost:3000/api/topic/subscribe`
- **Method**: `POST`
- **Body (JSON)**:
```json
{
  "tokens": ["fcm_device_token_1", "fcm_device_token_2"],
  "topic": "kholanh_alerts"
}
```

---

## 🧪 Kiểm Thử Nhanh (Test Script)

Khi server đang chạy ở cổng 3000, bạn mở một cửa sổ terminal khác và chạy:
```bash
node test-send.js
```
Hoặc dùng lệnh cURL:
```bash
curl -X POST http://localhost:3000/api/notify/alert \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"temp_critical\",\"temperature\":-12.0}"
```

---

## 📱 Tích Hợp Trên Ứng Dụng React Native / Expo

Để điện thoại nhận được thông báo từ FCM:

1. **Cài đặt thư viện trong App Expo**:
   ```bash
   npx expo install expo-notifications expo-device
   ```

2. **Đoạn mã lấy Token và đăng ký vào Server Node.js**:
   ```typescript
   import * as Notifications from 'expo-notifications';
   import * as Device from 'expo-device';

   async function registerForPushNotificationsAsync() {
     if (!Device.isDevice) {
       console.log('Push notification chỉ chạy trên thiết bị thật.');
       return;
     }

     const { status: existingStatus } = await Notifications.getPermissionsAsync();
     let finalStatus = existingStatus;
     if (existingStatus !== 'granted') {
       const { status } = await Notifications.requestPermissionsAsync();
       finalStatus = status;
     }

     if (finalStatus !== 'granted') {
       alert('Không có quyền nhận thông báo đẩy!');
       return;
     }

     // Lấy Device Token (hoặc FCM token)
     const tokenData = await Notifications.getDevicePushTokenAsync();
     console.log('FCM Token của máy:', tokenData.data);

     // Gửi token lên server Node.js để đăng ký vào topic 'kholanh_alerts'
     await fetch('http://<IP_MAY_TINH>:3000/api/topic/subscribe', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         tokens: [tokenData.data],
         topic: 'kholanh_alerts',
       }),
     });
   }
   ```
