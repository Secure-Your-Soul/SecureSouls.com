interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const host = url.host; // np. auth.securesouls.com
    const subdomain = host.split(".")[0].toLowerCase();

    // Szybka konfiguracja Twoich submodułów (wszystkie 11 repozytoriów)
    const apps: Record<string, { name: string; folder: string; desc: string }> =
      {
        hub: {
          name: "Souls Hub",
          folder: "Hub",
          desc: "Twoje centrum dowodzenia SoulEngine.",
        },
        auth: {
          name: "Souls Auth",
          folder: "Auth",
          desc: "Bezpieczne logowanie i autoryzacja dusz.",
        },
        pay: {
          name: "Souls Pay",
          folder: "Pay",
          desc: "Szybkie i bezpieczne płatności SoulEngine.",
        },
        blog: {
          name: "Souls Blog",
          folder: "Blog",
          desc: "Artykuły, nowości i kroniki ze świata dusz.",
        },
        dashboard: {
          name: "Souls Dashboard",
          folder: "Dashboard",
          desc: "Panel statystyk i zarządzania Twoim kontem.",
        },
        detector: {
          name: "Souls Detector",
          folder: "Detector",
          desc: "System wykrywania anomalii i analizy dusz.",
        },
        store: {
          name: "Souls Store",
          folder: "Store",
          desc: "Sklep z unikalnymi zasobami i ulepszeniami.",
        },
        souls: {
          name: "Souls Collection",
          folder: "Souls",
          desc: "Twoja prywatna kolekcja zebranych dusz.",
        },
        main: {
          name: "Souls Main",
          folder: "Main",
          desc: "Strona główna ekosystemu Secure-Your-Soul.",
        },
        error: {
          name: "Souls Error",
          folder: "Error",
          desc: "Coś poszło nie tak... ale dusza jest bezpieczna.",
        },
        deniskontek: {
          name: "DenisKontek",
          folder: "DenisKontek",
          desc: "Portfolio i projekty twórcy systemu.",
        },
      };

    // Wybieramy aplikację na podstawie subdomeny, jeśli nie ma - ładujemy Hub
    const app = apps[subdomain] || apps["error"];

    // 1. OBSŁUGA PLIKÓW (CSS, JS z kompilacji, Obrazki)
    // Jeśli ścieżka to plik (ma kropkę) lub szukasz w folderach zasobów
    if (
      url.pathname.includes(".") ||
      url.pathname.startsWith("/Styles") ||
      url.pathname.startsWith("/Scripts")
    ) {
      // Przekierowujemy do folderu submodułu: /Styles/Style.css -> /Auth/Styles/Style.css
      const internalPath = `/${app.folder}${url.pathname}`;
      const assetUrl = new URL(internalPath, url.origin);

      // Pobieramy plik z zasobów Cloudflare
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }

    // 2. SOULENGINE - GENEROWANIE DYNAMICZNEGO HTML (SEO & LANG)
    const lang = request.headers.get("accept-language")?.split(",")[0] || "pl";

    const head = `
      <title>${app.name}</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="${app.desc}">
      <meta name="generator" content="SoulEngine">
      
      <meta property="og:title" content="${app.name}">
      <meta property="og:url" content="https://${host}${url.pathname}">
      <meta property="og:image" content="https://${host}/Images/Banner.jpg">

      <link rel="stylesheet" href="/Styles/Style.css">
      <link rel="stylesheet" href="/Styles/loader.css">
      <script src="/index.js" defer></script> 
    `;

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>${head}</head>
<body>
    <header><h1>${app.name}</h1></header>
    <main>
        <div id="app-root">Ładowanie ${app.name}...</div>
    </main>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
      },
    });
  },
};
