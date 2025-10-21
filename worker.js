export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const url = new URL(request.url);

    if (url.pathname === '/' && request.method === 'GET') {
      return Response.json({
        status: 'online',
        message: 'Janitor-Puter Bridge running!',
        endpoints: ['/v1/chat/completions']
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (url.pathname === '/v1/chat/completions' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { messages, model } = body;

        if (!messages || messages.length === 0) {
          return Response.json({
            error: { message: 'Messages required' }
          }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        const lastMessage = messages[messages.length - 1].content;
        const responseText = 'Hello from Cloudflare! You said: "' + lastMessage + '"';

        return Response.json({
          id: 'chatcmpl-' + Date.now(),
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: model || 'puter-gpt',
          choices: [{
            index: 0,
            message: { role: 'assistant', content: responseText },
            finish_reason: 'stop'
          }],
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        }, {
          headers: { 'Access-Control-Allow-Origin': '*' }
        });

      } catch (error) {
        return Response.json({
          error: { message: error.message }
        }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
    }

    return Response.json({ error: 'Not Found' }, { 
      status: 404, 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  }
};