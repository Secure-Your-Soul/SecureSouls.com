interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const host = url.host;

    // Logika wykrywania: jeśli 2 człony -> main. Jeśli 3 -> subdomena.
    const parts = host.split(".");
    const subdomain = parts.length > 2 ? parts[0].toLowerCase() : "main";

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

    try {
      let path = url.pathname;
      if (path === "/" || path === "") path = "/index.html";
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      const internalPath = `/${app.folder}${cleanPath}`.replace(/\/+/g, "/");
      const assetUrl = new URL(internalPath, url.origin);

      const response = await env.ASSETS.fetch(new Request(assetUrl, request));

      // Jeśli to plik HTML, wstrzykujemy do niego unikalne SEO
      if (
        response.ok &&
        response.headers.get("content-type")?.includes("text/html")
      ) {
        const originalHtml = await response.text();
        return this.injectMetadata(originalHtml, app, host, url.pathname);
      }

      // Jeśli plik nie istnieje w dist, rzucamy błąd do catch
      if (!response.ok) throw new Error(`Resource not found: ${path}`);

      return response;
    } catch (e: any) {
      return this.renderError(e.message, app);
    }
  },

  // INTELIGENTNY INJECTOR: Edytuje Head każdego index.html w locie
  injectMetadata(html: string, app: any, host: string, path: string): Response {
    const lang = "pl";
    const canonical = `https://${host}${path}`;
    const ogImage = `https://${host}/Images/Banner.jpg`;

    const headContent = `
      <title>${app.name}</title>
      <meta name="description" content="${app.desc}">
      <meta name="theme-color" content="${app.color}">
      <link rel="canonical" href="${canonical}">
      
      <meta property="og:type" content="website">
      <meta property="og:title" content="${app.name}">
      <meta property="og:description" content="${app.desc}">
      <meta property="og:url" content="${canonical}">
      <meta property="og:image" content="${ogImage}">
      <meta name="twitter:card" content="summary_large_image">

      <link rel="stylesheet" href="/Styles/Style.css">
      <script src="/index.js" defer></script>
    `;

    // Wstawiamy Head przed zamknięciem </head> w oryginalnym pliku
    const finalHtml = html
      .replace("</head>", `${headContent}</head>`)
      .replace("<html", `<html lang="${lang}"`);

    return new Response(finalHtml, {
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  },

  // PROFESJONALNY FALLBACK BŁĘDU
  renderError(msg: string, app: any): Response {
    const errorHtml = `<!DOCTYPE html>
    <html lang="pl">
    <head>
      <title>System Error | SoulEngine</title>
      <style>
        body { background: #0a0a0a; color: #ff4444; font-family: monospace; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .box { border: 1px solid #ff4444; padding: 20px; max-width: 80%; box-shadow: 0 0 20px rgba(255,0,0,0.2); }
        h1 { margin-top: 0; border-bottom: 1px solid #ff4444; padding-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>SOUL_ENGINE_CRITICAL_ERROR</h1>
        <p>Aplikacja: ${app.name}</p>
        <p>Status: PRZERWANY</p>
        <p>Log: ${msg}</p>
        <button onclick="location.href='https://securesouls.com'">POWRÓT DO MAIN</button>
      </div>
    </body>
    </html>`;
    return new Response(errorHtml, {
      status: 404,
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  },
};
