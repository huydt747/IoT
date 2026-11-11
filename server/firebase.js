const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let isFirebaseInitialized = false;

function initFirebase() {
  if (admin.apps.length > 0) {
    return admin;
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, 'serviceAccountKey.json');
  const resolvedPath = path.isAbsolute(keyPath) ? keyPath : path.join(__dirname, keyPath);

  try {
    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      isFirebaseInitialized = true;
      console.log('✅ [Firebase] Khởi tạo thành công từ file:', resolvedPath);
      return admin;
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      isFirebaseInitialized = true;
      console.log('✅ [Firebase] Khởi tạo thành công từ biến môi trường FIREBASE_SERVICE_ACCOUNT');
      return admin;
    }

    console.warn('\n⚠️ [Firebase Warning] Chưa tìm thấy file "serviceAccountKey.json"!');
    console.warn('👉 Hãy tải file Private Key từ: Firebase Console -> Project Settings -> Service accounts -> Generate new private key');
    console.warn(`👉 Và lưu file vào: ${resolvedPath}\n`);
    console.warn('⚡ Server vẫn chạy để bạn test endpoint, nhưng API FCM sẽ trả về thông báo yêu cầu cung cấp key.\n');
  } catch (error) {
    console.error('❌ [Firebase Error] Lỗi khi khởi tạo Firebase Admin SDK:', error.message);
  }

  return admin;
}

initFirebase();

module.exports = {
  admin,
  messaging: admin.messaging,
  isFirebaseInitialized: () => isFirebaseInitialized,
};
