import Hero from "./components/Hero";
import CategoriesSection from "./components/CategoriesSection";
import Listing from "./components/Listing";
import FeaturedShowcaseSection from "./components/FeaturedShowcaseSection";
import Providers from "./components/Providers";
import WhyCampuna from "./components/WhyCampuna";
import BlogSection from "./components/BlogSection";
import FaqSection from "./components/FaqSection";
import CTA from "./components/CTA";
import ScrollSectionWrapper from "./components/ScrollSectionWrapper";

// Schema 1: Organization
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://campuna.de/#organization",
  "name": "Campuna",
  "url": "https://campuna.de/",
  "logo": "https://campuna.de/assets/logo/campuna-logo.png",
  "description": "Campuna ist der Camping-Marktplatz für Deutschland: Wohnmobile, Wohnwagen, Zelte, Zubehör, Stellplätze, Tiny Houses und Camping-Services kaufen und verkaufen.",
  "email": "info@campuna.de",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Erfurt",
    "addressRegion": "Thüringen",
    "addressCountry": "DE"
  },
  "sameAs": [
    "https://www.facebook.com/profile.php?id=61580574896053",
    "https://www.instagram.com/campuna.de/",
    "https://www.tiktok.com/@campuna.de",
    "https://www.youtube.com/@campuna?si=YU8ngbf058KMRVy0"
  ]
};

// Schema 2: WebSite + SearchAction (Sitelinks search box)
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://campuna.de/#website",
  "url": "https://campuna.de/",
  "name": "Campuna",
  "publisher": { "@id": "https://campuna.de/#organization" },
  "inLanguage": "de-DE",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://campuna.de/suche?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

// Schema 3: FAQPage (7 questions identical to on-page copy)
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://campuna.de/#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Was ist Campuna?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Campuna ist ein Camping-Marktplatz aus Deutschland, der Angebote, Anbieter und Wissen rund ums Camping an einem Ort bündelt. Du findest hier Wohnmobile, Wohnwagen, Zelte, Zubehör, Stellplätze, Tiny Houses und Camping-Services, von privat und vom Händler. Betrieben wird die Plattform von Campern aus Erfurt."
      }
    },
    {
      "@type": "Question",
      "name": "Für wen ist Campuna geeignet?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Campuna richtet sich an alle, die campen: an Einsteiger und erfahrene Camper, an private Käufer und Verkäufer sowie an gewerbliche Anbieter wie Händler, Vermieter, Werkstätten und Campingplätze. Privatpersonen inserieren kostenlos, gewerbliche Anbieter präsentieren ihr Angebot mit einem eigenen Firmenprofil."
      }
    },
    {
      "@type": "Question",
      "name": "Wie kann ich auf Campuna verkaufen?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Erstelle ein kostenloses Konto, lege dein Inserat mit Fotos, Beschreibung und Preis an und veröffentliche es. Interessenten melden sich direkt über die Plattform bei dir. Den Verkauf wickelst du persönlich ab, ohne Provision an Campuna. Eine Schritt-für-Schritt-Anleitung findest du unter So funktioniert Campuna."
      }
    },
    {
      "@type": "Question",
      "name": "Kostet das Inserieren auf Campuna etwas?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Private Inserate sind auf Campuna kostenlos, ohne Provision und ohne versteckte Gebühren. Gewerbliche Anbieter wählen ein Paket, mit dem sie mehrere Angebote und ein eigenes Firmenprofil verwalten können. Alle Details und Preise findest du auf unserer Preisseite."
      }
    },
    {
      "@type": "Question",
      "name": "Was kann ich auf Campuna anbieten?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Alles rund ums Camping: Wohnmobile, Camper und Wohnwagen, Zelte und Dachzelte, Campingzubehör, Fahrräder und Träger, Stellplätze und Campingplätze, Tiny Houses, Boote und Wassersport sowie Camping-Services wie Gasprüfung, Werkstatt oder Aufbereitung. Auch Miet- und Vermietungsangebote haben eine eigene Kategorie."
      }
    },
    {
      "@type": "Question",
      "name": "Wie finde ich passende Camping-Angebote?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Nutze die Suche auf der Startseite und filtere nach Kategorie, Ort und Preis. Mit der Umkreissuche findest du Angebote in deiner Nähe und in ganz Deutschland. Zusätzlich helfen dir die neun Kategorien, der Campuna-Ratgeber und unsere Rechner bei der Auswahl."
      }
    },
    {
      "@type": "Question",
      "name": "Wie sicher ist das Kaufen und Verkaufen von privat?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Campuna setzt auf direkte Kommunikation zwischen Käufer und Verkäufer und klare Regeln für sicheres Handeln. Wir empfehlen bei Fahrzeugen immer Besichtigung, Probefahrt und einen schriftlichen Kaufvertrag. Praktische Tipps dazu findest du im Ratgeber und auf der Seite Sicher handeln."
      }
    }
  ]
};

export default function Home() {
  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="overflow-x-hidden">
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. Docked Categories Carousel */}
        <ScrollSectionWrapper delay={0.1}>
          <CategoriesSection isDocked={true} showHeader={false} />
        </ScrollSectionWrapper>

        {/* 3. Marketplace Live Listings */}
        <ScrollSectionWrapper delay={0.05}>
          <Listing />
        </ScrollSectionWrapper>

        {/* 4. Provider / Partner Spotlight */}
        <ScrollSectionWrapper delay={0.05}>
          <Providers />
        </ScrollSectionWrapper>

        {/* 5. Featured Weekly Showcase */}
        <ScrollSectionWrapper delay={0.05}>
          <FeaturedShowcaseSection />
        </ScrollSectionWrapper>

        {/* 6. Why Campuna (USP & Trust Pillars) */}
        <ScrollSectionWrapper delay={0.05}>
          <WhyCampuna />
        </ScrollSectionWrapper>

        {/* 7. Blog & Camping Guides */}
        <ScrollSectionWrapper delay={0.05}>
          <BlogSection />
        </ScrollSectionWrapper>

        {/* 8. Registration / Seller CTA */}
        <ScrollSectionWrapper delay={0.05}>
          <CTA />
        </ScrollSectionWrapper>

        {/* 9. FAQ Section */}
        <ScrollSectionWrapper delay={0.05}>
          <FaqSection />
        </ScrollSectionWrapper>
      </div>
    </>
  );
}
