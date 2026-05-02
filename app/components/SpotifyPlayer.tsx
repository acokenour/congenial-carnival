'use client';

import { useEffect, useRef, useState } from 'react';

interface Track {
  uri: string;
  name: string;
  artist: string;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: SpotifyPlayerInit) => SpotifyPlayerInstance;
    };
  }
}

interface SpotifyPlayerInit {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume: number;
}

interface SpotifyPlayerInstance {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: string, callback: (data: unknown) => void): void;
  pause(): Promise<void>;
  resume(): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
}

export default function SpotifyPlayer() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState<Track | null>(null);
  const [status, setStatus] = useState('');

  const playerRef = useRef<SpotifyPlayerInstance | null>(null);
  const tokenRef = useRef<string | null>(null);

  // Check if we have a valid session
  useEffect(() => {
    fetch('/api/spotify/token')
      .then((r) => r.json())
      .then((d) => {
        if (d.access_token) {
          tokenRef.current = d.access_token;
          setAuthed(true);
        } else {
          setAuthed(false);
        }
      })
      .catch(() => setAuthed(false));
  }, []);

  // Load the Web Playback SDK once authenticated
  useEffect(() => {
    if (!authed) return;

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Webcam ASCII Spotlight',
        getOAuthToken: (cb) => {
          fetch('/api/spotify/token')
            .then((r) => r.json())
            .then((d) => {
              if (d.access_token) {
                tokenRef.current = d.access_token;
                cb(d.access_token);
              }
            });
        },
        volume: 0.7,
      });

      player.addListener('ready', (data) => {
        const { device_id } = data as { device_id: string };
        setDeviceId(device_id);
        setStatus('');
      });

      player.addListener('not_ready', () => {
        setDeviceId(null);
        setStatus('Player disconnected');
      });

      player.addListener('player_state_changed', (data) => {
        if (!data) return;
        const state = data as {
          paused: boolean;
          track_window: { current_track: { uri: string; name: string; artists: Array<{ name: string }> } };
        };
        setPlaying(!state.paused);
        const t = state.track_window?.current_track;
        if (t) setTrack({ uri: t.uri, name: t.name, artist: t.artists[0]?.name ?? '' });
      });

      player.addListener('initialization_error', () => setStatus('Playback init failed'));
      player.addListener('authentication_error', () => {
        setStatus('Auth error — reconnect Spotify');
        setAuthed(false);
      });
      player.addListener('account_error', () =>
        setStatus('Spotify Premium required for playback')
      );

      player.connect();
      playerRef.current = player;
    };

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      playerRef.current?.disconnect();
    };
  }, [authed]);

  const startPlayback = async () => {
    if (!deviceId || !tokenRef.current) return;

    setStatus('Loading playlist…');
    try {
      const res = await fetch('/api/spotify/playlist');
      const data = await res.json();
      if (!data.tracks?.length) {
        setStatus('No tracks found');
        return;
      }

      const pick: Track = data.tracks[Math.floor(Math.random() * data.tracks.length)];

      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [pick.uri] }),
      });

      setStatus('');
    } catch {
      setStatus('Playback failed');
    }
  };

  const handleButton = async () => {
    if (!playerRef.current) return;
    if (playing) {
      await playerRef.current.pause();
    } else if (track) {
      await playerRef.current.resume();
    } else {
      await startPlayback();
    }
  };

  if (authed === null) return null;

  return (
    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
      {!authed ? (
        <a href="/api/spotify/login" style={pill('#1DB954')}>
          Connect Spotify
        </a>
      ) : !deviceId ? (
        <p style={{ opacity: 0.45, fontSize: '0.82rem' }}>Connecting player…</p>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
            {track && (
              <button onClick={() => playerRef.current?.previousTrack()} style={pill('#191414')}>
                ⏮ Prev
              </button>
            )}
            <button onClick={handleButton} style={pill('#1DB954')}>
              {playing ? '⏸ Pause' : track ? '▶ Resume' : '▶ Play from Playlist'}
            </button>
            {track && (
              <button onClick={() => playerRef.current?.nextTrack()} style={pill('#191414')}>
                Next ⏭
              </button>
            )}
          </div>
          {track && (
            <p style={{ margin: '0.5rem 0 0', opacity: 0.65, fontSize: '0.82rem' }}>
              {track.name} — {track.artist}
            </p>
          )}
          {status && (
            <p style={{ margin: '0.4rem 0 0', color: '#ff6b6b', fontSize: '0.78rem' }}>
              {status}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function pill(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: '2rem',
    padding: '0.55rem 1.4rem',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    letterSpacing: '0.02em',
  };
}
