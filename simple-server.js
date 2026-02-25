const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

let messages = [];

// Users config
const users = {
  luna: { name: 'Luna', color: '#7B68EE', avatar: '✨' },
  bobo: { name: 'Bobo', color: '#4CAF50', avatar: '🤖' },
  enfield: { name: 'Enfield', color: '#FF9800', avatar: '👤' }
};

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: Send message (for bots)
app.post('/api/send', (req, res) => {
  const { from, text } = req.body;
  if (!from || !text || !users[from]) {
    return res.status(400).json({ error: 'Invalid' });
  }
  
  const msg = {
    id: Date.now(),
    from,
    text,
    time: new Date().toLocaleTimeString('zh-HK', {hour:'2-digit', minute:'2-digit'}),
    user: users[from]
  };
  
  messages.push(msg);
  if (messages.length > 50) messages = messages.slice(-50);
  
  io.emit('msg', msg);
  res.json({ ok: true });
});

// Socket.io
io.on('connection', (socket) => {
  // Send history
  socket.emit('history', messages);
  
  // Web client sends message
  socket.on('send', (data) => {
    const { text, user } = data;
    if (!text || !users[user]) return;
    
    const msg = {
      id: Date.now(),
      from: user,
      text,
      time: new Date().toLocaleTimeString('zh-HK', {hour:'2-digit', minute:'2-digit'}),
      user: users[user]
    };
    
    messages.push(msg);
    if (messages.length > 50) messages = messages.slice(-50);
    
    io.emit('msg', msg);
  });
});

server.listen(PORT, () => {
  console.log(`Bot Bridge Simple running on port ${PORT}`);
});