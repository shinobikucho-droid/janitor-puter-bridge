const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Janitor-Puter Bridge is running!',
    endpoints: ['/v1/chat/completions']
  });
});

// Main proxy endpoint for Janitor AI
app.post('/v1/chat/completions', async (req, res) => {
  try {
    console.log('Received request:', JSON.stringify(req.body, null, 2));

    const { messages, model, temperature, max_tokens, stream } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Messages array is required',
          type: 'invalid_request_error'
        }
      });
    }

    // Build conversation context
    let conversationText = '';
    messages.forEach(msg => {
      if (msg.role === 'system') {
        conversationText += `[SYSTEM INSTRUCTIONS]
${msg.content}

`;
      } else if (msg.role === 'user') {
        conversationText += `User: ${msg.content}
`;
      } else if (msg.role === 'assistant') {
        conversationText += `Assistant: ${msg.content}
`;
      }
    });

    // For now, send a simple response
    // TODO: Integrate actual Puter.js API when authentication is set up
    const responseText = `I'm your AI assistant via Puter.js! You said: "${messages[messages.length - 1].content}"

[Note: This is a test response. To enable full AI responses, you need to set up Puter.js authentication.]`;

    // Create OpenAI-compatible response
    const openaiResponse = {
      id: `chatcmpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model || 'puter-gpt',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: responseText
        },
        finish_reason: 'stop',
        logprobs: null
      }],
      usage: {
        prompt_tokens: conversationText.length,
        completion_tokens: responseText.length,
        total_tokens: conversationText.length + responseText.length
      },
      system_fingerprint: 'puter-bridge-v1'
    };

    console.log('Sending response:', JSON.stringify(openaiResponse, null, 2));
    res.json(openaiResponse);

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'internal_error',
        code: 500
      }
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      message: 'Something went wrong',
      type: 'internal_error'
    }
  });
});

// Start server on all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Janitor-Puter Bridge running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/`);
  console.log(`🔗 Proxy endpoint: http://localhost:${PORT}/v1/chat/completions`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});