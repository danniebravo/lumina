# LÚMINA · v2

Landing rediseñada de Lúmina — HTML + CSS + JS vanilla, sin build step.

## Correr en local

```bash
python -m http.server 8000
```

Después → http://localhost:8000

## Estructura

```
lumina-mockups/
├── index.html          markup
├── css/styles.css      todo el CSS
├── js/script.js        todo el JS (cargado con defer)
├── img/
│   ├── logo/           lumina-logo.png, lumina-logo-mono-ivory.png
│   ├── atmosfera/      6.{jpeg,webp}, 8.{jpeg,webp} (hero + cierre)
│   └── lugares/        malaga, claustro, epico, terracota + galerías
└── docs/               spec del rediseño y screenshots de referencia
```

## Lighthouse

| Modo | Perf | A11y | Best Practices | SEO |
|---|---|---|---|---|
| Desktop | 99 | 100 | 100 | 100 |
| Mobile  | 91 | 100 | 100 | 100 |
