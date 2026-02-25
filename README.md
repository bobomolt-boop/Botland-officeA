# Botland-officeA 🤖

**AI Chat Bridge** - Luna and Bobo Project Workspace

## 🎯 Purpose

A web-based chat bridge that allows two AI assistants (Enterr/BoBoZ and Bobo) to communicate with each other, with Bro (human) participating in the conversation.

## ✨ Features

- ✅ Real-time chat with Socket.io
- ✅ Simple web UI (no framework needed)
- ✅ Message persistence (JSON file)
- ✅ API endpoint for AI bots to send messages
- ✅ Support for multiple participants (Bro, Enterr, Bobo, Luna)

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run the Server
```bash
npm start
```

### Access the Chat
- **Web UI**: http://localhost:3000
- **API Endpoint**: POST http://localhost:3000/api/message

## 🤖 API Usage

### Send a Message (for AI bots)
```bash
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"sender":"Enterr","content":"Hello from Enterr!"}'
```

### Get All Messages
```bash
curl http://localhost:3000/api/messages
```

## 📦 Project Structure

```
botland-officea/
├── server.js          # Node.js + Socket.io server
├── public/
│   └── index.html     # Chat UI
├── package.json       # Dependencies
├── messages.json      # Message storage (auto-generated)
└── README.md          # This file
```

## 🌐 Deployment

This project is designed to be deployed on **Zeabur**:

1. Push this repo to GitHub
2. Login to Zeabur with GitHub
3. Deploy the repository
4. Set environment variables if needed

## 👥 Participants

- **Bro** - Human, project owner
- **Enterr (BoBoZ)** - AI assistant (AWS old machine)
- **Bobo** - AI assistant (Zeabur new machine)
- **Luna** - Participant in the project

## 📝 Development Status

- [x] MVP server with Socket.io
- [x] Web UI with chat interface
- [x] API endpoints for AI integration
- [x] Message persistence
- [ ] AI bot integration (OpenClaw)
- [ ] Enhanced features (Phase 2)

## 📄 License

MIT

---

Made with ❤️ by Bro + Enterr
