const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Janitor-Puter Bridge is running!' 
  });
});

// Main proxy endpoint for Janitor AI
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { messages, model, temperature, max_tokens } = req.body;

    // Extract the last user message
    let userPrompt = '';
    if (messages && messages.length > 0) {
      // Combine all messages into context
      userPrompt = messages.map(msg => {
        if (msg.role === 'system') return `System: ${msg.content}`;
        if (msg.role === 'user') return `User: ${msg.content}`;
        if (msg.role === 'assistant') return `Assistant: ${msg.content}`;
        return msg.content;
      }).join('

');
    }

    // Select Puter model (default to gpt-5-nano)
    let puterModel = 'gpt-5-nano';
    if (model) {
      if (model.includes('claude')) puterModel = 'claude-opus';
      else if (model.includes('gemini')) puterModel = 'gemini-flash';
      else if (model.includes('deepseek')) puterModel = 'deepseek';
      else if (model.includes('llama')) puterModel = 'llama-3.3-70b';
    }

    // Call Puter.js AI via their HTTP API
    const puterResponse = await fetch('https://api.puter.com/drivers/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PUTER_TOKEN || 'anonymous'}`
      },
      body: JSON.stringify({
        interface: 'puter-chat-completion',
        driver: 'openai-completion',
        method: 'complete',
        args: {
          messages: [{
            role: 'user',
            content: userPrompt
          }],
          model: puterModel,
          temperature: temperature || 0.7,
          max_tokens: max_tokens || 1000
        }
      })
    });

    const puterData = await puterResponse.json();
    
    // Transform to OpenAI format
    const openaiResponse = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: puterModel,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: puterData.result || puterData.message || 'No response from Puter.js'
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };

    res.json(openaiResponse);

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'internal_error',
        code: 500
      }
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Proxy endpoint: /v1/chat/completions`);
});