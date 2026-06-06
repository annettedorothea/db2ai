/** Shared HTML for local demo OAuth IdP (authorize + help). */

export const IDP_TITLE = 'Demo IdP';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function idpPageShell(title, contentHtml) {
    const safeTitle = escapeHtml(title);
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #f4f4f5;
    --card: #ffffff;
    --text: #18181b;
    --muted: #71717a;
    --border: #e4e4e7;
    --accent: #2563eb;
    --accent-hover: #1d4ed8;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #09090b;
      --card: #18181b;
      --text: #fafafa;
      --muted: #a1a1aa;
      --border: #3f3f46;
      --accent: #3b82f6;
      --accent-hover: #60a5fa;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
  }
  .card {
    width: 100%;
    max-width: 26rem;
    padding: 1.75rem;
    border-radius: 0.75rem;
    border: 1px solid var(--border);
    background: var(--card);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.08), 0 8px 24px rgb(0 0 0 / 0.06);
  }
  h1 {
    margin: 0 0 0.35rem;
    font-size: 1.35rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .subtitle {
    margin: 0 0 1.25rem;
    font-size: 0.9rem;
    color: var(--muted);
    line-height: 1.45;
  }
  p {
    margin: 0 0 0.85rem;
    font-size: 0.875rem;
    line-height: 1.55;
    color: var(--text);
  }
  p:last-child { margin-bottom: 0; }
  .btn {
    display: inline-block;
    margin-top: 0.25rem;
    padding: 0.6rem 1.15rem;
    border-radius: 0.5rem;
    background: var(--accent);
    color: #fff;
    font-size: 0.9rem;
    font-weight: 500;
    text-decoration: none;
    transition: background 0.15s ease;
  }
  .btn:hover { background: var(--accent-hover); }
  .pick-label {
    margin: 0 0 0.65rem;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
  }
  .account-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .account-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.65rem 0.85rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    font-size: 0.9rem;
    font-weight: 500;
    text-decoration: none;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .account-link:hover {
    border-color: var(--accent);
    background: var(--card);
  }
  .account-role {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--muted);
  }
  code {
    font-size: 0.82em;
    padding: 0.12em 0.35em;
    border-radius: 0.25rem;
    background: var(--bg);
    border: 1px solid var(--border);
  }
</style>
</head>
<body>
  <main class="card">
    ${contentHtml}
  </main>
</body>
</html>`;
}

export function sendHtml(res, html) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
}

/** OAuth consent step (Cursor opens /authorize without customerId). */
export function renderAuthorizeConsentPage(users) {
    const items = users
        .map((u) => {
            const href = escapeHtml(u.href);
            const id = escapeHtml(u.customerId);
            const role = escapeHtml(u.role);
            return `<li><a class="account-link" href="${href}"><span>${id}</span><span class="account-role">${role}</span></a></li>`;
        })
        .join('');
    return idpPageShell(
        IDP_TITLE,
        `<h1>${IDP_TITLE}</h1>
<p class="subtitle">Local sign-in for MCP demos only — pick a test account.</p>
<p class="pick-label">Test account</p>
<ul class="account-list">${items}</ul>`
    );
}

/** Bare /authorize visit (bookmark) — point back to MCP client. */
export function renderAuthorizeHelpPage(mcpHint) {
    return idpPageShell(
        IDP_TITLE,
        `<h1>${IDP_TITLE}</h1>
<p class="subtitle">Authorization endpoint for local MCP OAuth tests.</p>
<p>${mcpHint}</p>
<p>Do not bookmark this URL — start sign-in from your MCP client (<strong>Needs login</strong>).</p>`
    );
}
