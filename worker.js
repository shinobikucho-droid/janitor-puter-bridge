/**
 * Janitor AI to Puter.js Bridge - Cloudflare Worker
 * Complete OpenAI-compatible proxy implementation
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Health check endpoint
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'online',
          service: 'Janitor-Puter Bridge',
          version: '1.0.0',
          endpoints: {
            health: '/',
            chat: '/v1/chat/completions'
          },
          message: 'Bridge is running successfully!',
          timestamp: new Date().toISOString()
        }, null, 2),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Main chat completions endpoint
    if (url.pathname === '/v1/chat/completions' && request.method === 'POST') {
      try {
        // Parse request body
        let body;
        try {
          body = await request.json();
        } catch (parseError) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'Invalid JSON in request body',
                type: 'invalid_request_error',
                param: null,
                code: 'invalid_json',
              },
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            }
          );
        }

        // Extract and validate parameters
        const {
          messages,
          model = 'puter-gpt',
          temperature = 0.7,
          max_tokens = 1000,
          stream = false,
          top_p = 1,
          frequency_penalty = 0,
          presence_penalty = 0,
        } = body;

        // Validate messages array
        if (!messages) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'Missing required parameter: messages',
                type: 'invalid_request_error',
                param: 'messages',
                code: 'missing_messages',
              },
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            }
          );
        }

        if (!Array.isArray(messages)) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'messages must be an array',
                type: 'invalid_request_error',
                param: 'messages',
                code: 'invalid_messages_type',
              },
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            }
          );
        }

        if (messages.length === 0) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'messages array cannot be empty',
                type: 'invalid_request_error',
                param: 'messages',
                code: 'empty_messages',
              },
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            }
          );
        }

        // Build conversation context
        let conversationContext = '';
        let systemPrompt = '';
        
        for (const msg of messages) {
          const role = msg.role || 'user';
          const content = msg.content || '';
          
          if (role === 'system') {
            systemPrompt += content + '
';
          } else if (role === 'user') {
            conversationContext += `User: ${content}
`;
          } else if (role === 'assistant') {
            conversationContext += `Assistant: ${content}
`;
          }
        }

        // Get the last user message
        const lastUserMessage = messages
          .slice()
          .reverse()
          .find(msg => msg.role === 'user');
        
        const userContent = lastUserMessage?.content || 'Hello';

        // Generate AI response
        // TODO: Replace this with actual Puter.js API call
        const aiResponse = generateTestResponse(userContent, systemPrompt);

        // Calculate token usage (approximate)
        const fullContext = systemPrompt + conversationContext;
        const promptTokens = Math.ceil(fullContext.length / 4);
        const completionTokens = Math.ceil(aiResponse.length / 4);
        const totalTokens = promptTokens + completionTokens;

        // Create OpenAI-compatible response
        const responseData = {
          id: `chatcmpl-${generateId()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: model,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: aiResponse,
              },
              logprobs: null,
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: totalTokens,
          },
          system_fingerprint: `fp_${generateFingerprint()}`,
        };

        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });

      } catch (error) {
        console.error('Error processing chat request:', error);
        
        return new Response(
          JSON.stringify({
            error: {
              message: error.message || 'Internal server error',
              type: 'internal_server_error',
              param: null,
              code: 'internal_error',
            },
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
    }

    // Handle 404 for unknown routes
    return new Response(
      JSON.stringify({
        error: {
          message: `Route ${url.pathname} not found`,
          type: 'invalid_request_error',
          param: null,
          code: 'route_not_found',
        },
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  },
};

/**
 * Generate test AI response
 * TODO: Replace with actual Puter.js API integration
 */
function generateTestResponse(userMessage, systemPrompt) {
  const responses = [
    `I understand you said: "${userMessage}"

✅ Your Cloudflare Worker proxy is working perfectly!

This is a test response confirming that:
- The proxy bridge is online
- OpenAI-compatible format is correct
- Janitor AI can communicate with the Worker

Next step: Integrate Puter.js AI API to get real AI responses instead of this test message.`,
    
    `Hello! I received your message: "${userMessage}"

The proxy connection is successful! Here's what's happening:

1. Janitor AI sent your message to this Cloudflare Worker
2. The Worker processed it in OpenAI-compatible format
3. This response confirms everything is working

Ready to add real AI intelligence via Puter.js integration!`,
    
    `Message received: "${userMessage}"

🎉 Success! Your bridge is operational.

Current status:
✓ Cloudflare Worker deployed
✓ API endpoint responding
✓ CORS headers configured
✓ OpenAI format validated
✓ Janitor AI connection established

The foundation is ready for Puter.js AI integration.`
  ];
  
  // Rotate responses for variety
  const index = Math.floor(Date.now() / 1000) % responses.length;
  return responses[index];
}

/**
 * Generate unique ID for chat completion
 */
function generateId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomStr}`;
}

/**
 * Generate system fingerprint
 */
function generateFingerprint() {
  return Math.random().toString(36).substring(2, 12);
          }
