const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Store messages in memory
let messages = [];
let onlineUsers = new Set();

// User configurations
const users = {
  luna: { name: 'Luna', color: '#7B68EE', avatar: '✨', type: 'bot' },
  bobo: { name: 'Bobo', color: '#4CAF50', avatar: '🤖', type: 'bot' },
  enfield: { name: 'Enfield', color: '#FF9800', avatar: '👤', type: 'human' }
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: Get all messages
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

// API: Send message (for bots) - POST version
app.post('/api/send-message', (req, res) => {
  const { from, text } = req.body;
  
  if (!from || !text) {
    return res.status(400).json({ error: 'Missing from or text' });
  }
  
  const userKey = from.toLowerCase();
  if (!users[userKey]) {
    return res.status(400).json({ error: 'Invalid user' });
  }
  
  const message = {
    id: Date.now(),
    from: userKey,
    text: text,
    timestamp: new Date().toISOString(),
    user: users[userKey]
  };
  
  messages.push(message);
  
  // Keep only last 100 messages
  if (messages.length > 100) {
    messages = messages.slice(-100);
  }
  
  // Broadcast to all connected clients
  io.emit('message', message);
  
  res.json({ success: true, message });
});

// API: Send message - SIMPLE GET version for Bobo (query params)
app.get('/api/send', (req, res) => {
  const { from, text } = req.query;
  
  if (!from || !text) {
    return res.status(400).json({ error: 'Missing from or text query params' });
  }
  
  const userKey = from.toLowerCase();
  if (!users[userKey]) {
    return res.status(400).json({ error: 'Invalid user' });
  }
  
  const message = {
    id: Date.now(),
    from: userKey,
    text: decodeURIComponent(text),
    timestamp: new Date().toISOString(),
    user: users[userKey]
  };
  
  messages.push(message);
  
  if (messages.length > 100) {
    messages = messages.slice(-100);
  }
  
  io.emit('message', message);
  
  res.json({ success: true, message });
});

// API: Get online users
app.get('/api/online', (req, res) => {
  res.json({ online: Array.from(onlineUsers) });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Send message history to new client
  socket.emit('history', messages);
  
  // Handle user joining
  socket.on('join', (userKey) => {
    if (users[userKey]) {
      socket.userKey = userKey;
      onlineUsers.add(userKey);
      
      socket.broadcast.emit('user-joined', {
        user: users[userKey],
        timestamp: new Date().toISOString()
      });
      
      // Update online users for everyone
      io.emit('online-users', Array.from(onlineUsers).map(key => users[key]));
    }
  });
  
  // Handle message from web client
  socket.on('send-message', (data) => {
    const { text, userKey } = data;
    
    if (!text || !userKey || !users[userKey]) return;
    
    const message = {
      id: Date.now(),
      from: userKey,
      text: text,
      timestamp: new Date().toISOString(),
      user: users[userKey]
    };
    
    messages.push(message);
    
    // Keep only last 100 messages
    if (messages.length > 100) {
      messages = messages.slice(-100);
    }
    
    // Broadcast to all clients
    io.emit('message', message);
  });
  
  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.userKey) {
      onlineUsers.delete(socket.userKey);
      
      socket.broadcast.emit('user-left', {
        user: users[socket.userKey],
        timestamp: new Date().toISOString()
      });
      
      io.emit('online-users', Array.from(onlineUsers).map(key => users[key]));
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

server.listen(PORT, () => {
  console.log(`🚀 Bot Bridge server running on port ${PORT}`);
  console.log(`📱 Web interface: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket ready for connections`);
});