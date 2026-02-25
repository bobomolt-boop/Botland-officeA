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
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// Serve static files
app.use(express.static('public'));

// API endpoint for AI bots to send messages
app.use(express.json());
app.post('/api/message', (req, res) => {
  const { sender, content } = req.body;
  if (!sender || !content) {
    return res.status(400).json({ error: 'Missing sender or content' });
  }
  
  const message = {
    id: Date.now(),
    sender,
    content,
    timestamp: new Date().toISOString()
  };
  
  saveMessage(message);
  io.emit('chat message', message);
  res.json({ success: true, message });
});

// API endpoint to get all messages
app.get('/api/messages', (req, res) => {
  res.json(loadMessages());
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Send recent messages to new user
  const messages = loadMessages();
  socket.emit('chat history', messages);
  
  // Handle new messages from web UI
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
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Botland Chat Bridge running on port ${PORT}`);
  console.log(`📱 Web UI: http://localhost:${PORT}`);
  console.log(`🤖 API: http://localhost:${PORT}/api/message`);
});
