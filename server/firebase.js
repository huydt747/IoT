const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let isFirebaseInitialized = false;

function initFirebase() {
  if (getApps().length > 0) {
    isFirebaseInitialized = true;
    return;
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, 'serviceAccountKey.json');
  const resolvedPath = path.isAbsolute(keyPath) ? keyPath : path.join(__dirname, keyPath);

  try {
    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
      initializeApp({
        credential: cert(serviceAccount),
      });
      isFirebaseInitialized = true;
      console.log('✅ [Firebase] Khởi tạo thành công từ file:', resolvedPath);
      return;
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount),
      });
      isFirebaseInitialized = true;
      console.log('✅ [Firebase] Khởi tạo thành công từ biến môi trường FIREBASE_SERVICE_ACCOUNT');
      return;
    }

    console.warn('\n⚠️ [Firebase Warning] Chưa tìm thấy file "serviceAccountKey.json"!');
    console.warn('👉 Hãy tải file Private Key từ: Firebase Console -> Project Settings -> Service accounts -> Generate new private key');
    console.warn(`👉 Và lưu file vào: ${resolvedPath}\n`);
    console.warn('⚡ Server vẫn chạy để bạn test endpoint, nhưng API FCM sẽ trả về thông báo yêu cầu cung cấp key.\n');
  } catch (error) {
    console.error('❌ [Firebase Error] Lỗi khi khởi tạo Firebase Admin SDK:', error.message);
  }
}

initFirebase();

module.exports = {
  getMessaging,
  isFirebaseInitialized: () => isFirebaseInitialized,
};
