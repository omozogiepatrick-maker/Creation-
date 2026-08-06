// Vercel Serverless Function — example stub for POST /api/ai-assistant
//
// This is NOT wired to any button on the site yet — it's here so that when you're
// ready to add an AI feature (a chat assistant, an audit summarizer, etc.), the
// pattern for calling an AI API securely is already in place.
//
// The API key NEVER lives in this file or anywhere in the site's HTML/CSS/JS —
// it's read from an environment variable you set in the Vercel dashboard
// (Project → Settings → Environment Variables). That's the only safe place for it:
// anything inside the site's own files is publicly visible to anyone who views
// the page source.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      ok: false,
      error: 'AI feature is not configured yet. Add ANTHROPIC_API_KEY in the Vercel dashboard first.'
    });
    return;
  }

  const message = (req.body?.message || '').toString().trim();
  if (!message) {
    res.status(400).json({ ok: false, error: 'A message is required.' });
    return;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: message }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(502).json({ ok: false, error: 'AI request failed: ' + errText });
      return;
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || '';
    res.status(200).json({ ok: true, reply });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'AI request failed: ' + err.message });
  }
};
