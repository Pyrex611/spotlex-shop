/**
 * _shared/zoho-auth.ts
 * Centralized Zoho OAuth2 token management for all Edge Functions.
 *
 * Caches the access token for the lifetime of a single function invocation
 * so multiple Zoho API calls in one request share one token refresh.
 */

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getZohoAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (with 90-second buffer before expiry)
  if (cachedToken && now < tokenExpiresAt - 90_000) {
    return cachedToken;
  }

  const clientId     = Deno.env.get('ZOHO_CLIENT_ID');
  const clientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');
  const refreshToken = Deno.env.get('ZOHO_REFRESH_TOKEN');
  // Defaults to .com (US) — change to accounts.zoho.eu / .in / .com.au if your
  // Zoho account was registered in a different data centre.
  const accountsUrl  = Deno.env.get('ZOHO_ACCOUNTS_URL') ?? 'https://accounts.zoho.com';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing Zoho credentials. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ' +
      'ZOHO_REFRESH_TOKEN via: supabase secrets set ZOHO_REFRESH_TOKEN=<value>'
    );
  }

  const res = await fetch(`${accountsUrl}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  // Always parse as text first — Zoho returns HTTP 200 even for auth errors
  const raw = await res.text();
  let data: Record<string, unknown>;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Zoho auth returned non-JSON response (HTTP ${res.status}): ${raw}`);
  }

  if (data.error) {
    // Common errors:
    //   invalid_code       – grant code already used; generate a new one
    //   invalid_client     – wrong client_id / client_secret
    //   Access denied      – refresh token revoked; re-generate it
    throw new Error(
      `Zoho OAuth Error: "${data.error}". ` +
      (data.error_description
        ? `Description: ${data.error_description}. `
        : '') +
      'If the refresh token is expired or revoked, re-generate one from ' +
      'https://api-console.zoho.com and update the ZOHO_REFRESH_TOKEN secret.'
    );
  }

  if (!data.access_token) {
    throw new Error(`Zoho auth failed — no access_token in response: ${raw}`);
  }

  cachedToken      = data.access_token as string;
  tokenExpiresAt   = now + ((data.expires_in as number) ?? 3600) * 1000;

  return cachedToken;
}

/** Helper: build the correct Zoho Inventory base URL from env (defaults to global). */
export function getZohoApiBase(): string {
  return Deno.env.get('ZOHO_API_URL') ?? 'https://www.zohoapis.com/inventory/v1';
}