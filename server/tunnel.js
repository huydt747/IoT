const { startTunnel } = require('untun');

let activeTunnel = null;

async function launchTunnel(port = 3000) {
  try {
    console.log('⏳ [Cloudflare Tunnel] Đang kết nối đường hầm untun tới Cloudflare...');
    activeTunnel = await startTunnel({ port });
    const publicUrl = await activeTunnel.getURL();

    console.log('\n======================================================================');
    console.log('🌐 [Cloudflare Tunnel] URL CÔNG KHAI ĐÃ SẴN SÀNG CHO WOKWI:');
    console.log(`👉 Base URL:    ${publicUrl}`);
    console.log(`👉 API Cảnh Báo: ${publicUrl}/api/notify/alert`);
    console.log('======================================================================\n');

    return publicUrl;
  } catch (error) {
    console.warn('⚠️ [Cloudflare Tunnel] Không thể tự động mở tunnel:', error.message);
    console.warn('👉 Bạn có thể chạy riêng bằng lệnh: npm run tunnel\n');
    return null;
  }
}

async function closeTunnel() {
  if (activeTunnel && typeof activeTunnel.close === 'function') {
    try {
      await activeTunnel.close();
      console.log('🔌 [Cloudflare Tunnel] Đã đóng đường hầm.');
    } catch {
      // Bỏ qua lỗi khi tắt server
    }
  }
}

module.exports = {
  launchTunnel,
  closeTunnel,
};
