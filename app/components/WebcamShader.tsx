"use client";

import {
  ShaderLabComposition,
  type ShaderLabConfig,
} from "@basementstudio/shader-lab";
import { useState } from "react";

/**
 * Blue Steel / Y2K / Toonami / FFX-cutscene aesthetic.
 *
 * Layer order in shader-lab: index 0 is the TOP of the stack (drawn on
 * top), the LAST entry sits at the back. So the camera goes at the
 * BOTTOM of the array (last) and effects stack above it (earlier).
 */
const config: ShaderLabConfig = {
  layers: [
    // 1. Soft CRT — top-most polish (bloom + barrel).
    {
      blendMode: "normal",
      compositeMode: "filter",
      maskConfig: { invert: false, mode: "multiply", source: "luminance" },
      hue: 0,
      id: "crt-soft",
      kind: "effect",
      name: "Soft CRT",
      opacity: 0.85,
      params: {
        crtMode: "aperture-grille",
        cellSize: 4,
        scanlineIntensity: 0.05,
        maskIntensity: 0.25,
        barrelDistortion: 0.08,
        chromaticAberration: 1.4,
        beamFocus: 0.7,
        brightness: 1.35,
        highlightDrive: 1.2,
        highlightThreshold: 0.55,
        shoulder: 0.3,
        chromaRetention: 1.2,
        shadowLift: 0.18,
        persistence: 0.12,
        vignetteIntensity: 0.35,
        flickerIntensity: 0.04,
        glitchIntensity: 0,
        glitchSpeed: 0,
        signalArtifacts: 0.08,
        bloomEnabled: true,
        bloomIntensity: 2.4,
        bloomThreshold: 0.35,
        bloomRadius: 28,
        bloomSoftness: 0.45,
      },
      saturation: 1.05,
      type: "crt",
      visible: true,
    },

    // 2. ASCII — the main attraction.
    {
      blendMode: "normal",
      compositeMode: "filter",
      maskConfig: { invert: false, mode: "multiply", source: "luminance" },
      hue: 0,
      id: "ascii-main",
      kind: "effect",
      name: "ASCII",
      opacity: 1,
      params: {
        cellSize: 9,
        charset: "custom",
        customChars: " .:-=+*#%@",
        fontWeight: "bold",
        colorMode: "source",
        monoColor: "#cfe6ff",
        bgOpacity: 1,
        invert: false,
        toneMapping: "none",
        glyphSignalMode: "luminance",
        colorSignalMode: "luminance",
        signalBlackPoint: 0.05,
        signalWhitePoint: 0.95,
        signalGamma: 1.1,
        presenceThreshold: 0,
        presenceSoftness: 0,
        shimmerAmount: 0.15,
        shimmerSpeed: 1.2,
        directionBias: 0,
        bloomEnabled: true,
        bloomIntensity: 1.5,
        bloomThreshold: 0.55,
        bloomRadius: 8,
        bloomSoftness: 0.4,
      },
      saturation: 1,
      type: "ascii",
      visible: true,
    },

    // 3. Blue chrome gradient — color cast + wavy/swirly motion via
    //    high warp + vortex. Multiplied so ASCII glyphs pick up tint.
    {
      blendMode: "multiply",
      compositeMode: "filter",
      maskConfig: { invert: false, mode: "multiply", source: "luminance" },
      hue: 0,
      id: "blue-chrome",
      kind: "source",
      name: "Blue Chrome Tint",
      opacity: 0.65,
      params: {
        preset: "custom",
        activePoints: 4,
        point1Color: "#7fb8ff",
        point1Position: [-0.6, -0.7],
        point1Weight: 1.1,
        point2Color: "#1d4e8c",
        point2Position: [0.7, 0.4],
        point2Weight: 1.3,
        point3Color: "#9fd8ff",
        point3Position: [0.0, -0.2],
        point3Weight: 0.9,
        point4Color: "#0a1a3a",
        point4Position: [-0.4, 0.8],
        point4Weight: 1.0,
        point5Color: "#4a90d9",
        point5Position: [0.0, 0.0],
        point5Weight: 1.0,
        noiseType: "ridge",
        noiseSeed: 42.0,
        warpAmount: 0.85,
        warpScale: 2.2,
        warpIterations: 3,
        warpDecay: 0.85,
        warpBias: 0.4,
        vortexAmount: 0.55,
        animate: true,
        motionAmount: 1.0,
        motionSpeed: 0.5,
        falloff: 2.0,
        tonemapMode: "cinematic",
        glowStrength: 0.4,
        glowThreshold: 0.6,
        grainAmount: 0.05,
        vignetteStrength: 0.2,
        vignetteRadius: 1.6,
        vignetteSoftness: 0.9,
      },
      saturation: 1.2,
      type: "gradient",
      visible: true,
    },

    // 4. Bubbles — voronoi gradient with bright pinpoint highlights,
    //    screen-blended for floating-orb effect.
    {
      blendMode: "screen",
      compositeMode: "filter",
      maskConfig: { invert: false, mode: "multiply", source: "luminance" },
      hue: 0,
      id: "bubbles",
      kind: "source",
      name: "Bubbles",
      opacity: 0.6,
      params: {
        preset: "custom",
        activePoints: 5,
        point1Color: "#cdebff",
        point1Position: [-0.6, 0.3],
        point1Weight: 0.35,
        point2Color: "#9fd8ff",
        point2Position: [0.4, -0.1],
        point2Weight: 0.3,
        point3Color: "#ffffff",
        point3Position: [-0.1, 0.6],
        point3Weight: 0.25,
        point4Color: "#bfe4ff",
        point4Position: [0.7, 0.5],
        point4Weight: 0.32,
        point5Color: "#e8f6ff",
        point5Position: [-0.5, -0.4],
        point5Weight: 0.28,
        noiseType: "voronoi",
        noiseSeed: 17.0,
        warpAmount: 0.25,
        warpScale: 4.0,
        warpIterations: 2,
        warpDecay: 1.0,
        warpBias: 0.5,
        vortexAmount: 0.0,
        animate: true,
        motionAmount: 1.0,
        motionSpeed: 0.6,
        falloff: 4.0,
        tonemapMode: "cinematic",
        glowStrength: 0.6,
        glowThreshold: 0.5,
        grainAmount: 0,
        vignetteStrength: 0,
        vignetteRadius: 1.5,
        vignetteSoftness: 1,
      },
      saturation: 1,
      type: "gradient",
      visible: true,
    },

    // 5. Live Camera — base feed at the BOTTOM (last in array).
    {
      blendMode: "normal",
      compositeMode: "filter",
      maskConfig: { invert: false, mode: "multiply", source: "luminance" },
      hue: 0,
      id: "live-camera",
      kind: "source",
      name: "Live Camera",
      opacity: 1,
      params: {
        facingMode: "user",
        mirror: true,
        fitMode: "cover",
        scale: 1,
        offset: [0, 0],
      },
      saturation: 0.85,
      type: "live",
      visible: true,
    },
  ],
  timeline: { duration: 8, loop: true, tracks: [] },
} as any;

export default function WebcamShader() {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <div
        style={{
          padding: "2rem",
          background: "#2a0a0a",
          border: "1px solid #ff4444",
          borderRadius: 8,
          maxWidth: 600,
          fontFamily: "monospace",
          fontSize: "0.85rem",
        }}
      >
        <strong>Shader Lab error:</strong>
        <pre style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem" }}>
          {error}
        </pre>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1024,
        aspectRatio: "16 / 9",
        background: "#000",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <ShaderLabComposition
        config={config}
        onRuntimeError={(message) => {
          if (message === null || message === undefined) {
            setError(null);
            return;
          }
          console.error("Shader Lab runtime error:", message);
          setError(String(message));
        }}
      />
    </div>
  );
}