import type { Metadata } from "next";
import Image from "next/image";
import { Inter, Inter_Tight, Caveat, Kalam, Shadows_Into_Light, Dancing_Script, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-display",
});
const caveat = Caveat({ subsets: ["latin"], variable: "--font-hand" });
const kalam = Kalam({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-hand2",
});
const shadows = Shadows_Into_Light({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-hand3",
});
const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-script",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-admin",
});

export const metadata: Metadata = {
  title: {
    default: "Notely — Your notes. Done neatly.",
    template: "%s · Notely",
  },
  description:
    "Notely connects students who missed classes with trusted note writers who prepare, copy, organize and digitize notes — so you can spend your time learning.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${interTight.variable} ${caveat.variable} ${kalam.variable} ${shadows.variable} ${dancingScript.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        {/* Applies the saved theme before first paint — defaults to dark. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('notely-theme');if(t!=='light'){document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        {/* fixed site-wide backdrop: themed photo + grid + scrim
            (gold wave in dark mode, landscape sky in light mode) */}
        <div aria-hidden className="site-bg">
          <Image
            src="/bg-gold.jpg"
            alt=""
            fill
            className="hidden object-cover object-center opacity-40 dark:block"
          />
          <Image
            src="/bg-landscape.jpg"
            alt=""
            fill
            className="object-cover object-center opacity-30 dark:hidden"
          />
          <div className="site-bg-scrim" />
        </div>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
