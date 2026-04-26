import WebcamShader from "./components/WebcamShader";

export default function Home() {
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
      <h1 style={{ marginBottom: "1rem", fontWeight: 300 }}>
        Webcam ASCII Spotlight
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
        Move your mouse over the video. Inside the circle = live ASCII art.
        Outside = your raw webcam feed.
      </p>
      <WebcamShader />
    </main>
  );
}
