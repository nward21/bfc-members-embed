/**
 * Vercel Edge middleware — HTTP Basic Auth gate.
 *
 * Protects every path EXCEPT /logos/* (needed by the public WP embed)
 * and /favicon.ico. Reads allowed credentials from the BASIC_AUTH_CREDS
 * env var, format: "user1:pass1,user2:pass2".
 *
 * If BASIC_AUTH_CREDS is unset, middleware falls open (no gate) — this
 * is deliberate so a fresh deploy doesn't lock everyone out before the
 * env var is configured.
 */

export const config = {
  matcher: '/((?!logos/|favicon\\.ico).*)',
};

export default function middleware(request: Request): Response | undefined {
  const creds = process.env.BASIC_AUTH_CREDS;

  // Fail open if no credentials configured yet (initial deploy safety).
  if (!creds) return;

  const auth = request.headers.get('authorization');
  if (!auth) return unauthorized();

  const [scheme, encoded] = auth.split(' ');
  if (scheme !== 'Basic' || !encoded) return unauthorized();

  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorized();
  }

  const allowed = creds.split(',').map(s => s.trim()).filter(Boolean);
  if (allowed.includes(decoded)) return; // pass through

  return unauthorized();
}

function unauthorized(): Response {
  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="BFC Directory Admin"',
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-store',
    },
  });
}
