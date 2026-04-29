import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('spotify_access_token')?.value;
  if (accessToken) {
    return NextResponse.json({ access_token: accessToken });
  }

  const refreshToken = request.cookies.get('spotify_refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const clientId = process.env.SP_CLIENT_ID!;
  const clientSecret = process.env.SP_CLIENT_SECRET!;

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.json({ error: 'refresh_failed' }, { status: 401 });
  }

  const tokens = await tokenRes.json();

  const response = NextResponse.json({ access_token: tokens.access_token });

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

  return response;
}
