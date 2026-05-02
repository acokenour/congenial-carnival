import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import WebcamShader from "./components/WebcamShader";
import SpotifyPlayer from "./components/SpotifyPlayer";

type SearchParams = Promise<{ code?: string; state?: string; error?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const { code, state, error } = await searchParams;

  if (code || error) {
    // The spotify_state cookie is readable here but may not survive the redirect
    // to the callback route, so we pass it explicitly as stored_state.
    const cookieStore = await cookies();
    const storedState = cookieStore.get('spotify_state')?.value;

    const params = new URLSearchParams();
    if (code) params.set('code', code);
    if (state) params.set('state', state);
    if (error) params.set('error', error);
    if (storedState) params.set('stored_state', storedState);
    redirect(`/api/spotify/callback?${params.toString()}`);
  }

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
      }}
    >
      <h1 style={{ marginBottom: "1rem", fontWeight: 700 }}>
        It's all blue baby
      </h1>
      <p
        style={{
          marginBottom: "2rem",
          opacity: 0.6,
          fontSize: "0.9rem",
          textAlign: "center",
          maxWidth: 500,
        }}
      >
        Good stuff all around
      </p>
      <WebcamShader />
      <SpotifyPlayer />
    </main>
  );
}
