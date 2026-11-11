/**
 * Script kiểm thử nhanh gửi thông báo đến server
 * Chạy bằng: node test-send.js
 */
const SERVER_URL = 'http://localhost:3000';

async function testAlert() {
  console.log('--- 1. Kiểm tra trạng thái Server ---');
  try {
    const health = await fetch(SERVER_URL).then((r) => r.json());
    console.log('Health check:', health);

    console.log('\n--- 2. Thử gửi cảnh báo nhiệt độ kho lạnh qua Topic ---');
    const alertRes = await fetch(`${SERVER_URL}/api/notify/alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'temp_critical',
        temperature: -11.5,
        topic: 'kholanh_alerts',
      }),
    });
    const alertData = await alertRes.json();
    console.log('Kết quả gửi cảnh báo:', alertData);

    console.log('\n--- 3. Thử gửi cảnh báo cửa mở quá lâu ---');
    const doorRes = await fetch(`${SERVER_URL}/api/notify/alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'door_timeout',
        doorDurationSec: 210,
        topic: 'kholanh_alerts',
      }),
    });
    const doorData = await doorRes.json();
    console.log('Kết quả gửi cảnh báo cửa:', doorData);
  } catch (err) {
    console.error('Lỗi khi gọi API:', err.message);
  }
}

testAlert();
