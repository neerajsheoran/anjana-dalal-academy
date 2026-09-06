import type { Metadata } from "next";
import { Geist } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const TITLE = "CogniLift — Train how your child thinks";
const DESCRIPTION =
  "CogniLift trains your child's brain — Memory, Focus, Thinking — through games that use school content as the playground.";

export const metadata: Metadata = {
  // Required for Open Graph / Twitter image URLs to resolve absolutely.
  // Without it Next emits relative URLs, which WhatsApp and Facebook cannot
  // fetch — shared links render with no preview card at all. That matters
  // here because parent-to-parent WhatsApp sharing is a primary channel.
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | CogniLift",
  },
  description: DESCRIPTION,
  applicationName: "CogniLift",
  openGraph: {
    type: "website",
    siteName: "CogniLift",
    locale: "en_IN",
    url: "/",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
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
