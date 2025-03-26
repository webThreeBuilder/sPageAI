import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    const encoder = new TextEncoder();
    
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const systemPrompt = `You are an expert HTML and CSS senior front developer. 
    Generate clean, semantic HTML with Tailwind CSS for the user's request in a single page.
    Follow these requirements:
    1. Keep the code under 3000 tokens
    2. Use minimal external resources
    3. Only include essential Tailwind classes
    4. Focus on core functionality first
    5. Output valid HTML5 structure
    6. Include only critical inline CSS in a style tag
    7. Respond with code only, no explanations
    8. Use simple placeholder images from placehold.co
    9. Remove the system html comments`;

    fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "deepseek-coder",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a single HTML page with inline CSS for: ${prompt}` }
        ],
        stream: true,
      }),
    }).then(async (response) => {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream not supported');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          const message = line.replace(/^data: /, '');
          if (message === '[DONE]') continue;

          try {
            const parsed = JSON.parse(message);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              await writer.write(encoder.encode(JSON.stringify({ chunk: content }) + '\n'));
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
      await writer.close();
    }).catch(async (error) => {
      console.error('Error:', error);
      await writer.abort(error);
    });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.info(error)
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}