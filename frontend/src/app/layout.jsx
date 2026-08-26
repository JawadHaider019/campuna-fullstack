import "./globals.css";
import AppShell from "./components/AppShell";

export const metadata = {
  title: "Campuna® – Dein Camping-Marktplatz",
  description: "Marktplatz für Wohnmobile, Wohnwagen & Campingzubehör",
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
    <html lang="de" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col bg-white text-charcoal">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
