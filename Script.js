// ============ PROVAXIS — shared site behavior ============

// Theme toggle (in-memory only — resets on page load, no persistent storage used)
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    root.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  });
}

// Mobile nav toggle
const menuToggle = document.getElementById('menuToggle');
const navlinks = document.getElementById('navlinks');
if (menuToggle && navlinks) {
  menuToggle.addEventListener('click', () => {
    const isOpen = navlinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  navlinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navlinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Scroll reveal, with a safe fallback so content never gets stuck invisible
const revealEls = document.querySelectorAll('.reveal, .stage');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, {threshold: 0.12});
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}

// Contact form — submits to the /api/contact backend function, which saves to the D1 database.
// If the database isn't connected yet (see README-SETUP.md), this will show a clear error
// instead of silently pretending the message was sent.
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  // Pre-fill the "source" hidden field from a ?source= URL param, e.g. contact.html?source=referral
  const sourceField = document.getElementById('source');
  if (sourceField) {
    const params = new URLSearchParams(window.location.search);
    sourceField.value = params.get('source') || 'website';
  }

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.submit-btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    const payload = {
      name: document.getElementById('name')?.value || '',
      email: document.getElementById('email')?.value || '',
      type: document.getElementById('type')?.value || '',
      message: document.getElementById('message')?.value || '',
      source: sourceField?.value || 'website'
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.ok) {
        btn.textContent = 'Sent — thank you';
      } else {
        btn.textContent = 'Could not send — try again';
        btn.disabled = false;
        console.error('Contact form error:', data.error);
      }
    } catch (err) {
      btn.textContent = 'Could not send — try again';
      btn.disabled = false;
      console.error('Contact form network error:', err);
    }
  });
}

// Register the service worker (enables "install as app" / offline support)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
          }
          
