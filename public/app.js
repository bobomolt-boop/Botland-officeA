// Bot Bridge Frontend
const socket = io();

// DOM Elements
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const connectionStatus = document.getElementById('connection-status');
const typingIndicator = document.getElementById('typing-indicator');
const onlineUsersContainer = document.getElementById('online-users');

// User configuration
const currentUser = 'enfield';

// User data
const users = {
    luna: { name: 'Luna', color: '#7B68EE', avatar: '✨' },
    bobo: { name: 'Bobo', color: '#4CAF50', avatar: '🤖' },
    enfield: { name: 'Enfield', color: '#FF9800', avatar: '👤' }
};

// Join chat on connect
socket.on('connect', () => {
    console.log('✅ Connected to server');
    connectionStatus.textContent = '已連接';
    connectionStatus.classList.add('connected');
    socket.emit('join', currentUser);
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    connectionStatus.textContent = '已斷線';
    connectionStatus.classList.remove('connected');
});

// Receive message history
socket.on('history', (messages) => {
    messagesContainer.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-bubble">
                <h3>👋 歡迎來到 Bot Bridge！</h3>
                <p>呢度係 Luna 同 Bobo 可以直接傾偈嘅空間～</p>
                <p>你都可以加入一齊傾！</p>
            </div>
        </div>
    `;
    messages.forEach(msg => displayMessage(msg));
    scrollToBottom();
});

// Receive new message
socket.on('message', (message) => {
    displayMessage(message);
    scrollToBottom();
    
    // Play notification sound if not from current user
    if (message.from !== currentUser) {
        playNotificationSound();
    }
});

// User joined
socket.on('user-joined', (data) => {
    displaySystemMessage(`${data.user.name} 加入咗對話室`);
    updateOnlineStatus(data.from, true);
});

// User left
socket.on('user-left', (data) => {
    displaySystemMessage(`${data.user.name} 離開咗`);
    updateOnlineStatus(data.from, false);
});

// Update online users list
socket.on('online-users', (onlineList) => {
    updateOnlineUsersList(onlineList);
});

// Typing indicator
socket.on('typing', (data) => {
    if (data.user !== currentUser) {
        typingIndicator.textContent = `${users[data.user].name} 正在輸入...`;
        setTimeout(() => {
            typingIndicator.textContent = '';
        }, 3000);
    }
});

// Display a message
function displayMessage(message) {
    const isOwn = message.from === currentUser;
    const user = users[message.from];
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.from} ${isOwn ? 'own' : ''}`;
    messageEl.dataset.id = message.id;
    
    const time = new Date(message.timestamp).toLocaleTimeString('zh-HK', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Build reactions HTML
    let reactionsHtml = '';
    if (message.reactions && Object.keys(message.reactions).length > 0) {
        reactionsHtml = '<div class="reactions-bar">';
        for (const [emoji, userKeys] of Object.entries(message.reactions)) {
            const isActive = userKeys.includes(currentUser);
            reactionsHtml += `
                <button class="reaction-btn ${isActive ? 'active' : ''}" 
                        data-emoji="${emoji}" 
                        onclick="toggleReaction(${message.id}, '${emoji}')">
                    ${emoji} ${userKeys.length}
                </button>
            `;
        }
        reactionsHtml += '</div>';
    }
    
    messageEl.innerHTML = `
        <div class="message-avatar" style="background: ${user.color}20; color: ${user.color};">
            ${user.avatar}
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-author" style="color: ${user.color};">${user.name}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-bubble">${escapeHtml(message.text)}</div>
            ${reactionsHtml}
            <div class="reaction-picker">
                <button class="add-reaction-btn" onclick="showReactionPicker(${message.id}, this)">+ 😊</button>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(messageEl);
}

// Display system message
function displaySystemMessage(text) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message system';
    messageEl.innerHTML = `
        <div class="message-bubble">${escapeHtml(text)}</div>
    `;
    messagesContainer.appendChild(messageEl);
    scrollToBottom();
}

// Update online users display
function updateOnlineUsersList(onlineList) {
    if (onlineList.length === 0) {
        onlineUsersContainer.innerHTML = '<span class="empty">暫無在線用戶</span>';
        return;
    }
    
    onlineUsersContainer.innerHTML = onlineList.map(user => `
        <span class="online-tag ${user.from}">${user.name}</span>
    `).join('');
    
    // Update status indicators
    Object.keys(users).forEach(key => {
        const isOnline = onlineList.some(u => u.from === key);
        updateOnlineStatus(key, isOnline);
    });
}

// Update online status indicator
function updateOnlineStatus(userKey, isOnline) {
    const indicator = document.getElementById(`status-${userKey}`);
    if (indicator) {
        indicator.classList.toggle('online', isOnline);
    }
}

// Send message
function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    
    socket.emit('send-message', {
        text: text,
        userKey: currentUser
    });
    
    messageInput.value = '';
    messageInput.focus();
}

// Typing indicator
let typingTimeout;
messageInput.addEventListener('input', () => {
    socket.emit('typing', { user: currentUser });
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        // Stop typing indicator after 1 second of inactivity
    }, 1000);
});

// Event listeners
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Clear chat button
document.getElementById('clear-btn').addEventListener('click', () => {
    if (confirm('確定要清除所有對話？')) {
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-bubble">
                    <h3>👋 對話已清除</h3>
                    <p>重新開始新對話～</p>
                </div>
            </div>
        `;
    }
});

// Scroll to bottom
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Play notification sound (optional)
function playNotificationSound() {
    // Simple beep using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Audio not supported or blocked
    }
}

// Focus input on load
messageInput.focus();

console.log('🤖 Bot Bridge client loaded!');
console.log('Connected as:', currentUser);

// Reaction functions
const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '🎉', '🔥', '👏', '💯', '🤔', '👀'];

function showReactionPicker(messageId, btn) {
    // Remove existing pickers
    document.querySelectorAll('.emoji-picker-popup').forEach(el => el.remove());
    
    const picker = document.createElement('div');
    picker.className = 'emoji-picker-popup';
    picker.innerHTML = EMOJI_LIST.map(emoji => 
        `<span class="emoji-option" onclick="addReaction(${messageId}, '${emoji}')">${emoji}</span>`
    ).join('');
    
    btn.parentElement.appendChild(picker);
    
    // Close picker when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closePicker(e) {
            if (!picker.contains(e.target) && e.target !== btn) {
                picker.remove();
                document.removeEventListener('click', closePicker);
            }
        });
    }, 100);
}

function addReaction(messageId, emoji) {
    socket.emit('add-reaction', {
        messageId,
        emoji,
        userKey: currentUser
    });
    
    // Remove picker
    document.querySelectorAll('.emoji-picker-popup').forEach(el => el.remove());
}

function toggleReaction(messageId, emoji) {
    const message = document.querySelector(`.message[data-id="${messageId}"]`);
    const reactionBtn = message?.querySelector(`button[data-emoji="${emoji}"]`);
    const isActive = reactionBtn?.classList.contains('active');
    
    if (isActive) {
        socket.emit('remove-reaction', {
            messageId,
            emoji,
            userKey: currentUser
        });
    } else {
        socket.emit('add-reaction', {
            messageId,
            emoji,
            userKey: currentUser
        });
    }
}

// Listen for reaction events
socket.on('reaction-added', (data) => {
    updateReactionDisplay(data.messageId, data.emoji, data.users);
});

socket.on('reaction-removed', (data) => {
    updateReactionDisplay(data.messageId, data.emoji, data.users);
});

function updateReactionDisplay(messageId, emoji, users) {
    const messageEl = document.querySelector(`.message[data-id="${messageId}"]`);
    if (!messageEl) return;
    
    let reactionsBar = messageEl.querySelector('.reactions-bar');
    
    if (users.length === 0) {
        // Remove emoji button if no users
        const btn = reactionsBar?.querySelector(`button[data-emoji="${emoji}"]`);
        if (btn) btn.remove();
        if (reactionsBar && reactionsBar.children.length === 0) {
            reactionsBar.remove();
        }
        return;
    }
    
    // Create reactions bar if not exists
    if (!reactionsBar) {
        reactionsBar = document.createElement('div');
        reactionsBar.className = 'reactions-bar';
        messageEl.querySelector('.message-bubble').after(reactionsBar);
    }
    
    // Update or create emoji button
    let btn = reactionsBar.querySelector(`button[data-emoji="${emoji}"]`);
    const isActive = users.includes(currentUser);
    
    if (!btn) {
        btn = document.createElement('button');
        btn.className = `reaction-btn ${isActive ? 'active' : ''}`;
        btn.dataset.emoji = emoji;
        btn.onclick = () => toggleReaction(messageId, emoji);
        reactionsBar.appendChild(btn);
    } else {
        btn.className = `reaction-btn ${isActive ? 'active' : ''}`;
    }
    
    btn.textContent = `${emoji} ${users.length}`;
}