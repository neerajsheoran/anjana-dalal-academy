import type { Metadata } from "next";
import { Geist } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CogniLift — Train how your child thinks",
    template: "%s | CogniLift",
  },
  description:
    "CogniLift trains your child's brain — Memory, Focus, Thinking — through games that use school content as the playground.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>
        {/* YouTube/GitHub-style top progress bar. Renders client-side
            on every nav change so the kid (and parent) feel something
            is happening even when MDX/Firestore is slow. Brand fuchsia,
            6px so it's clearly visible on phones (default 3px reads as
            a hair on small screens). */}
        <NextTopLoader
          color="#d946ef"
          height={6}
          showSpinner={false}
          shadow="0 0 10px #d946ef, 0 0 5px #d946ef"
          crawlSpeed={200}
          speed={400}
          easing="ease"
        />
        {children}
      </body>
    </html>
  );
}
