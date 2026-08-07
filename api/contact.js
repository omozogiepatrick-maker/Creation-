// Vercel Serverless Function — handles POST /api/contact
// Saves form submissions to a Neon Postgres database (set up via Vercel's Storage tab).

const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }

  const { name, email, type, message, source } = req.body || {};

  const cleanName = (name || '').toString().trim();
  const cleanEmail = (email || '').toString().trim();
  const cleanType = (type || '').toString().trim();
  const cleanMessage = (message || '').toString().trim();
  const cleanSource = (source || 'website').toString().trim();

  if (!cleanName || !cleanEmail || !cleanMessage) {
    res.status(400).json({ ok: false, error: 'Name, email, and message are required.' });
    return;
  }

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    // Database isn't connected yet — see README-SETUP.md. Fail clearly instead of pretending it worked.
    res.status(500).json({ ok: false, error: 'Database is not connected yet. See README-SETUP.md.' });
    return;
  }

  try {
    const sql = neon(connectionString);
    await sql`
      INSERT INTO submissions (name, email, project_type, message, source)
      VALUES (${cleanName}, ${cleanEmail}, ${cleanType}, ${cleanMessage}, ${cleanSource})
    `;

    // Send an email notification (best-effort — if this fails, the submission is still
    // safely saved in the database above, so we don't fail the whole request over it).
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Provaxis Website <onboarding@resend.dev>',
            to: ['omozogiepatrick@gmail.com'],
            reply_to: cleanEmail,
            subject: `New enquiry: ${cleanType || 'General'} — ${cleanName}`,
            text: `Name: ${cleanName}\nEmail: ${cleanEmail}\nType: ${cleanType}\nSource: ${cleanSource}\n\nMessage:\n${cleanMessage}`
          })
        });
      } catch (emailErr) {
        console.error('Email notification failed (submission still saved):', emailErr.message);
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not save submission. ' + err.message });
  }
};
