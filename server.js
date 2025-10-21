const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => {
  res.json({ status: 'online', message: 'Janitor-Puter Bridge running on Glitch!', endpoints: ['/v1/chat/completions'] });
});

app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { messages, model } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: { message: 'Messages required' } });
    }
    const lastMessage = messages[messages.length - 1].content || 'Hello';
    const responseText = `Hello! You said: "${lastMessage}"

This is from your Glitch proxy. It's working!`;
    res.json({
      id: 'chatcmpl-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model || 'puter-gpt',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: responseText },
        logprobs: null,
        finish_reason: 'stop'
      }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      system_fingerprint: 'glitch-proxy'
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
