const { v4: uuidv4 } = require('uuid');

const sessions = new Map();
const MAX_HISTORY = 20;

function getOrCreateSession(sessionId) {
  if (!sessionId || !sessions.has(sessionId)) {
    const id = sessionId || uuidv4();
    sessions.set(id, { messages: [], createdAt: Date.now() });
    return { sessionId: id, session: sessions.get(id) };
  }
  return { sessionId, session: sessions.get(sessionId) };
}

function addMessage(sessionId, role, content) {
  const { session } = getOrCreateSession(sessionId);
  session.messages.push({ role, content, timestamp: Date.now() });
  if (session.messages.length > MAX_HISTORY) {
    session.messages = session.messages.slice(-MAX_HISTORY);
  }
  return session.messages;
}

function getConversationHistory(sessionId) {
  const entry = sessions.get(sessionId);
  if (!entry) return [];
  return entry.messages.map(({ role, content }) => ({ role, content }));
}

function getFullHistory(sessionId) {
  const entry = sessions.get(sessionId);
  return entry ? entry.messages : [];
}

function clearSession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = {
  getOrCreateSession,
  addMessage,
  getConversationHistory,
  getFullHistory,
  clearSession,
};
