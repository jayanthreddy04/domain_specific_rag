const Groq = require('groq-sdk');
const env = require('../config/env');
const { logger } = require('../middleware/logger');

let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    if (!env.groqApiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }
    groqClient = new Groq({ apiKey: env.groqApiKey });
  }
  return groqClient;
}

function buildSystemPrompt() {
  return `You are a domain-specific AI assistant focused exclusively on Artificial Intelligence topics.
Answer questions using ONLY the provided context documents.
If the context does not contain enough information to answer the question, respond with:
"I don't have enough information in my AI knowledge base to answer that question accurately."
Do NOT use general world knowledge about people, politics, celebrities, or topics outside AI.
Do NOT invent facts or connect unrelated context to unrelated questions.
Be concise, accurate, and educational.
When referencing information, cite sources (e.g., [Source 1]).`;
}

function formatContext(sources) {
  return sources
    .map(
      (s, i) =>
        `[Source ${i + 1}] ${s.metadata?.title || 'Document'} (${s.metadata?.docId || s.id})\n${s.text}`
    )
    .join('\n\n---\n\n');
}

async function generateAnswer({ query, sources, conversationHistory = [] }) {
  const client = getGroqClient();
  const contextBlock = formatContext(sources);

  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    ...conversationHistory.slice(-6),
    {
      role: 'user',
      content: `Context:\n${contextBlock}\n\nQuestion: ${query}\n\nProvide a grounded answer with source references.`,
    },
  ];

  const start = Date.now();
  const completion = await client.chat.completions.create({
    model: env.groqModel,
    messages,
    temperature: 0.2,
    max_tokens: 1024,
  });

  const answer = completion.choices[0]?.message?.content || '';
  const responseTimeMs = Date.now() - start;

  logger.info('Groq response generated', { responseTimeMs, model: env.groqModel });
  return { answer, responseTimeMs, model: env.groqModel };
}

async function optimizeQuery(query, conversationHistory = []) {
  if (!env.groqApiKey || conversationHistory.length === 0) {
    return query;
  }

  try {
    const client = getGroqClient();
    const completion = await client.chat.completions.create({
      model: env.groqModel,
      messages: [
        {
          role: 'system',
          content:
            'Rewrite the user question into a standalone search query for retrieval. Output only the query, no explanation.',
        },
        ...conversationHistory.slice(-4),
        { role: 'user', content: query },
      ],
      temperature: 0,
      max_tokens: 128,
    });
    return completion.choices[0]?.message?.content?.trim() || query;
  } catch (err) {
    logger.warn('Query optimization failed, using original query', { err: err.message });
    return query;
  }
}

module.exports = { generateAnswer, optimizeQuery, formatContext };
