import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

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
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
