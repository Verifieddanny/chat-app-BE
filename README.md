# Real-Time Chat Application — Backend

A real-time chat API built with TypeScript, Express, MongoDB, and Socket.io. Supports private DMs and group chats with real-time messaging, typing indicators, presence detection, read receipts, and message history with pagination.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express 5
- **Database:** MongoDB with Mongoose
- **Real-Time:** Socket.io
- **Authentication:** JWT (jsonwebtoken) + bcrypt
- **Validation:** express-validator

## Features

- **User Authentication** — Signup and login with bcrypt password hashing and JWT tokens
- **Room Management** — Create private DMs and group chats, add/remove members, join/leave rooms, update room details with admin-only permissions
- **Real-Time Messaging** — Send and receive messages instantly via WebSockets
- **Typing Indicators** — See when other users are typing in a room
- **Online/Offline Presence** — Real-time status updates when users connect or disconnect
- **Read Receipts** — Track who has viewed each message with timestamps
- **Last Seen** — Stores last seen timestamp on disconnect
- **Message History** — Paginated message retrieval via REST API
- **Duplicate DM Detection** — Prevents creating duplicate private rooms between the same users

## Architecture

The application runs two communication layers in parallel:

- **REST API** handles authentication, room management, and message history (data that doesn't need to be real-time)
- **WebSockets (Socket.io)** handle everything live: sending messages, typing indicators, presence updates, and read receipts

When a user logs in, they receive a JWT token. They connect to the WebSocket server using this token for authentication. The server automatically joins them to all their Socket.io rooms, enabling instant message delivery to any conversation they belong to.

## Project Structure

```
src/
├── controllers/
│   ├── auth.ts            # Signup and login controllers
│   ├── room.ts            # Room CRUD and member management
│   └── message.ts         # Message history with pagination
├── middleware/
│   ├── is-auth.ts         # JWT verification for REST routes
│   └── socket-auth.ts     # JWT verification for WebSocket connections
├── models/
│   ├── user.ts            # User schema (name, username, email, password, lastSeen)
│   ├── room.ts            # Room schema (name, type, members, creator, bio)
│   └── message.ts         # Message schema (content, from, to, viewedBy)
├── routes/
│   ├── auth.ts            # Auth routes
│   ├── room.ts            # Room management routes
│   └── message.ts         # Message history routes
├── validation/
│   ├── auth.ts            # Auth input validation
│   └── room.ts            # Room input validation
├── shared/
│   ├── helper.ts          # Shared utilities (saveMessage, getAllUserRooms, etc.)
│   └── types.ts           # Shared TypeScript interfaces
└── index.ts               # App entry point, Socket.io event handlers
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas account or local MongoDB instance

### Installation

```bash
git clone https://github.com/Verifieddanny/chat-app-BE.git
cd chat-app-BE
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```
MONGODB_URL=your_mongodb_connection_string
TEST_MONGODB_URL=your_test_mongodb_connection_string
SECRETE_KEY=your_jwt_secret_key
```

### Running the Server

```bash
# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## REST API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/sign-up` | No | Create a new account |
| POST | `/auth/login` | No | Login and receive JWT |

### Room Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/rooms` | Yes | Create a room (private or group) |
| GET | `/rooms/all` | Yes | Get all rooms for the user |
| GET | `/rooms/:roomId` | Yes | Get a single room (members only) |
| PUT | `/rooms/:roomId/add` | Yes | Add a member to a group room |
| PUT | `/rooms/:roomId/remove` | Yes | Remove a member (admin only) |
| PUT | `/rooms/:roomId/join` | Yes | Join a group room |
| PUT | `/rooms/:roomId/leave` | Yes | Leave a room |
| PUT | `/rooms/:roomId` | Yes | Update room details (admin only) |

### Messages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/messages/:roomId` | Yes | Get message history (paginated) |

Query parameter: `?page=1` (default: 1, 15 messages per page)

## WebSocket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `client:send_message` | `{ roomId, content }` | Send a message to a room |
| `client:is_typing` | `{ roomId }` | Notify room that user is typing |
| `client:read_receipt` | `{ messageId }` | Mark a message as read |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `server:new_message` | `{ roomId, content, from, timeStamp }` | New message in a room |
| `server:user_typing` | `{ roomId, userId }` | A user is typing |
| `server:user_online` | `{ user, status }` | A user came online |
| `server:user_offline` | `{ user, status }` | A user went offline |
| `server:viewed_message` | `{ messageId, roomId, viewedBy }` | Message read receipt |

### Connection

Connect with a JWT token:

```javascript
const socket = io("http://localhost:8080", {
  auth: { token: "your_jwt_token" }
});
```

## Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "Room Controller"
```

28 tests covering authentication, middleware, room management, message history, and WebSocket connection.

## License

MIT