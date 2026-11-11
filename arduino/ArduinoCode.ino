#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <HTTPClient.h>

// ===== CẤU HÌNH CHÂN =====
#define DHTPIN      15
#define DHTTYPE     DHT22
#define BUTTON_PIN  14      // Nút mô phỏng cửa
#define LED_PIN     2       // LED cảnh báo
#define BUZZER_PIN  4       // Buzzer cảnh báo
#define LDR_PIN 34
#define LIGHT_PIN 18

DHT dht(DHTPIN, DHTTYPE);

// ===== CẤU HÌNH WIFI & MQTT =====
const char* ssid        = "Wokwi-GUEST";
const char* password    = "";
const char* mqtt_server = "rbd0db1d.ala.asia-southeast1.emqxsl.com";  // EMQX Serverless của bạn
const int   mqtt_port   = 8883;
const char* mqtt_user   = "3sv";   // Điền từ EMQX Dashboard
const char* mqtt_pass   = "1234567890";   // Điền từ EMQX Dashboard

// ===== TOPIC =====
const char* topic_data    = "test";
const char* topic_alert   = "test";

WiFiClientSecure espClient;
PubSubClient client(espClient);

// ===== BIẾN LOGIC =====
unsigned long doorOpenStart = 0;       // Thời điểm bắt đầu mở cửa
bool doorOpen = false;
bool alertSent = false;                 // Tránh gửi cảnh báo liên tục
bool tempAlertSent = false;             // Tránh gửi cảnh báo nhiệt độ liên tục
const unsigned long DOOR_THRESHOLD_MS = 180000;  // 3 phút = 180000ms (demo có thể giảm còn 30000)
const float TEMP_THRESHOLD = -15.0;     // Ngưỡng nhiệt độ an toàn cho kho đông

// ===== CLOUDFLARE TUNNEL (NODE.JS FIREBASE PUSH SERVER) =====
// Dán link https://xxxx.trycloudflare.com (in ra khi chạy "npm start" ở server) vào đây:
const char* server_tunnel_url = "";

void sendPushNotification(String alertType, float temperature, unsigned long durationSec) {
  if (WiFi.status() != WL_CONNECTED) return;
  if (strlen(server_tunnel_url) == 0 || String(server_tunnel_url).indexOf("trycloudflare.com") == -1) {
    Serial.println("[Push] Chua cau hinh link server_tunnel_url, bo qua goi HTTP POST.");
    return;
  }

  WiFiClientSecure secureClient;
  secureClient.setInsecure(); // Wokwi bo qua xac thuc chung chi SSL

  HTTPClient http;
  String apiUrl = String(server_tunnel_url) + "/api/notify/alert";

  Serial.print("[Push] Dang goi API FCM qua Cloudflare Tunnel: ");
  Serial.println(apiUrl);

  if (http.begin(secureClient, apiUrl)) {
    http.addHeader("Content-Type", "application/json");
    String payload = "{\"type\":\"" + alertType + "\",\"temperature\":" + String(temperature, 1) + ",\"doorDurationSec\":" + String(durationSec) + "}";
    int httpResponseCode = http.POST(payload);
    Serial.print(">>> [Push FCM HTTP Status]: ");
    Serial.println(httpResponseCode);
    http.end();
  }
}

void setup_wifi() {
  Serial.println("Dang ket noi WiFi...");

  WiFi.mode(WIFI_STA);

  // Wokwi-GUEST su dung kenh 6
  WiFi.begin(ssid, password, 6);

  int count = 0;

  while (WiFi.status() != WL_CONNECTED && count < 30) {
    delay(500);
    Serial.print(".");
    count++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi ket noi thanh cong!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nKhong the ket noi WiFi!");
  }
}

void reconnect() {
  while (!client.connected()) {
    String clientId = "ESP32-KhoLanh-";
    clientId += String(esp_random(), HEX);
    Serial.print("MQTT connecting...");
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println(" OK");
    } else {
      Serial.print(" fail rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  noTone(BUZZER_PIN);

  dht.begin();
  setup_wifi();

  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);

  pinMode(LDR_PIN, INPUT);
  pinMode(LIGHT_PIN, OUTPUT);
  digitalWrite(LIGHT_PIN, LOW);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  // ===== ĐỌC CẢM BIẾN ÁNH SÁNG =====
  int lightValue = analogRead(LDR_PIN);

  Serial.print("Cuong do anh sang: ");
  Serial.println(lightValue);

  // ===== ĐIỀU KHIỂN ĐÈN KHO LẠNH =====
  if (doorOpen) {
    digitalWrite(LIGHT_PIN, HIGH);
    Serial.println("DEN KHO: BAT");
  } 
  else {
    digitalWrite(LIGHT_PIN, LOW);
    Serial.println("DEN KHO: TAT");
  }

  // ===== ĐỌC CẢM BIẾN =====
  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();
  if (isnan(temp) || isnan(hum)) {
    Serial.println("DHT read failed");
    delay(2000);
    return;
  }

  // ===== XỬ LÝ CỬA MỞ =====
  bool buttonPressed = (digitalRead(BUTTON_PIN) == LOW);  // Nhấn = cửa mở

  if (buttonPressed && !doorOpen) {
    // Cửa vừa mở
    doorOpen = true;
    doorOpenStart = millis();
    alertSent = false;
    Serial.println(">>> Cửa MỞ");
  } 
  else if (!buttonPressed && doorOpen) {
    // Cửa vừa đóng
    doorOpen = false;
    Serial.println(">>> Cửa ĐÓNG");
  }

  // ===== TÍNH THỜI GIAN PHƠI NHIỄM =====
  unsigned long exposureMs = 0;
  if (doorOpen) {
    exposureMs = millis() - doorOpenStart;

    // Gửi cảnh báo nếu cửa mở quá lâu VÀ chưa gửi
    if (exposureMs > DOOR_THRESHOLD_MS && !alertSent) {
      String alertPayload = "{\"alert\":\"cua_mo_qua_lau\",\"duration_ms\":" 
                            + String(exposureMs) + "}";
      client.publish(topic_alert, alertPayload.c_str());
      Serial.println("!!! CẢNH BÁO: Cửa mở quá lâu");
      alertSent = true;

      // Gửi Push Notification qua Cloudflare Tunnel tới App
      sendPushNotification("door_timeout", temp, exposureMs / 1000);
    }
  }

  // ===== CẢNH BÁO TẠI CHỖ (LED + BUZZER) & PUSH NOTIFICATION =====
  bool tempCritical = (temp > TEMP_THRESHOLD);
  if (tempCritical) {
    if (!tempAlertSent) {
      Serial.println("!!! CẢNH BÁO: Nhiệt độ vượt ngưỡng");
      sendPushNotification("temp_critical", temp, 0);
      tempAlertSent = true;
    }
  } else {
    tempAlertSent = false;
  }

  if (tempCritical || (doorOpen && exposureMs > DOOR_THRESHOLD_MS)) {
    digitalWrite(LED_PIN, HIGH);
    tone(BUZZER_PIN, 1000);   // Kêu liên tục
  } else {
    digitalWrite(LED_PIN, LOW);
    noTone(BUZZER_PIN);
  }

  // ===== PUBLISH DỮ LIỆU =====
  String payload = "{\"temperature\":" + String(temp, 2) 
                 + ",\"humidity\":" + String(hum, 1)
                 + ",\"door_open\":" + (doorOpen ? "true" : "false")
                 + ",\"exposure_sec\":" + String(exposureMs / 1000) + "}";

  client.publish(topic_data, payload.c_str());
  Serial.println("Sent: " + payload);

  delay(5000);
}