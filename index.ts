interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}
const CONFIG: {
 Company: {
    name: string;
    legalName: string;
    domain: string;
  }
} = {
  Company: {
    name: "Souls", // Nazwa marki do wyświetlania w UI i Meta tagach
    legalName: "Denis Kontek - Souls", // Nazwa do stopki i dokumentów
    domain: ""
  }
};
const translations: { [key: string]: string } = {
  description: "Explore the Secure-Your-Soul ecosystem with Souls Main, Hub, Auth, Pay, Blog, Dashboard, Detector, Store, and Souls Collection.",
  keywords: "Souls, Secure-Your-Soul, SoulEngine, Souls Main, Souls Hub, Souls Auth, Souls Pay, Souls Blog, Souls Dashboard, Souls Detector, Souls Store, Souls Collection"
};
const mainPageTitles: Record<string, string> = {
  pl: "Strona Główna",
  en: "Main Page",
  de: "Startseite"
};
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const host = url.hostname;

    // Logika wykrywania: jeśli 2 człony -> main. Jeśli 3 -> subdomena.
    const parts = host.split(".");
    CONFIG.Company.domain = parts.length >= 2 ? parts.slice(-2).join(".") : host;
    const subdomain = parts.length > 2 ? parts[0].toLowerCase() : "main";
    const supportedLangs = ["pl", "en", "de"];
    const requestedLang = [url.pathname.split("/")[1]?.toLowerCase(), request.headers.get("Accept-Language")?.split(",")[0].split("-")[0].toLowerCase()].find(lang => supportedLangs.includes(lang || "")) || "en";
    const GlobalTranslations: { [key: string]: string } = {
      mainPage: mainPageTitles[requestedLang] || mainPageTitles.en,
    };
    const apps: Record<
      string,
      { name: string; folder: string; desc: string; color: string }
    > = {
      main: {
        name: "Souls Main",
        folder: "Main",
        desc: "Strona główna ekosystemu Secure-Your-Soul.",
        color: "#ffffff",
      },
      hub: {
        name: "Souls Hub",
        folder: "Hub",
        desc: "Twoje centrum dowodzenia SoulEngine.",
        color: "#00ff00",
      },
      auth: {
        name: "Souls Auth",
        folder: "Auth",
        desc: "Bezpieczne logowanie dusz.",
        color: "#4444ff",
      },
      pay: {
        name: "Souls Pay",
        folder: "Pay",
        desc: "Płatności SoulEngine.",
        color: "#ffff00",
      },
      blog: {
        name: "Souls Blog",
        folder: "Blog",
        desc: "Kroniki ze świata dusz.",
        color: "#ff00ff",
      },
      dashboard: {
        name: "Souls Dashboard",
        folder: "Dashboard",
        desc: "Panel zarządzania kontem.",
        color: "#00ffff",
      },
      detector: {
        name: "Souls Detector",
        folder: "Detector",
        desc: "Wykrywanie anomalii dusz.",
        color: "#ff4444",
      },
      store: {
        name: "Souls Store",
        folder: "Store",
        desc: "Sklep z zasobami.",
        color: "#ffa500",
      },
      souls: {
        name: "Souls Collection",
        folder: "Souls",
        desc: "Kolekcja zebranych dusz.",
        color: "#800080",
      },
      deniskontek: {
        name: "DenisKontek",
        folder: "DenisKontek",
        desc: "Portfolio twórcy systemu.",
        color: "#ffffff",
      },
      error: {
        name: "Souls Error",
        folder: "Error",
        desc: "Błąd systemu dusz.",
        color: "#ff0000",
      },
    };

    // Fallback do błędu, jeśli subdomena nie istnieje w rejestrze
    const app = apps[subdomain] || apps["error"];
    const method = request.method;
    const pathname = url.pathname;
    try {
      if(subdomain !== "api") {
        switch(method) {
          case "GET":
            // 1. GŁÓWNA STRONA
            if (pathname === "/" || pathname === "" || ["/", "", ...supportedLangs.map(l => `/${l}`), ...supportedLangs.map(l => `/${l}/`)].includes(pathname)) {
              const response = await env.ASSETS.fetch(
                new Request("http://internal" + `/${app.folder}/index.html`),
              );
    
              if (!response.ok) throw new Error(`Resource not found: ${pathname}`);
    
              let html = await response.text();
              let head = `
                <title>${app.name}</title>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link rel="preconnect" href="https://${host}" crossorigin>
                <link rel="dns-prefetch" href="https://${host}">
                <link rel="dns-prefetch" href="https://hub.${host}">
                <link rel="dns-prefetch" href="https://auth.${host}">
                 <!-- SEO -->
                <meta name="author" content="${CONFIG.Company.name}">
                <meta name="publisher" content="${CONFIG.Company.name}">
                <meta name="keywords" content="${app.name + ", " + translations.keywords}">
                <meta name="description" content="${app.desc}">
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
                <meta name="googlebot" content="index, follow">
                <meta name="bingbot" content="index, follow">
                <meta name="x-robots-tag" content="index, follow">
                <meta name="generator" content="SoulEngine">
                <meta name="application-name" content="${app.name}">
                <meta name="format-detection" content="telephone=no">
                <meta name="referrer" content="strict-origin-when-cross-origin">
                <!-- WYSZUKIWARKI MOBILNE -->
                <meta name="color-scheme" content="light dark">
                <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
                <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
                <meta name="mobile-web-app-capable" content="yes">
                <meta name="apple-mobile-web-app-capable" content="yes">
                <meta name="apple-mobile-web-app-status-bar-style" content="black">
                <!-- Site Verification -->
                <meta name="google-site-verification" content="93hkX3107xERxS7yS22_wTdYqGKXplswSnulvj47YVY">
                <meta name="msvalidate.01" content="57CAE5C2C0A38851C2F57008BDA9DD55" />
                <!-- OpenGraph (SOCIAL / DISCORD / FACEBOOK / LINKEDIN) -->
                <meta property="og:type" content="website">
                <meta property="og:title" content="${app.name}">
                <meta property="og:description" content="${app.desc}">
                <meta property="og:url" content="https://${host}${pathname}">
                <meta property="og:site_name" content="${app.name}">
                <meta property="og:image" content="https://${host}/Images/Banner.avif">
                <meta property="og:image:type" content="image/avif">
                <meta property="og:image" content="https://${host}/Images/Banner.jpg">
                <meta property="og:image:type" content="image/jpeg">
                <meta property="og:image:alt" content="${app.name} — Banner">
                <meta property="og:locale" content="${requestedLang}_${
                requestedLang === "en" ? "US" : requestedLang.toUpperCase()}">
                <meta property="og:updated_time" content="2025-11-13">
                <!-- Twitter Card (też pod Discord / Slack działa ładnie) -->
                <meta name="twitter:card" content="summary_large_image">
                <meta name="twitter:site" content="@TwojeKonto">
                <meta name="twitter:creator" content="@TwojeKonto">
                <meta name="twitter:title" content="${app.name}">
                <meta name="twitter:description" content="${app.desc}">
                <meta name="twitter:image" content="https://${host}/Images/Banner.jpg">
                <!-- Linkowanie -->
                <link rel="canonical" href="https://${host}${pathname}">
                <link rel="preload" href="/Styles/Style.css" as="style">
                <link rel="preload" href="/Styles/loader.css" as="style">
                <link rel="preload" href="/Scripts/index.js" as="script" crossorigin="anonymous">
                <link rel="preload" href="/Scripts/loader.js" as="script" crossorigin="anonymous">
                <noscript><link rel="stylesheet" href="/Styles/Style.css"></noscript>
                <link rel="stylesheet" href="/Styles/loader.css"/>
                <!-- Favicons + PWA icons (AVIF primary + PNG fallback) -->
                <link rel="icon" href="/favicon.ico" type="image/x-icon">
                <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
                <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
                <link rel="shortcut icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <meta name="apple-mobile-web-app-title" content="Souls" />
                <link rel="manifest" href="/site.webmanifest" />
                ${
                  host === `hub.${CONFIG.Company.domain}`
                    ? '<link rel="manifest" href="/manifest.json">'
                    : ""
                }
                <link rel="sitemap" type="application/xml" title="Sitemap" href="https://${
                  CONFIG.Company.domain
                }/sitemap.xml">`
              //hreflinks
              for (const lang of supportedLangs) head += `<link rel="alternate" href="https://${host}/${lang}" hreflang="${lang}">`;
              head += `
                <link rel="alternate" href="https://${host}" hreflang="x-default">
                <!-- Structured Data JSON-LD -->
                <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "Organization",
                  "name": "${CONFIG.Company.name}",
                  "url": "https://${CONFIG.Company.domain}",
                  "logo": "https://${CONFIG.Company.domain}/Images/Banner.avif",
                  "sameAs": [
                    "https://www.instagram.com/secureyoursouldrdk/",
                    "https://www.facebook.com/profile.php?id=61572904166776",
                    "https://github.com/Secure-Your-Soul",
                    "https://www.youtube.com/@SecureYourSoul-DenisKontek",
                    "https://www.patreon.com/c/SecureYourSoul",
                    "https://www.google.com/maps/place/Secure+Your+Soul/@50.2846894,18.5941279,730m/data=!3m2!1e3!4b1!4m6!3m5!1s0x47113bd6c3e070e9:0xed995583de623067!8m2!3d50.284686!4d18.5967028!16s%2Fg%2F11ybt7ch4y?entry=ttu&g_ep=EgoyMDI1MTAxNC4wIKXMDSoASAFQAw%3D%3D"
                  ]
                }
                </script>
    
                <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "WebSite",
                  "name": "${CONFIG.Company.name}",
                  "url": "https://${CONFIG.Company.domain}",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://${CONFIG.Company.domain}/search?query={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                }
                </script>
    
                <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "WebPage",
                  "name": "${app.name}",
                  "url": "https://${CONFIG.Company.domain}"
                }
                </script>
    
                <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    {
                      "@type": "ListItem",
                      "position": 1,
                      "name": "${GlobalTranslations.mainPage}",
                      "item": "https://${CONFIG.Company.domain}"
                    },
                    {
                      "@type": "ListItem",
                      "position": 2,
                      "name": "Denis Kontek",
                      "item": "https://deniskontek.${CONFIG.Company.domain}"
                    },
                    {
                      "@type": "ListItem",
                      "position": 3,
                      "name": "SecureStore",
                      "item": "https://securestore.${CONFIG.Company.domain}"
                    },
                    {
                      "@type": "ListItem",
                      "position": 4,
                      "name": "Blog",
                      "item": "https://blog.${CONFIG.Company.domain}"
                    },
                    {
                      "@type": "ListItem",
                      "position": 5,
                      "name": "SoulDetector",
                      "item": "https://souldetector.${CONFIG.Company.domain}"
                    }
                  ]
                }
                </script>
                
                <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "WebApplication",
                  "name": "SoulDetector",
                  "image": "https://${CONFIG.Company.domain}/Images/SoulDetector.avif",
                  "description": "Analiza tożsamości cyfrowej i wykrywanie manipulacji.",
                  "applicationCategory": "SecurityApplication",
                  "operatingSystem": "Any",
                  "browserRequirements": "Requires JavaScript",
                  "brand": {
                    "@type": "Brand",
                    "name": "${CONFIG.Company.name}"
                  },
                  "author": {
                    "@type": "Organization",
                    "name": "${CONFIG.Company.name}"
                  },
                  "offers": {
                      "@type": "Offer",
                      "price": "0",
                      "priceCurrency": "PLN",
                      "availability": "https://schema.org/InStock"
                    }
                }
                </script>`;
              html = html.replace("<html>", `<html lang="${requestedLang}">`)
              html = html.replace("</head>", head + "</head>");
              const startYear = 2023; // Rok założenia Twojego projektu/firmy
              const currentYear = new Date().getFullYear();
              const allRightsReserved: Record<string, string> = {
                pl: "Wszelkie prawa zastrzeżone.",
                en: "All rights reserved.",
                de: "Alle Rechte vorbehalten."
              };
              html = html.replace("</footer>", `&copy; ${currentYear > startYear ? `${startYear}–${currentYear}` : `${startYear}`} ${CONFIG.Company.legalName}. ${allRightsReserved[requestedLang] || allRightsReserved["en"]}` + "</footer>");
              return new Response(html.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").trim(), {
                headers: { "Content-Type": "text/html; charset=UTF-8" },
              });
            }
    
            // 2. PLIKI STATYCZNE (Dozwolone tylko te, które wskażesz)
            const allowedExtensions = [".js", ".css", ".png", ".jpg", ".jpeg", ".svg", ".avif", ".ico", ".webmanifest", ".xml"];
            if (allowedExtensions.some((ext) => pathname.endsWith(ext))) {
              const assetPath = `/${app.folder}${pathname}`.replace(/\/+/g, "/");
              return await env.ASSETS.fetch(
                new Request("http://internal" + assetPath),
              );
            }
            break;
          case "POST":
          default:
            return new Response("Method Not Allowed", { status: 405 });
        }
      } else {
        switch(method) {
          case "GET":
            break;
          case "POST":
            break;
          default:
            return new Response("Method Not Allowed", { status: 405 });
        }
      }

      // 3. BLOKADA DLA WSZYSTKIEGO INNEGO
      return new Response("Unauthorized or Not Found", { status: 404 });
    } catch (e: any) {
      // 4. OBSŁUGA BŁĘDÓW (Zwraca HTML zamiast białej strony)
      const response = await env.ASSETS.fetch(
        new Request("http://internal" + `/${apps["error"].folder}/index.html`),
      );

      if (!response.ok) throw new Error(`Resource not found: ${pathname}`);
    
      let html = await response.text();
      return new Response(html.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").trim(), {
        headers: { "Content-Type": "text/html; charset=UTF-8" },});
    }
  },
};
