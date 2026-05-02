import { Orbitron } from 'next/font/google'

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-orbitron',  // exposes it as a CSS variable
  display: 'swap',
})

export const metadata = {
  title: "Shader Lab Webcam",
  description: "Live webcam with shader effects",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={orbitron.variable}>  {/* ← add className */}
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#0a0a0a",
          color: "#fff",
          fontFamily: "var(--font-orbitron), system-ui, sans-serif",  // ← swap this
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
