-- Users Table (supports Google OAuth + local credentials)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    image TEXT,
    password_hash TEXT, -- NULL for Google OAuth users
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chats Table
CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SandboxInstances Table (GCP VM instances)
CREATE TABLE IF NOT EXISTS sandbox_instances (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL, -- 'mock' | 'gcp'
    status TEXT NOT NULL, -- 'provisioning' | 'running' | 'stopped' | 'failed'
    connection_info TEXT NOT NULL, -- JSON string storing VM IP, zone, name, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ChatSandboxes (Junction) Table
CREATE TABLE IF NOT EXISTS chat_sandboxes (
    chat_id TEXT NOT NULL,
    sandbox_id TEXT NOT NULL,
    PRIMARY KEY(chat_id, sandbox_id),
    FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY(sandbox_id) REFERENCES sandbox_instances(id) ON DELETE CASCADE
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    sender TEXT NOT NULL, -- 'user' | 'agent' | 'system'
    content TEXT NOT NULL,
    tool_calls TEXT, -- JSON string representation of tool calls
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
