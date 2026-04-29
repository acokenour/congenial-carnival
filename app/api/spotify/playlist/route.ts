import { NextRequest, NextResponse } from 'next/server';

const PLAYLIST_ID = '30pGvnBngJd4IEZI5Bktsy';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('spotify_access_token')?.value;
  if (!accessToken) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?fields=items(track(uri,name,artists(name)))&limit=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'failed_to_fetch_playlist' }, { status: res.status });
  }

  const data = await res.json();
  const tracks = (data.items as Array<{ track: { uri: string; name: string; artists: Array<{ name: string }> } | null }>)
    .filter((item) => item.track?.uri)
    .map((item) => ({
      uri: item.track!.uri,
      name: item.track!.name,
      artist: item.track!.artists[0]?.name ?? '',
    }));

  return NextResponse.json({ tracks });
}
