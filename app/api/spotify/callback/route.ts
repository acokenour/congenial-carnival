import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/?spotify_error=access_denied', request.url));
  }

  // Cookie may be absent when forwarded via page.tsx redirect; fall back to the
  // stored_state param that page.tsx reads from the cookie and embeds in the URL.
  const storedState =
    request.cookies.get('spotify_state')?.value ?? searchParams.get('stored_state');
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL('/?spotify_error=state_mismatch', request.url));
  }

  const clientId = process.env.SP_CLIENT_ID!;
  const clientSecret = process.env.SP_CLIENT_SECRET!;
  const { origin } = new URL(request.url);
  const redirectUri = process.env.SP_REDIRECT_URI ?? origin;

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/?spotify_error=token_exchange_failed', request.url));
  }

  const tokens = await tokenRes.json();

  const response = NextResponse.redirect(new URL('/', request.url));

  response.cookies.set('spotify_access_token', tokens.access_token, {
    httpOnly: true,
    maxAge: tokens.expires_in,
    path: '/',
  });

  if (tokens.refresh_token) {
    response.cookies.set('spotify_refresh_token', tokens.refresh_token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
  }

  response.cookies.delete('spotify_state');

  return response;
}
