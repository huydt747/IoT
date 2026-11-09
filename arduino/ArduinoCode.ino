#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <DHT.h>

// ===== CẤU HÌNH CHÂN =====
#define DHTPIN      15
#define DHTTYPE     DHT22
#define BUTTON_PIN  14      // Nút mô phỏng cửa
#define LED_PIN     2       // LED cảnh báo
#define BUZZER_PIN  4       // Buzzer cảnh báo

DHT dht(DHTPIN, DHTTYPE);

// ===== CẤU HÌNH WIFI & MQTT =====
const char* ssid        = "Wokwi-GUEST";
const char* password    = "";
const char* mqtt_server = "o3e70108.ala.eu-central-1.emqxsl.com";  // EMQX Serverless của bạn
const int   mqtt_port   = 8883;
const char* mqtt_user   = "1";   // Điền từ EMQX Dashboard
const char* mqtt_pass   = "12345";   // Điền từ EMQX Dashboard

// ===== TOPIC =====
const char* topic_data    = "kholanh/esp32/nhietdo";
const char* topic_alert   = "kholanh/esp32/canhbao/cua";

WiFiClientSecure espClient;
PubSubClient client(espClient);

// ===== BIẾN LOGIC =====
unsigned long doorOpenStart = 0;       // Thời điểm bắt đầu mở cửa
bool doorOpen = false;
bool alertSent = false;                 // Tránh gửi cảnh báo liên tục
const unsigned long DOOR_THRESHOLD_MS = 180000;  // 3 phút = 180000ms (demo có thể giảm còn 30000)
const float TEMP_THRESHOLD = -15.0;     // Ngưỡng nhiệt độ an toàn cho kho đông

void setup_wifi() {
  Serial.print("Connecting WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" OK");
  Serial.print("IP: "); Serial.println(WiFi.localIP());
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
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

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
    }
  }

  // ===== CẢNH BÁO TẠI CHỖ (LED + BUZZER) =====
  bool tempCritical = (temp > TEMP_THRESHOLD);
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