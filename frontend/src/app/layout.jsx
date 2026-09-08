import "./globals.css";
import AppShell from "./components/AppShell";
import { Toaster } from "react-hot-toast";

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
    <html lang="de" className="h-full antialiased font-sans" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-white text-charcoal">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
