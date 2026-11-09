# Kho lạnh thông minh - ESP32/Wokwi

Ứng dụng web nhận dữ liệu thời gian thực từ ESP32 qua MQTT. Sketch hiện publish cả telemetry và cảnh báo cửa lên topic `test`; web phân biệt hai loại bản tin theo các trường JSON.

## Chạy web

1. Tạo file `.env` từ `.env.example`.
2. Điền thông tin tài khoản MQTT của broker vào các biến:

   ```env
   EXPO_PUBLIC_MQTT_URL=wss://rbd0db1d.ala.asia-southeast1.emqxsl.com:8084/mqtt
   EXPO_PUBLIC_MQTT_USERNAME=<MQTT_USERNAME>
   EXPO_PUBLIC_MQTT_PASSWORD=<MQTT_PASSWORD>
   ```

   ESP32 kết nối MQTT/TLS qua cổng `8883`; trình duyệt kết nối MQTT qua WebSocket bảo mật (WSS), thường là cổng `8084` với path `/mqtt`. Hãy dùng đúng WebSocket URL hiển thị trong dashboard của broker.
3. Chạy `npm run web` và mở URL Expo hiển thị trong terminal. Nếu thay đổi `.env`, khởi động lại Expo.

Web chỉ hiển thị dữ liệu thực sau khi nhận telemetry; dữ liệu mẫu và nút mô phỏng vẫn được giữ cho app native.

## Chạy mô phỏng Wokwi

- Dùng `Wokwi-GUEST` làm Wi-Fi và cấu hình ESP32 kết nối broker bằng host, cổng TLS `8883`, username/password MQTT.
- Đảm bảo sketch publish JSON telemetry (`temperature`, `humidity`, `door_open`, `exposure_sec`) và cảnh báo (`alert`, `duration_ms`) lên cùng topic `test`.
- Chạy mô phỏng Wokwi trước hoặc cùng lúc với web để dashboard nhận các bản tin mới.

## Bảo mật thông tin MQTT

Các biến `EXPO_PUBLIC_*` được đóng gói vào ứng dụng web và người dùng có thể xem trong trình duyệt. Không dùng tài khoản quản trị; hãy tạo riêng tài khoản chỉ có quyền subscribe topic `test`. Nếu cần giữ credential bí mật, kết nối qua backend thay vì trực tiếp từ trình duyệt. Không commit file `.env`.

Khi chạy Android/iOS, ứng dụng tiếp tục dùng dữ liệu mô phỏng cục bộ.
