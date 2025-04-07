const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync('bd.json', 'utf-8'));
const outputDir = path.join(__dirname, 'projects'); // Cambiado a inglés

// Crear directorio si no existe
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// slugify = normalizar
const slugify = (str) =>
  str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9 -]/g, "") // solo alfanumérico
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

// Escapar HTML para evitar inyección XSS
const escapeHTML = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Formatear fecha para Schema.org
const formatDate = (dateString) => {
  if (!dateString) return new Date().toISOString().split('T')[0];
  
  // Si ya es una fecha ISO, la devolvemos tal cual
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) return dateString;
  
  // Intentamos convertir otros formatos
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};


const generateHTML = (proyecto) => {
  const id = proyecto.id;

  const titleEN = escapeHTML(proyecto.title?.en || `Project ${id}`);
  const titleES = escapeHTML(proyecto.title?.es || titleEN);
  
  const descEN = escapeHTML(proyecto.description?.en || '');
  const descES = escapeHTML(proyecto.description?.es || descEN);
  
  const shortDescEN = escapeHTML(proyecto.shortDescription?.en || '');
  const shortDescES = escapeHTML(proyecto.shortDescription?.es || shortDescEN);
  
  const tagsEN = [...new Set(proyecto.tags?.en || [])].map(escapeHTML);
  const tagsES = [...new Set(proyecto.tags?.es || [])].map(escapeHTML);
  
  const tagsENString = tagsEN.join(', ');
  const tagsESString = tagsES.join(', ');
  
  // English slug for priority
  const slug = slugify(titleEN);
  const canonical = `https://cletus2000.github.io/projects/${slug}.html`;
  const projectUrl = `https://cletus2000.github.io/projects.html?${id}`; // Redirijimos a la URL con el parámetro del proyecto
  
  // Image handling
  const thumbnailUrl = `https://cletus2000.github.io${proyecto.thumbnail.replace('.', '')}`;
  const images = proyecto.images?.map(img => `https://cletus2000.github.io${img.replace('.', '')}`) || [];
  
  const formattedDate = formatDate(proyecto.date);

  // Generar marcado JSON-LD para Schema.org (técnica avanzada de SEO)
  const jsonLD = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": titleEN,
    "alternativeHeadline": titleES,
    "description": descEN,
    "abstract": shortDescEN,
    "datePublished": formattedDate,
    "dateModified": new Date().toISOString().split('T')[0],
    "image": [thumbnailUrl, ...images],
    "url": canonical,
    "keywords": tagsEN.join(", "),
    "author": {
      "@type": "Person",
      "name": "Carlos Rocamora",
      "alternateName": "Cletus2000",
      "url": "https://cletus2000.github.io"
    },
    "inLanguage": ["en", "es"],
    "genre": tagsEN.join(", ")
  };

  // Generar marcado BreadcrumbList para SEO (navegación estructurada)
  const breadcrumbLD = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Portfolio",
        "item": "https://cletus2000.github.io"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Projects",
        "item": "https://cletus2000.github.io/projects.html"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": titleEN,
        "item": canonical
      }
    ]
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${titleEN} | ${titleES} | Carlos Rocamora (Cletus2000) Portfolio</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- SEO Metatags Optimized -->
  <meta name="description" content="${shortDescEN || descEN.substring(0, 155)}">
  <meta name="keywords" content="${tagsENString}, ${tagsESString}">
  <meta name="author" content="Carlos Rocamora (Cletus2000)">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="rating" content="general">
  <meta name="language" content="en, es">
  
  <!-- SEO Avanzado -->
  <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <meta name="google" content="notranslate">
  <meta name="format-detection" content="telephone=no">
  <meta name="theme-color" content="#ffffff">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="application-name" content="Carlos Rocamora Portfolio">
  
  <!-- Canonical - Crucial para SEO -->
  <link rel="canonical" href="${canonical}">
  
  <!-- Recursos clave (precarga) -->
  <link rel="preload" href="${thumbnailUrl}" as="image">
  
  <!-- Open Graph (Facebook, LinkedIn) -->
  <meta property="og:title" content="${titleEN}">
  <meta property="og:description" content="${shortDescEN || descEN.substring(0, 155)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${thumbnailUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="en_US">
  <meta property="og:locale:alternate" content="es_ES">
  <meta property="og:site_name" content="Carlos Rocamora Portfolio">
  <meta property="og:article:published_time" content="${formattedDate}">
  <meta property="og:article:modified_time" content="${new Date().toISOString().split('T')[0]}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${titleEN}">
  <meta name="twitter:description" content="${shortDescEN || descEN.substring(0, 155)}">
  <meta name="twitter:image" content="${thumbnailUrl}">
  <meta name="twitter:site" content="@Cletus_2000">
  <meta name="twitter:creator" content="@Cletus_2000">
  
  <!-- Marcado JSON-LD para Schema.org (Estructurado) -->
  <script type="application/ld+json">
    ${JSON.stringify(jsonLD, null, 2)}
  </script>
  
  <!-- Marcado de navegación para SEO -->
  <script type="application/ld+json">
    ${JSON.stringify(breadcrumbLD, null, 2)}
  </script>
  
  <!-- Favicon -->
  <link rel="icon" href="/favicon.ico" type="image/x-icon">
  <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">
  
  <!-- Redirección instantánea -->
  <script>
    window.location.href = "${projectUrl}";
  </script>
</head>
<body>
  <!-- Contenido SEO (visible para bots) -->
  <div>
    <main itemscope itemtype="https://schema.org/CreativeWork">
      <article>
        <h1 itemprop="name">${titleEN}</h1>
        <p><strong>Español:</strong> ${titleES}</p>
        
        <div itemprop="description">
          ${descEN}
        </div>
        
        <div lang="es">
          ${descES}
        </div>
        
        <section>
          <h2>Project Details</h2>
          <dl>
            <dt>Date</dt>
            <dd itemprop="datePublished">${formattedDate}</dd>
            
            <dt>Categories</dt>
            <dd>
              <ul>
                ${tagsEN.map(tag => `<li itemprop="keywords">${tag}</li>`).join('\n                ')}
              </ul>
            </dd>
          </dl>
        </section>
        
        ${proyecto.images && proyecto.images.length > 0 ? `
        <section>
          <h2>Images</h2>
          <div>
            ${proyecto.images.map((img, idx) => `
              <figure>
                <img itemprop="image" src="https://cletus2000.github.io${img.replace('.', '')}" alt="${titleEN} - Image ${idx + 1}" loading="lazy">
              </figure>
            `).join('\n            ')}
          </div>
        </section>
        ` : ''}
        
        <a href="${projectUrl}" itemprop="url">See interactive project</a>
        <a href="${projectUrl}" hreflang="es" itemprop="url">Ver proyecto interactivo</a>
        
        <meta itemprop="inLanguage" content="en, es">
      </article>
    </main>
  </div>
</body>
</html>`;
};

// Generar archivos HTML
data.forEach((proyecto) => {
  try {
    const titleEN = proyecto.title?.en || `Project ${proyecto.id}`;
    const slug = slugify(titleEN);
    const filename = path.join(outputDir, `${slug}.html`);
    const html = generateHTML(proyecto);
    
    fs.writeFileSync(filename, html, 'utf-8');
    console.log(`✅ Generated: ${slug}.html`);
  } catch (error) {
    console.error(`❌ Error generating HTML for project ID ${proyecto.id}:`, error.message);
  }
});

console.log(`\n🚀 ${data.length} HTML files generated in ${outputDir}`);