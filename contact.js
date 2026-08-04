// Cloudflare Pages Function — handles POST /api/contact
// Saves form submissions to the D1 database bound as "DB" (see setup steps in README-SETUP.md).

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Invalid request body.' }, 400);
  }

  const name = (body.name || '').toString().trim();
  const email = (body.email || '').toString().trim();
  const projectType = (body.type || '').toString().trim();
  const message = (body.message || '').toString().trim();
  const source = (body.source || 'website').toString().trim();

  if (!name || !email || !message) {
    return jsonResponse({ ok: false, error: 'Name, email, and message are required.' }, 400);
  }

  if (!env.DB) {
    // D1 isn't bound yet — see README-SETUP.md. Fail clearly instead of pretending it worked.
    return jsonResponse({ ok: false, error: 'Database is not connected yet. See README-SETUP.md.' }, 500);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO submissions (name, email, project_type, message, source) VALUES (?, ?, ?, ?, ?)`
    ).bind(name, email, projectType, message, source).run();

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Could not save submission. ' + err.message }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
           }
