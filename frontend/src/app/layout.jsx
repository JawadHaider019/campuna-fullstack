import "./globals.css";
import AppShell from "./components/AppShell";
import { Toaster } from "react-hot-toast";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://campuna.de';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Campuna | Camping-Marktplatz: Kaufen, Verkaufen, Entdecken",
    template: "%s | Campuna"
  },
  description: "Wohnmobile, Wohnwagen, Zubehör, Zelte, Stellplätze, Tiny Houses, Boote, Vermietung und Services: die ganze Camping-Welt an einem Ort. Privat kostenlos.",
  keywords: [
    "camping marktplatz",
    "camping kaufen",
    "camping verkaufen",
    "wohnmobile",
    "wohnwagen",
    "camping zubehör",
    "zelte",
    "stellplätze",
    "campingplätze",
    "tiny houses",
    "boote",
    "camping services",
    "kostenlos inserieren"
  ],
  authors: [{ name: "Campuna" }],
  creator: "Campuna",
  publisher: "Campuna",
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
  },
  alternates: {
    canonical: "https://campuna.de/",
    languages: {
      "de": "https://campuna.de/",
      "x-default": "https://campuna.de/",
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: siteUrl,
    siteName: "Campuna",
    title: "Campuna | Camping-Marktplatz: Kaufen, Verkaufen, Entdecken",
    description: "Die ganze Camping-Welt an einem Ort: Wohnmobile, Wohnwagen, Zubehör, Zelte, Stellplätze, Tiny Houses, Boote, Vermietung und Camping-Services.",
    images: [
      {
        url: "/assets/og/campuna-og-startseite.jpg",
        width: 1200,
        height: 630,
        alt: "Campuna Camping Marktplatz",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Campuna | Camping-Marktplatz: Kaufen, Verkaufen, Entdecken",
    description: "Die ganze Camping-Welt an einem Ort: Wohnmobile, Wohnwagen, Zubehör, Zelte, Stellplätze, Tiny Houses, Boote, Vermietung und Camping-Services.",
    images: ["/assets/og/campuna-og-startseite.jpg"],
  },
  icons: {
    icon: [
      { url: "/fav.webp", type: "image/webp" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/fav.webp",
    apple: "/fav.webp",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className="h-full antialiased font-sans" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-white text-charcoal" suppressHydrationWarning>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
