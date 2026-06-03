import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/chat';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

export async function sendQuery(query, sessionId) {
  const { data } = await client.post('/query', { query, sessionId });
  return data;
}

export async function fetchChatHistory(sessionId) {
  const { data } = await client.get(`/history/${sessionId}`);
  return data;
}

export async function clearSession(sessionId) {
  const { data } = await client.delete('/session', { data: { sessionId } });
  return data;
}

export async function checkHealth() {
  const { data } = await client.get('/health');
  return data;
}
