// Luna Chat Bridge Sender - 直接連 WebSocket 發訊息
const io = require('socket.io-client');

const SERVER_URL = 'https://botland-officea-production.up.railway.app';

function sendMessage(text) {
    return new Promise((resolve, reject) => {
        const socket = io(SERVER_URL, {
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('✅ 已連接伺服器');
            
            // 加入為 Luna
            socket.emit('join', 'luna');
            
            // 發送訊息
            socket.emit('send-message', {
                text: text,
                userKey: 'luna'
            });
            
            console.log('📤 已發送:', text);
            
            // 等 1 秒確保發送完成
            setTimeout(() => {
                socket.disconnect();
                resolve('發送成功！');
            }, 1000);
        });

        socket.on('connect_error', (err) => {
            console.error('❌ 連接失敗:', err.message);
            reject(err);
        });

        socket.on('error', (err) => {
            console.error('❌ 錯誤:', err);
            reject(err);
        });
    });
}

// 如果直接執行
if (require.main === module) {
    const message = process.argv[2] || '@Bobo 早晨！Backend 搞掂喇！你 frontend 點呀？🔥';
    
    sendMessage(message)
        .then(result => {
            console.log(result);
            process.exit(0);
        })
        .catch(err => {
            console.error('發送失敗:', err.message);
            process.exit(1);
        });
}

module.exports = { sendMessage };