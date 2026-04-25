
/**
 * Script Đánh Thức Server (Keep-Alive)
 * Chạy lệnh: node keep_alive.js
 * Tác dụng: Gửi yêu cầu đến Server mỗi 30 giây để Render không cho Server đi ngủ.
 */

const axios = require('axios');

// Địa chỉ backend của bạn
const URL = 'https://iclerverconnextbackend.onrender.com/api/v1/auth/me';
const INTERVAL = 30000; // 30 giây chọc một lần

console.log('🚀 Đang bắt đầu chiến dịch ĐÁNH THỨC SERVER...');
console.log('🔗 Mục tiêu:', URL);

function ping() {
    axios.get(URL)
        .then(res => {
            console.log(`[${new Date().toLocaleTimeString()}] ✅ Server vẫn đang thức (Status: ${res.status})`);
        })
        .catch(err => {
            // Nếu báo lỗi 401 (Unauthorized) tức là server đã thức nhưng chưa login
            // Như vậy vẫn tính là server đang hoạt động.
            if (err.response && err.response.status === 401) {
                console.log(`[${new Date().toLocaleTimeString()}] 🔔 Server đã thức (nhưng chưa đăng nhập)`);
            } else {
                console.log(`[${new Date().toLocaleTimeString()}] ❌ Đang đánh thức server... (Lỗi: ${err.message})`);
            }
        });
}

// Chạy ngay lần đầu
ping();

// Cứ 30 giây chạy lại
setInterval(ping, INTERVAL);
