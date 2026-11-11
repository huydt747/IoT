const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { getMessaging, isFirebaseInitialized } = require('./firebase');
const { launchTunnel, closeTunnel } = require('./tunnel');

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_TOPIC = process.env.DEFAULT_NOTIFICATION_TOPIC || 'kholanh_alerts';
let currentTunnelUrl = null;
let lastRegisteredTokens = [];

app.use(cors());
app.use(express.json());

// ===== 1. HEALTH CHECK & INFO =====
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Cold Storage IoT Push Notification Server (Firebase FCM)',
    firebaseReady: isFirebaseInitialized(),
    tunnelUrl: currentTunnelUrl,
    latestToken: lastRegisteredTokens[0] || null,
    endpoints: {
      sendToToken: 'POST /api/notify/token',
      sendToTopic: 'POST /api/notify/topic',
      sendMulticast: 'POST /api/notify/multicast',
      sendColdStorageAlert: 'POST /api/notify/alert',
      subscribeTopic: 'POST /api/topic/subscribe',
      unsubscribeTopic: 'POST /api/topic/unsubscribe',
      getTokens: 'GET /api/tokens',
    },
  });
});

app.get('/api/tokens', (req, res) => {
  res.json({
    count: lastRegisteredTokens.length,
    tokens: lastRegisteredTokens,
    latestToken: lastRegisteredTokens[0] || null,
  });
});

// Middleware kiểm tra Firebase đã khởi tạo chưa
function requireFirebase(req, res, next) {
  if (!isFirebaseInitialized()) {
    return res.status(503).json({
      success: false,
      message: 'Firebase Admin SDK chưa được cấu hình! Hãy thêm file "serviceAccountKey.json" vào thư mục server.',
    });
  }
  next();
}

// ===== 2. POST /api/notify/token: GỬI TỚI 1 TOKEN THIẾT BỊ =====
app.post('/api/notify/token', requireFirebase, async (req, res) => {
  try {
    const { token, title, body, data = {} } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu trường bắt buộc: token, title, body.',
      });
    }

    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'cold_storage_alerts',
          priority: 'max',
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await getMessaging().send(message);
    console.log('📨 [FCM] Đã gửi thông báo tới token thành công:', response);

    return res.json({
      success: true,
      messageId: response,
      sentTo: token,
    });
  } catch (error) {
    console.error('❌ [FCM Error] Lỗi gửi thông báo tới token:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      errorCode: error.code,
    });
  }
});

// ===== 3. POST /api/notify/topic: GỬI TỚI TOÀN BỘ APP ĐĂNG KÝ TOPIC =====
app.post('/api/notify/topic', requireFirebase, async (req, res) => {
  try {
    const { topic = DEFAULT_TOPIC, title, body, data = {} } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu trường bắt buộc: title, body.',
      });
    }

    const message = {
      topic,
      notification: {
        title,
        body,
      },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'cold_storage_alerts',
          priority: 'max',
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await getMessaging().send(message);
    console.log(`📨 [FCM] Đã gửi thông báo tới topic "${topic}":`, response);

    return res.json({
      success: true,
      messageId: response,
      topic,
    });
  } catch (error) {
    console.error('❌ [FCM Error] Lỗi gửi thông báo tới topic:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      errorCode: error.code,
    });
  }
});

// ===== 4. POST /api/notify/multicast: GỬI TỚI DANH SÁCH NHIỀU TOKENS =====
app.post('/api/notify/multicast', requireFirebase, async (req, res) => {
  try {
    const { tokens = [], title, body, data = {} } = req.body;

    if (!Array.isArray(tokens) || tokens.length === 0 || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'tokens phải là một mảng không rỗng, kèm theo title và body.',
      });
    }

    const message = {
      tokens,
      notification: {
        title,
        body,
      },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'cold_storage_alerts',
        },
      },
    };

    const response = await getMessaging().sendEachForMulticast(message);
    console.log(`📨 [FCM] Gửi multicast: ${response.successCount} thành công, ${response.failureCount} thất bại.`);

    return res.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    });
  } catch (error) {
    console.error('❌ [FCM Error] Lỗi gửi multicast:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ===== 5. POST /api/notify/alert: CHUYÊN DỤNG CHO CẢNH BÁO KHO LẠNH (ESP32) =====
app.post('/api/notify/alert', requireFirebase, async (req, res) => {
  try {
    const {
      type = 'temp_critical', // 'temp_critical' hoặc 'door_timeout'
      temperature,
      doorDurationSec,
      topic = DEFAULT_TOPIC,
    } = req.body;

    let title = '';
    let body = '';
    const dataPayload = {
      type,
      timestamp: new Date().toISOString(),
    };

    if (type === 'door_timeout') {
      const minutes = Math.floor((doorDurationSec || 180) / 60);
      title = '🚨 CẢNH BÁO: Cửa Kho Lạnh Mở Quá Lâu!';
      body = `Cửa kho lạnh đã mở quá ${minutes} phút. Nhiệt độ có nguy cơ tăng nhanh, hãy kiểm tra ngay!`;
      dataPayload.durationSec = String(doorDurationSec || 180);
      dataPayload.screen = 'door';
    } else {
      title = '⚠️ CẢNH BÁO: Nhiệt Độ Kho Lạnh Vượt Ngưỡng!';
      body = `Nhiệt độ hiện tại ${temperature !== undefined ? temperature : ''}°C vượt quá ngưỡng an toàn (-15.0°C)!`;
      dataPayload.temperature = String(temperature || -12.0);
      dataPayload.screen = 'temperature';
    }

    const message = {
      topic,
      notification: {
        title,
        body,
      },
      data: dataPayload,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'cold_storage_alerts',
          priority: 'max',
          color: '#d63031',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await getMessaging().send(message);
    console.log(`🚨 [Alert FCM] Đã phát cảnh báo kho lạnh tới topic "${topic}":`, response);

    return res.json({
      success: true,
      messageId: response,
      alertType: type,
      title,
      body,
    });
  } catch (error) {
    console.error('❌ [FCM Error] Lỗi gửi cảnh báo kho lạnh:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ===== 6. POST /api/topic/subscribe: ĐĂNG KÝ DEVICE TOKEN VÀO TOPIC =====
app.post('/api/topic/subscribe', requireFirebase, async (req, res) => {
  try {
    const { tokens = [], topic = DEFAULT_TOPIC } = req.body;
    const tokenList = Array.isArray(tokens) ? tokens : [tokens];

    if (tokenList.length === 0) {
      return res.status(400).json({ success: false, message: 'Thiếu tokens để đăng ký.' });
    }

    lastRegisteredTokens = tokenList;
    const response = await getMessaging().subscribeToTopic(tokenList, topic);
    console.log(`📌 [Topic] Đã đăng ký ${response.successCount} token vào topic "${topic}"`);
    console.log('\n🔑 [FCM REGISTRATION TOKEN CHO FIREBASE CONSOLE]:');
    console.log(tokenList[0]);
    console.log('👉 Copy mã token ở trên và dán vào mục "Test on device" trên Firebase Console!\n');

    return res.json({
      success: true,
      topic,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ===== 7. POST /api/topic/unsubscribe: HỦY ĐĂNG KÝ TOKEN KHỎI TOPIC =====
app.post('/api/topic/unsubscribe', requireFirebase, async (req, res) => {
  try {
    const { tokens = [], topic = DEFAULT_TOPIC } = req.body;
    const tokenList = Array.isArray(tokens) ? tokens : [tokens];

    if (tokenList.length === 0) {
      return res.status(400).json({ success: false, message: 'Thiếu tokens để hủy đăng ký.' });
    }

    const response = await getMessaging().unsubscribeFromTopic(tokenList, topic);
    return res.json({
      success: true,
      topic,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Khởi động Server
const server = app.listen(PORT, async () => {
  console.log(`🚀 [Server] Node.js Push Notification Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📌 [Server] Mở http://localhost:${PORT} trên trình duyệt để kiểm tra trạng thái.`);

  // Tự động kết nối Cloudflare Tunnel qua untun nếu không bị tắt bởi biến môi trường
  if (process.env.AUTO_TUNNEL !== 'false') {
    currentTunnelUrl = await launchTunnel(PORT);
  }
});

// Xử lý tắt server và đóng tunnel an toàn
process.on('SIGINT', async () => {
  console.log('\n🛑 Đang dừng server...');
  await closeTunnel();
  server.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  await closeTunnel();
  server.close(() => process.exit(0));
});
