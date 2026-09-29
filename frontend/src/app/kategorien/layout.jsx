export const metadata = {
    title: "Alle Camping-Kategorien im Überblick | Campuna",
    description: "Neun Kategorien, ein Marktplatz: Wohnmobile, Zelte, Zubehör, Stellplätze, Tiny Houses, Boote und mehr. Entdecke alle Camping-Kategorien auf Campuna.",
    alternates: {
        canonical: "https://campuna.de/kategorien"
    },
    openGraph: {
        type: "website",
        locale: "de_DE",
        url: "https://campuna.de/kategorien",
        title: "Alle Camping-Kategorien im Überblick | Campuna",
        description: "Neun Kategorien, ein Marktplatz: Wohnmobile, Zelte, Zubehör, Stellplätze, Tiny Houses, Boote und mehr.",
        images: [
            {
                url: "/assets/og/campuna-og-kategorien.jpg",
                width: 1200,
                height: 630,
                alt: "Alle Camping-Kategorien auf Campuna"
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "Alle Camping-Kategorien im Überblick | Campuna",
        description: "Neun Kategorien, ein Marktplatz: Wohnmobile, Zelte, Zubehör, Stellplätze, Tiny Houses, Boote und mehr.",
        images: ["/assets/og/campuna-og-kategorien.jpg"]
    }
};

export default function KategorienLayout({ children }) {
    return children;
}
