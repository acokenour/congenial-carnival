import { NextRequest, NextResponse } from 'next/server';

const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
].join(' ');

export function GET(request: NextRequest) {
  const clientId = process.env.SP_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'SP_CLIENT_ID not configured' }, { status: 500 });
  }

  const { origin } = new URL(request.url);
  const redirectUri =
    process.env.SP_REDIRECT_URI ?? `${origin}/api/spotify/callback`;

  const state = Math.random().toString(36).substring(2, 18);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
  });

  const response = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );

  response.cookies.set('spotify_state', state, {
    httpOnly: true,
    maxAge: 300,
    path: '/',
  });

  return response;
}
