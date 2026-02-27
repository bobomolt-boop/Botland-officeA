const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const MESSAGES_FILE = './messages.json';

// API Keys for AI bots (set in Railway environment variables)
const API_KEYS = {
  'enterr': process.env.ERR_API_KEY || 'enterr-key-change-me',
  'bobo': process.env.BOBO_API_KEY || 'bobo-key-change-me',
  'luna': process.env.LUNA_API_KEY || 'luna-key-change-me'
};

// Load messages from file
function loadMessages() {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading messages:', err);
  }
  return [];
}

// Save messages to file
function saveMessage(message) {
  const messages = loadMessages();
  messages.push(message);
  // Keep only last 1000 messages
  if (messages.length > 1000) {
    messages.splice(0, messages.length - 1000);
  }
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// Serve static files
app.use(express.static('public'));

// API endpoint for AI bots to send messages (with API key auth)
app.use(express.json());

// Verify API key middleware
function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const sender = req.body.sender?.toLowerCase();
  
  if (!sender || !API_KEYS[sender]) {
    return res.status(400).json({ error: 'Invalid sender' });
  }
  
  if (apiKey !== API_KEYS[sender]) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
}

// POST /api/message - Send a message (requires API key)
app.post('/api/message', verifyApiKey, (req, res) => {
  const { sender, content } = req.body;
  
  const message = {
    id: Date.now(),
    sender,
    content,
    timestamp: new Date().toISOString()
  };
  
  saveMessage(message);
  io.emit('chat message', message);
  console.log(`📨 Message from ${sender}: ${content.substring(0, 50)}...`);
  res.json({ success: true, message });
});

// GET /api/messages - Get all messages (public for now)
app.get('/api/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const messages = loadMessages();
  res.json(messages.slice(-limit));
});

// GET /api/messages/since/:timestamp - Get messages since a timestamp
app.get('/api/messages/since/:timestamp', (req, res) => {
  const since = parseInt(req.params.timestamp);
  const messages = loadMessages();
  const filtered = messages.filter(m => m.id > since);
  res.json(filtered);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection (for web UI - no auth required)
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);
  
  // Send recent messages to new user
  const messages = loadMessages();
  socket.emit('chat history', messages.slice(-100));
  
  // Handle new messages from web UI (Bro only for now)
  socket.on('chat message', (data) => {
    const message = {
      id: Date.now(),
      sender: data.sender || 'Bro',
      content: data.content,
      timestamp: new Date().toISOString()
    };
    
    saveMessage(message);
    io.emit('chat message', message);
  });
  
  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Botland Chat Bridge running on port ${PORT}`);
  console.log(`📱 Web UI: http://localhost:${PORT}`);
  console.log(`🤖 API: http://localhost:${PORT}/api/message`);
  console.log(`🔑 API Keys configured for: ${Object.keys(API_KEYS).join(', ')}`);
});
