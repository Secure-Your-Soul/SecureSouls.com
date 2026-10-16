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
    legalName: "Denis Kontek | Souls", // Nazwa do stopki i dokumentów
    domain: "" // Automatycznie wykrywana z hosta (np. secure.securesouls.com -> securesouls.com)
  }
};
const startYear = 2023; // Rok założenia Twojego projektu/firmy
let cachedYear = new Date().getFullYear();
let lastCheck = Date.now();
async function renderError(env: any, lang: string, errorKey: string, status: number, cachedTranslations?: any, debugMessage?: string): Promise<Response> {
  // 1. Pobieramy tylko HTML (bo JSON-a już mamy lub zaraz dostaniemy)
  const res = await env.ASSETS.fetch(new Request("http://internal/Error/index.html"));
  
  let html = res.ok ? await res.text() : "Critical Error";
  
  // 2. Jeśli nie przekazaliśmy tłumaczeń w argumencie, spróbujmy je pobrać awaryjnie
  let translations = cachedTranslations;
  if (!translations) {
    const locRes = await env.ASSETS.fetch(new Request(`http://internal/Assets/Locales/${lang}.json`));
    translations = locRes.ok ? await locRes.json() : {};
  }

  if (res.ok) {
    // 2. Pobieramy konkretne teksty z JSON-a
    const errorTitle = translations.error?.title || "Error";
    // Jeśli mamy debugMessage, doklejamy go do wiadomości błędu
    const errorMessage = (translations.error?.[errorKey] || "An unexpected error occurred.") + 
                         (debugMessage ? `<br><small style="color:red">${debugMessage}</small>` : "");
    const errorPage = translations.error?.errorPage || "Error Page";

    // 3. Wstrzykujemy gotowe teksty prosto w HTML (zastępujemy tagi)
    html = html
      .replace("<head>", `<title>${errorPage}</title>`)
      .replace(/<h1 data-i18n="error.errorPage"><\/h1>/, `<h1>${errorPage}</h1>`)
      .replace(/<h2 data-i18n="error.title"><\/h2>/, `<h2>${errorTitle}</h2>`)
      .replace(/<p data-i18n="error.description"><\/p>/, `<p>${errorMessage}</p>`)
      .replace("</footer>", `&copy; ${cachedYear > startYear ? `${startYear}–${cachedYear}` : `${startYear}`} ${CONFIG.Company.legalName}. ${translations.common.allRightsReserved}` + "</footer>")
      // Sprzątanie
      .replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").trim();
  }

  return new Response(html, {
    status: status,
    headers: { "Content-Type": "text/html; charset=UTF-8", "Content-Language": lang }
  });
}
// 1. Pobieramy listę wspieranych języków prosto z pliku langs
const supportedLangs: string[] = ["pl", "en", "de"];
// To siedzi w pamięci RAM instancji Workera
const translationCache = new Map<string, any>();
let isPreloaded = false; // Flaga, żeby nie odpalać pętli przy każdym wejściu
async function preloadTranslations(env: Env) {
  if (isPreloaded) return;

  // Pobieramy wszystko naraz równolegle (Promise.all jest szybszy niż pętla for z await)
  await Promise.all(supportedLangs.map(async (lang) => {
    try {
      const res = await env.ASSETS.fetch(new Request(`http://internal/Assets/Locales/${lang}.json`));
      if (res.ok) {
        translationCache.set(lang, await res.json());
      }
    } catch (e) {
      console.error(`Błąd preloadu: ${lang}`);
    }
  }));

  isPreloaded = true;
  console.log("Preload ukończony. Załadowane języki:", Array.from(translationCache.keys()).join(", "));
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!isPreloaded) await preloadTranslations(env);
    const now = Date.now();
    
    // Odśwież rok tylko jeśli minęło więcej niż 24 godziny od ostatniego sprawdzenia
    if (now - lastCheck > 86400000) { 
      cachedYear = new Date().getFullYear();
      lastCheck = now;
    }

    const currentYear = cachedYear;
    const url = new URL(request.url);
    const host = url.hostname;
    
    // Logika wykrywania: jeśli 2 człony -> main. Jeśli 3 -> subdomena.
    const parts = host.split(".");
    CONFIG.Company.domain = parts.length >= 2 ? parts.slice(-2).join(".") : host;
    const subdomain = parts.length > 2 ? parts[0].toLowerCase() : "main";
    const capitalizedSubdomain = subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
    // 2. Wykrywanie języka użytkownika
    const requestedLang = [url.pathname.split("/")[1]?.toLowerCase(), request.headers.get("Accept-Language")?.split(",")[0].split("-")[0].toLowerCase()].find(lang => supportedLangs.includes(lang || "")) || "en";
    // 3. Wczytujemy plik tłumaczeń.
    const translations = translationCache.get(requestedLang) || translationCache.get("en");

    // Fallback do błędu, jeśli subdomena nie istnieje w rejestrze
    const app = translations[subdomain] || translations["error"];
    const method = request.method;
    const pathname = url.pathname;
    try {
      if(subdomain !== "api") {
        switch(method) {
          case "GET":
            // 1. GŁÓWNA STRONA
            if (pathname === "/" || pathname === "" || ["/", "", ...supportedLangs.map(l => `/${l}`), ...supportedLangs.map(l => `/${l}/`)].includes(pathname)) {
              const response = await env.ASSETS.fetch(
                new Request("http://internal" + `/${capitalizedSubdomain}/index.html`),
              );
    
              if (!response.ok) throw new Error(`Resource not found: ${pathname}`);
    
              let html = await response.text();
              let head = `
                <title>${app.title}</title>
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
                <meta name="keywords" content="${app.title + ", " + translations.keywords}">
                <meta name="description" content="${app.description}">
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
                <meta name="googlebot" content="index, follow">
                <meta name="bingbot" content="index, follow">
                <meta name="x-robots-tag" content="index, follow">
                <meta name="generator" content="SoulEngine">
                <meta name="application-name" content="${app.title}">
                <meta name="format-detection" content="telephone=no">
                <meta name="referrer" content="strict-origin-when-cross-origin">
                <!-- WYSZUKIWARKI MOBILNE -->
                <meta name="color-scheme" content="light dark">
                <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
                <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
                <meta name="mobile-web-app-capable" content="yes">
                <meta name="apple-mobile-web-app-capable" content="yes">
                <meta name="apple-mobile-web-app-status-bar-style" content="black">
                <!-- OpenGraph (SOCIAL / DISCORD / FACEBOOK / LINKEDIN) -->
                <meta property="og:type" content="website">
                <meta property="og:title" content="${app.title}">
                <meta property="og:description" content="${app.description}">
                <meta property="og:url" content="https://${host}${pathname}">
                <meta property="og:site_name" content="${app.title}">
                <meta property="og:image" content="https://${host}/Assets/Images/Banner.avif">
                <meta property="og:image:type" content="image/avif">
                <meta property="og:image" content="https://${host}/Assets/Images/Banner.jpg">
                <meta property="og:image:type" content="image/jpeg">
                <meta property="og:image:alt" content="${app.title} — Banner">
                <meta property="og:locale" content="${requestedLang}_${
                requestedLang === "en" ? "US" : requestedLang.toUpperCase()}">
                <meta property="og:updated_time" content="2025-11-13">
                <!-- Twitter Card (też pod Discord / Slack działa ładnie) -->
                <meta name="twitter:card" content="summary_large_image">
                <meta name="twitter:site" content="@">
                <meta name="twitter:creator" content="@">
                <meta name="twitter:title" content="${app.title}">
                <meta name="twitter:description" content="${app.description}">
                <meta name="twitter:image" content="https://${host}/Assets/Images/Banner.jpg">
                <!-- Linkowanie -->
                <link rel="canonical" href="https://${host}${pathname}">
                <link rel="preload" href="/Styles/Style.css" as="style">
                <link rel="preload" href="/Styles/loader.css" as="style">
                <link rel="preload" href="/Scripts/index.js" as="script">
                <link rel="preload" href="/Scripts/loader.js" as="script">
                <noscript><link rel="stylesheet" href="/Styles/Style.css"></noscript>
                <link rel="stylesheet" href="/Styles/Style.css">
                <link rel="stylesheet" href="/Styles/loader.css">
                <!-- Favicons + PWA icons (AVIF primary + PNG fallback) -->
                <link rel="icon" href="/Assets/Images/favicon.ico" type="image/x-icon">
                <link rel="icon" type="image/png" href="/Assets/Images/favicon-96x96.png" sizes="96x96">
                <link rel="icon" type="image/svg+xml" href="/Assets/Images/favicon.svg">
                <link rel="shortcut icon" href="/Assets/Images/favicon.ico" />
                <link rel="apple-touch-icon" sizes="180x180" href="/Assets/Images/apple-touch-icon.png">
                <meta name="apple-mobile-web-app-title" content="Souls">
                <link rel="manifest" href="/site.webmanifest">
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
                  "name": "${app.title}",
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
                      "name": "${translations.mainPage}",
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
                </script>
                <script src="/Scripts/index.js" defer></script>`;
              html = html.replace("<html>", `<html lang="${requestedLang}">`)
              html = html.replace("</head>", head + "</head>");
              html = html.replace("</footer>", `&copy; ${currentYear > startYear ? `${startYear}–${currentYear}` : `${startYear}`} ${CONFIG.Company.legalName}. ${translations.common.allRightsReserved}` + "</footer>");
              return new Response(html.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").trim(), {
                headers: { "Content-Type": "text/html; charset=UTF-8", "Content-Language": requestedLang,
                  // To mówi przeglądarce: "Zacznij ssać JSONa zanim w ogóle przeczytasz JS!"
                  "Link": `</Assets/Locales/${requestedLang}.json>; rel=preload; as=fetch; crossorigin`},
              });
            }
    
            // 2. PLIKI STATYCZNE (Dozwolone tylko te, które wskażesz)
            const allowedExtensions = [".js", ".css", ".png", ".jpg", ".jpeg", ".svg", ".avif", ".ico", ".webmanifest", ".xml", ".json"];
            if (allowedExtensions.some((ext) => pathname.endsWith(ext))) {
              const assetPath = `/${capitalizedSubdomain}${pathname}`.replace(/\/+/g, "/");
              return await env.ASSETS.fetch(
                new Request("http://internal" + assetPath),
              );
            }
            break;
          case "POST":
          default:
            return await renderError(env, requestedLang, "unauthorized", 405);
            break;
        }
      } else {
        switch(method) {
          case "GET":
            break;
          case "POST":
            break;
          default:
            return await renderError(env, requestedLang, "unauthorized", 405);
            break;
        }
      }

      // 3. BLOKADA DLA WSZYSTKIEGO INNEGO
      return await renderError(env, requestedLang, "notFound", 404);

} catch (e: any) {
  // --- BLOK 4: BŁĘDY KODU / SERWERA ---
  console.error(e); // Warto widzieć co walnęło w logach
  const errorTrans = translationCache.get(requestedLang) || translationCache.get("en");
  return await renderError(env, requestedLang, "serverError", 500, errorTrans, e.message);
}
  },
};
