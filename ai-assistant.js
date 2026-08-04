// Cloudflare Pages Function — example stub for POST /api/ai-assistant
//
// This is NOT wired to any button on the site yet — it's here so that when you're
// ready to add an AI feature (e.g. a chat assistant that answers questions about
// Provaxis, or helps summarize a bottleneck audit), the pattern for calling an AI
// API securely is already in place.
//
// The API key NEVER lives in this file or anywhere in the site's HTML/CSS/JS —
// it's read from an environment variable you set in the Cloudflare dashboard
// (see README-SETUP.md, step 4). That's the only safe place for it: anything
// inside the site's own files is publicly visible to anyone who views the page source.

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse(
      { ok: false, error: 'AI feature is not configured yet. Add ANTHROPIC_API_KEY in the Cloudflare dashboard first.' },
      500
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Invalid request body.' }, 400);
  }

  const userMessage = (body.message || '').toString().trim();
  if (!userMessage) {
    return jsonResponse({ ok: false, error: 'A message is required.' }, 400);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return jsonResponse({ ok: false, error: 'AI request failed: ' + errText }, 502);
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || '';
    return jsonResponse({ ok: true, reply });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'AI request failed: ' + err.message }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
        }
  
