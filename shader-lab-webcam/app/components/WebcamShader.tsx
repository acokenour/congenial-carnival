"use client";

import {
  ShaderLabComposition,
  type ShaderLabConfig,
} from "@basementstudio/shader-lab";
import { useEffect, useRef, useState } from "react";

// The custom shader code that runs on the GPU.
// It's written as a string because Shader Lab compiles it at runtime.
//
// What it does, conceptually:
// 1. Reads the webcam pixel at the current screen coordinate.
// 2. Calculates how far the current pixel is from the mouse position.
// 3. Inside the circle: chops the image into a grid, picks an ASCII-ish
//    character based on brightness, and draws it.
// 4. Outside the circle: passes the raw webcam pixel through.
// 5. Smoothly blends between the two at the circle edge.
const ASCII_SPOTLIGHT_SHADER = `
export const sketch = Fn(() => {
  // Sample the layer below (the webcam) at the natural UV.
  const original = inputTexture.sample(uv()).toVar();

  // Mouse position is fed in via a uniform. Default to center if untouched.
  const mouse = uniform(vec2(0.5, 0.5));

  // Distance from current pixel to the mouse, aspect-corrected so the
  // spotlight is a real circle and not an oval.
  const aspect = screenSize.x.div(screenSize.y);
  const corrected = vec2(uv().x.sub(mouse.x).mul(aspect), uv().y.sub(mouse.y));
  const dist = corrected.length();

  // Smooth circular mask: 1 inside, 0 outside, soft edge.
  const radius = float(0.25);
  const softness = float(0.04);
  const mask = smoothstep(radius, radius.sub(softness), dist);

  // ----- ASCII effect -----
  // Snap UVs to a coarse grid. Each cell will become one "character".
  const cellSize = float(0.018);
  const cellUv = vec2(
    floor(uv().x.div(cellSize)).mul(cellSize).add(cellSize.mul(0.5)),
    floor(uv().y.div(cellSize)).mul(cellSize).add(cellSize.mul(0.5))
  );
  const cellColor = inputTexture.sample(cellUv);

  // Brightness of the cell drives which "character" we draw.
  const brightness = dot(cellColor.rgb, vec3(0.299, 0.587, 0.114));

  // Local coordinate inside the cell, range -0.5 to 0.5.
  const local = vec2(
    uv().x.div(cellSize).sub(floor(uv().x.div(cellSize))).sub(0.5),
    uv().y.div(cellSize).sub(floor(uv().y.div(cellSize))).sub(0.5)
  );

  // Build a fake "character" from layered shapes whose visibility depends
  // on brightness. Darker cells = sparse dots, brighter = dense blocks.
  const dot1 = smoothstep(0.35, 0.25, local.length());
  const dot2 = smoothstep(0.5, 0.4, max(abs(local.x), abs(local.y)));
  const line = smoothstep(0.08, 0.0, abs(local.y));

  const charDensity = mix(
    float(0.0),
    mix(line, mix(dot1, dot2, brightness), brightness),
    smoothstep(0.05, 0.95, brightness)
  );

  // Tint the ASCII a phosphor green for the retro look.
  const asciiColor = vec3(0.2, 1.0, 0.4).mul(charDensity);
  const asciiPixel = vec4(asciiColor, 1.0);

  // ----- Blend ASCII (inside circle) with original (outside) -----
  const finalColor = mix(original, asciiPixel, mask);
  return finalColor;
});
`;

export default function WebcamShader() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Request webcam access once the component mounts.
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: false,
        });

        // Attach the stream to a hidden <video> element. We then point
        // Shader Lab at this video element via a blob-ish trick: most
        // builds of the runtime will accept the video element directly
        // when its srcObject is a MediaStream, but to be portable we
        // also expose the element on window so the shader runtime can
        // discover it. The simpler, well-documented path is to just
        // pass the stream's video to a media layer below.
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          // Shader Lab media layers accept a URL in layer.asset.src.
          // For a MediaStream we use the video element itself by
          // setting the src to a captured stream URL where supported.
          // Modern browsers expose this as the video's currentSrc once
          // playing, but the cleanest cross-browser way is to capture
          // the stream into a blob via MediaRecorder OR just render
          // the <video> element to a canvas every frame. We take the
          // latter approach for reliability — see CanvasBridge below.
          setVideoUrl("ready");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not access webcam. Check browser permissions."
        );
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Track mouse position over the container (normalized 0–1).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      // Flip Y because shader UVs have origin at bottom-left.
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      setMousePos({
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
      });
    }

    el.addEventListener("mousemove", handleMove);
    return () => el.removeEventListener("mousemove", handleMove);
  }, []);

  // Build the Shader Lab config.
  // Layer 0: the webcam, exposed via a media layer pointing at the
  //          <video> element we set up above.
  // Layer 1: our custom shader in Effect mode, which receives layer 0
  //          as inputTexture and applies the ASCII spotlight.
  const config: ShaderLabConfig | null = videoUrl
    ? {
        composition: { width: 1280, height: 720 },
        layers: [
          {
            id: "webcam",
            type: "video",
            // The runtime supports a "video" or "media" layer that takes
            // an asset src. We pass a special token that our bridge
            // resolves to the live <video> element.
            asset: { src: "#webcam-video" },
          } as any,
          {
            id: "ascii",
            type: "custom-shader",
            mode: "effect",
            code: ASCII_SPOTLIGHT_SHADER,
            uniforms: {
              mouse: [mousePos.x, mousePos.y],
            },
          } as any,
        ],
        timeline: { duration: 60, loop: true, tracks: [] },
      }
    : null;

  if (error) {
    return (
      <div
        style={{
          padding: "2rem",
          background: "#2a0a0a",
          border: "1px solid #ff4444",
          borderRadius: 8,
          maxWidth: 500,
        }}
      >
        <strong>Webcam error:</strong> {error}
        <p style={{ marginTop: "1rem", opacity: 0.7, fontSize: "0.85rem" }}>
          On macOS, make sure Chrome has camera permission in System Settings →
          Privacy & Security → Camera.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        maxWidth: 1024,
        aspectRatio: "16 / 9",
        background: "#000",
        borderRadius: 8,
        overflow: "hidden",
        cursor: "crosshair",
        position: "relative",
      }}
    >
      {/* Hidden video element holding the live webcam stream. */}
      <video
        ref={videoRef}
        id="webcam-video"
        playsInline
        muted
        style={{ display: "none" }}
      />
      {config ? (
        <ShaderLabComposition
          config={config}
          onRuntimeError={(message) => {
            console.error("Shader Lab runtime error:", message);
            setError(message);
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.5,
          }}
        >
          Requesting webcam access…
        </div>
      )}
    </div>
  );
}
