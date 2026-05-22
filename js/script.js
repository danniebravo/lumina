(() => {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     1. Progress bar
  ---------------------------------------------------------- */
  const bar = document.getElementById("bar");
  document.addEventListener("scroll", () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0;
    bar.style.width = p + "%";
  }, { passive: true });

  /* ----------------------------------------------------------
     2. IntersectionObserver — fade-in & stepper sync
  ---------------------------------------------------------- */
  const sections = document.querySelectorAll(".step, .lugares, .closing, .hero");
  const stepperLinks = document.querySelectorAll(".stepper a");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        const id = e.target.id;
        stepperLinks.forEach(a => {
          a.classList.toggle("active", a.getAttribute("href") === "#" + id);
        });
      }
    });
  }, { threshold: 0.35 });
  sections.forEach((s) => io.observe(s));

  /* ----------------------------------------------------------
     3. Mobile menu
  ---------------------------------------------------------- */
  const burger = document.getElementById("nav-burger");
  const nav = document.querySelector(".nav");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll(".nav-links a").forEach(a => {
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ----------------------------------------------------------
     4. Hero · luciérnagas (canvas)
  ---------------------------------------------------------- */
  if (!reduceMotion) (() => {
    const cv = document.getElementById("fireflies");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const mouse = { x: -9999, y: -9999, active: false };
    const flies = [];
    const FALLERS = [];

    function resize() {
      const r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 36;
    function makeFly() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: 2 + Math.random() * 2,
        ph: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random() * 0.8,
        boost: 0,
      };
    }
    for (let i = 0; i < COUNT; i++) flies.push(makeFly());

    cv.parentElement.addEventListener("mousemove", (e) => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = true;
    });
    cv.parentElement.addEventListener("mouseleave", () => {
      mouse.active = false;
      mouse.x = mouse.y = -9999;
    });

    let lastScrollY = window.scrollY;
    let releasedThisRun = false;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      const inHero = y < window.innerHeight * 0.95;
      if (inHero && y > lastScrollY + 30 && !releasedThisRun) {
        const f = makeFly();
        f.x = Math.random() * W * 0.7 + W * 0.15;
        f.y = 40;
        f.vx = (Math.random() - 0.5) * 0.3;
        f.vy = 0.6 + Math.random() * 0.5;
        f.life = 0;
        FALLERS.push(f);
        releasedThisRun = true;
      }
      if (y < 20) releasedThisRun = false;
      lastScrollY = y;
    }, { passive: true });

    function drawFly(f, t) {
      const pulse = 0.5 + Math.sin(t * f.sp + f.ph) * 0.5;
      const alpha = 0.30 + pulse * 0.70 + f.boost * 0.4;
      const haloR = (f.r * 8) + f.boost * 20;
      const grd = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, haloR);
      grd.addColorStop(0, `rgba(255, 210, 140, ${0.55 * alpha})`);
      grd.addColorStop(0.4, `rgba(255, 174, 107, ${0.20 * alpha})`);
      grd.addColorStop(1, `rgba(255, 140, 66, 0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(f.x, f.y, haloR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 245, 220, ${Math.min(1, 0.55 + pulse * 0.5)})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }

    let t = 0;
    function tick() {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      for (const f of flies) {
        f.x += f.vx; f.y += f.vy;
        if (Math.random() < 0.02) {
          f.vx += (Math.random() - 0.5) * 0.2;
          f.vy += (Math.random() - 0.5) * 0.2;
        }
        f.vx = Math.max(-0.6, Math.min(0.6, f.vx));
        f.vy = Math.max(-0.6, Math.min(0.6, f.vy));
        if (f.x < -20) f.x = W + 20;
        if (f.x > W + 20) f.x = -20;
        if (f.y < -20) f.y = H + 20;
        if (f.y > H + 20) f.y = -20;
        if (mouse.active) {
          const dx = f.x - mouse.x;
          const dy = f.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 80 * 80) f.boost = Math.min(1, f.boost + 0.08);
          else f.boost = Math.max(0, f.boost - 0.04);
        } else {
          f.boost = Math.max(0, f.boost - 0.04);
        }
        drawFly(f, t);
      }
      for (let i = FALLERS.length - 1; i >= 0; i--) {
        const f = FALLERS[i];
        f.x += f.vx; f.y += f.vy;
        f.vy = Math.min(2.5, f.vy + 0.02);
        f.life = (f.life || 0) + 1;
        drawFly(f, t);
        if (f.y > H + 40 || f.life > 400) FALLERS.splice(i, 1);
      }
      requestAnimationFrame(tick);
    }
    tick();
  })();

  /* ----------------------------------------------------------
     5. Descubre — canvas torch + luciérnagas
  ---------------------------------------------------------- */
  (() => {
    const scene = document.getElementById("scene-iluminar");
    if (!scene) return;
    const canvas = document.getElementById("scene-veil");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const lucs = [...scene.querySelectorAll(".luc")];
    const hint = document.getElementById("scene-hint");

    const RADIUS = 180;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    let mouseX = -9999, mouseY = -9999;
    let active = false;

    function resize() {
      const r = scene.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    }

    function paint() {
      if (!W || !H) return;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(11, 8, 7, 0.96)";
      ctx.fillRect(0, 0, W, H);
      if (active) {
        const g = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, RADIUS);
        g.addColorStop(0,   "rgba(0,0,0,1)");
        g.addColorStop(0.45,"rgba(0,0,0,0.85)");
        g.addColorStop(0.75,"rgba(0,0,0,0.35)");
        g.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }
    }

    function updateLucs() {
      const sr = scene.getBoundingClientRect();
      lucs.forEach(luc => {
        const lr = luc.getBoundingClientRect();
        const lx = lr.left + lr.width / 2 - sr.left;
        const ly = lr.top + lr.height / 2 - sr.top;
        const dx = lx - mouseX, dy = ly - mouseY;
        const d2 = dx * dx + dy * dy;
        const lit = active && d2 < (RADIUS * 0.9) * (RADIUS * 0.9);
        luc.classList.toggle("lit", lit);
      });
    }

    function hideHint() { if (hint) hint.classList.add("fade"); }
    function showHint() { if (hint) hint.classList.remove("fade"); }

    resize();
    window.addEventListener("resize", resize);

    scene.addEventListener("mouseenter", () => {
      active = true;
      hideHint();
    });
    scene.addEventListener("mousemove", (e) => {
      const r = scene.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      mouseY = e.clientY - r.top;
      active = true;
      paint();
      updateLucs();
    });
    scene.addEventListener("mouseleave", () => {
      active = false;
      mouseX = mouseY = -9999;
      paint();
      updateLucs();
      showHint();
    });

    scene.addEventListener("touchstart", (e) => {
      const t = e.touches[0]; if (!t) return;
      const r = scene.getBoundingClientRect();
      mouseX = t.clientX - r.left; mouseY = t.clientY - r.top;
      active = true; hideHint();
      paint(); updateLucs();
    }, { passive: true });
    scene.addEventListener("touchmove", (e) => {
      const t = e.touches[0]; if (!t) return;
      const r = scene.getBoundingClientRect();
      mouseX = t.clientX - r.left; mouseY = t.clientY - r.top;
      paint(); updateLucs();
    }, { passive: true });
    scene.addEventListener("touchend", () => {
      active = false;
      mouseX = mouseY = -9999;
      paint();
      updateLucs();
      showHint();
    }, { passive: true });

    lucs.forEach(luc => {
      luc.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!luc.classList.contains("lit")) return;
        if (luc.classList.contains("saved")) return;
        luc.classList.add("saved");
      });
      luc.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          luc.click();
        }
      });
    });
  })();

  /* ----------------------------------------------------------
     6. Postal flip
  ---------------------------------------------------------- */
  (() => {
    const card = document.getElementById("postcard");
    if (!card) return;
    function toggle() { card.classList.toggle("flipped"); }
    card.addEventListener("click", toggle);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  })();

  /* ----------------------------------------------------------
     7. Constelación · linterna
  ---------------------------------------------------------- */
  (() => {
    const scene = document.getElementById("scene-share");
    if (!scene) return;
    const torch = scene.querySelector(".torch");
    function setLight(x, y) {
      const r = scene.getBoundingClientRect();
      const px = ((x - r.left) / r.width) * 100;
      const py = ((y - r.top) / r.height) * 100;
      scene.style.setProperty("--mx", px + "%");
      scene.style.setProperty("--my", py + "%");
      torch.style.left = (x - r.left) + "px";
      torch.style.top = (y - r.top) + "px";
      torch.style.transform = "translate(-50%, -50%)";
    }
    scene.addEventListener("mousemove", (e) => setLight(e.clientX, e.clientY));
    scene.addEventListener("mouseleave", () => {
      const r = scene.getBoundingClientRect();
      scene.style.setProperty("--mx", "50%");
      scene.style.setProperty("--my", "50%");
      torch.style.left = (r.width / 2) + "px";
      torch.style.top = (r.height / 2) + "px";
      torch.style.transform = "translate(-50%, -50%)";
    });
    scene.addEventListener("touchmove", (e) => {
      const t = e.touches[0];
      if (t) setLight(t.clientX, t.clientY);
    }, { passive: true });
  })();

  /* ----------------------------------------------------------
     8. Datos de lugares + Lightbox + Constelación
  ---------------------------------------------------------- */
  const PLACES = {
    malaga: {
      name: "Salón Málaga",
      meta: "La Candelaria · Centro",
      desc: "Bar antiguo, abierto desde 1957, con fotos vintage en las paredes y espectáculos de música en vivo.",
      addr: "Cra. 51 #45-80, La Candelaria, Medellín",
      socials: [
        { type: "web", href: "https://salonmalaga.com/", label: "Sitio web" },
        { type: "maps", href: "https://www.google.com/maps/search/?api=1&query=Salón+Málaga+Medellín", label: "Ver en Google Maps" }
      ],
      photos: [
        "img/lugares/malaga.webp",
        "img/lugares/m1.webp",
        "img/lugares/m2.webp",
        "img/lugares/m3.webp",
        "img/lugares/m4.webp"
      ]
    },
    epico: {
      name: "Épico",
      meta: "La Candelaria · Centro",
      desc: "Restaurante bar en el corazón del centro. Cocina cercana, ambiente local, sin pretensiones.",
      addr: "Cra. 43 #47-64, local 131, La Candelaria, Medellín",
      socials: [
        { type: "facebook", href: "https://www.facebook.com/epicorestaurantebar", label: "Facebook" },
        { type: "maps", href: "https://www.google.com/maps/search/?api=1&query=Restaurante+Bar+Épico+Medellín", label: "Ver en Google Maps" }
      ],
      photos: [
        "img/lugares/epico.webp",
        "img/lugares/e1.jpg",
        "img/lugares/e2.jpg"
      ]
    },
    claustro: {
      name: "El Bohemio de Clausura",
      meta: "La Candelaria · Centro",
      desc: "Centro cultural y educativo con teatro, música, talleres, cine, exposiciones, biblioteca y espacios para el ocio. Operado por Comfama.",
      addr: "Cra. 44 #48-18, La Candelaria, Medellín",
      socials: [
        { type: "instagram", href: "https://www.instagram.com/el_bohemio_de_clausura/?hl=es", label: "Instagram" },
        { type: "facebook", href: "https://www.facebook.com/elbohemiodeclausura/?locale=es_LA", label: "Facebook" },
        { type: "maps", href: "https://www.google.com/maps/search/?api=1&query=El+Bohemio+de+Clausura+Claustro+Medellín", label: "Ver en Google Maps" }
      ],
      photos: [
        "img/lugares/claustro.webp",
        "img/lugares/c1.webp"
      ]
    },
    terracota: {
      name: "Panadería Terracota",
      meta: "Laureles · Estadio",
      desc: "Panadería de barrio en Laureles. Pan recién horneado, café lento y una mesa que invita a quedarse.",
      addr: "Cra. 75 #45D-5, Laureles - Estadio, Medellín, Antioquia",
      socials: [
        { type: "facebook", href: "https://www.facebook.com/PanaderiaTerracota/", label: "Facebook" },
        { type: "maps", href: "https://www.google.com/maps/search/?api=1&query=Panadería+Terracota+Laureles+Medellín", label: "Ver en Google Maps" }
      ],
      photos: [
        "img/lugares/terracota.jpg",
        "img/lugares/t1.jpg",
        "img/lugares/t2.jpg",
        "img/lugares/t3.jpg",
        "img/lugares/t4.jpg",
        "img/lugares/t5.jpg",
        "img/lugares/t6.jpg"
      ]
    },
    quintaesencia: {
      name: "La Quintaesencia · Café y Conversa",
      meta: "La Candelaria · Centro",
      desc: "Café del centro pensado para la conversación lenta. Tazas grandes, mesas de madera y un ritmo que invita a quedarse.",
      addr: "C. 50 #42-05, La Candelaria, Medellín, Antioquia",
      socials: [
        { type: "instagram", href: "https://www.instagram.com/laquinta.cafe", label: "Instagram" },
        { type: "maps", href: "https://www.google.com/maps/place/La+Quintaesencia+-+Caf%C3%A9+y+Conversa/@6.2468222,-75.5647323,17z/data=!3m1!4b1!4m6!3m5!1s0x8e4429c3c55af17b:0xdf7b0f5f5cc2efaa!8m2!3d6.2468169!4d-75.5621574!16s%2Fg%2F11mlhqg_fl", label: "Ver en Google Maps" }
      ],
      photos: [
        "img/lugares/quintaesencia.jpg",
        "img/lugares/q1.jpg",
        "img/lugares/q2.jpg",
        "img/lugares/q3.jpg"
      ]
    },
    homero: {
      name: "Casa Cultural Homero Manzi",
      meta: "La Candelaria · Centro",
      desc: "Casa cultural dedicada al tango y la bohemia desde 1987. Música en vivo, milongas y una memoria que se queda.",
      addr: "Cl. 48 #41-3, La Candelaria, Medellín, Antioquia",
      socials: [
        { type: "web", href: "https://infolocal.comfenalcoantioquia.com/index.php/casa-cultural-tango-homero-manzi", label: "Sitio web" },
        { type: "instagram", href: "https://www.instagram.com/homeromanzi1987", label: "Instagram" },
        { type: "maps", href: "https://www.google.com/maps/place/Casa+Cultural+Homero+Manzi/@6.2444956,-75.5648154,17z/data=!3m1!4b1!4m6!3m5!1s0x8e442859de0e3f1b:0x2f7f61780302ce50!8m2!3d6.2444903!4d-75.5622405!16s%2Fg%2F1tc_s1hw", label: "Ver en Google Maps" }
      ],
      photos: [
        "img/lugares/homero.jpg",
        "img/lugares/h1.jpg",
        "img/lugares/h2.jpg"
      ]
    }
  };

  const SOCIAL_ICONS = {
    maps: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 22s7-7.58 7-13a7 7 0 1 0-14 0c0 5.42 7 13 7 13z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>`,
    facebook: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>`,
    instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
  </svg>`,
    web: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9"/>
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>
  </svg>`
  };

  (() => {
    const lb = document.getElementById("lightbox");
    const list = document.getElementById("lb-list");
    const swipe = document.getElementById("lb-swipe");
    const lbDots = document.getElementById("lb-dots");
    const lbClose = document.getElementById("lb-close");
    const lbPrev = document.getElementById("lb-prev");
    const lbNext = document.getElementById("lb-next");
    const lbMeta = document.getElementById("lb-meta");
    const lbName = document.getElementById("lb-name");
    const lbDesc = document.getElementById("lb-desc");
    const lbAddr = document.getElementById("lb-addr");
    const lbSocials = document.getElementById("lb-socials");

    let photos = [];
    let currentIdx = 0;
    let lastFocused = null;
    let busy = false;
    const ANIM_MS = 720;

    function mod(n, m) { return ((n % m) + m) % m; }
    function photoAt(off) { return photos[mod(currentIdx + off, photos.length)]; }

    function renderInitial() {
      list.innerHTML = `
      <li class="hide"     style="background-image:url('${photoAt(-2)}')"></li>
      <li class="prev"     style="background-image:url('${photoAt(-1)}')"></li>
      <li class="act"      style="background-image:url('${photoAt(0)}')"></li>
      <li class="next"     style="background-image:url('${photoAt(1)}')"></li>
      <li class="new-next" style="background-image:url('${photoAt(2)}')"></li>
    `;
    }

    function renderDots() {
      lbDots.innerHTML = "";
      photos.forEach((_, i) => {
        const d = document.createElement("span");
        if (i === currentIdx) d.classList.add("active");
        d.addEventListener("click", () => {
          if (busy) return;
          const diff = i - currentIdx;
          if (diff === 0) return;
          const fwd = mod(diff, photos.length);
          const bwd = photos.length - fwd;
          const steps = (fwd <= bwd) ? fwd : -bwd;
          for (let s = 0; s < Math.abs(steps); s++) {
            setTimeout(() => (steps > 0 ? next() : prev()), s * 120);
          }
        });
        lbDots.appendChild(d);
      });
    }
    function updateActiveDot() {
      [...lbDots.children].forEach((d, k) => d.classList.toggle("active", k === currentIdx));
    }

    function next() {
      if (busy || photos.length < 2) return;
      busy = true;
      const oldHide = list.querySelector(".hide");
      if (oldHide) oldHide.remove();
      list.querySelector(".prev").classList.replace("prev", "hide");
      list.querySelector(".act").classList.replace("act", "prev");
      list.querySelector(".next").classList.replace("next", "act");
      list.querySelector(".new-next").classList.replace("new-next", "next");
      currentIdx = mod(currentIdx + 1, photos.length);
      const li = document.createElement("li");
      li.className = "new-next";
      li.style.backgroundImage = `url('${photoAt(2)}')`;
      list.appendChild(li);
      updateActiveDot();
      setTimeout(() => { busy = false; }, ANIM_MS);
    }
    function prev() {
      if (busy || photos.length < 2) return;
      busy = true;
      const oldNN = list.querySelector(".new-next");
      if (oldNN) oldNN.remove();
      list.querySelector(".next").classList.replace("next", "new-next");
      list.querySelector(".act").classList.replace("act", "next");
      list.querySelector(".prev").classList.replace("prev", "act");
      list.querySelector(".hide").classList.replace("hide", "prev");
      currentIdx = mod(currentIdx - 1, photos.length);
      const li = document.createElement("li");
      li.className = "hide";
      li.style.backgroundImage = `url('${photoAt(-2)}')`;
      list.insertBefore(li, list.firstChild);
      updateActiveDot();
      setTimeout(() => { busy = false; }, ANIM_MS);
    }

    function renderSocials(socials) {
      lbSocials.innerHTML = "";
      if (!socials || !socials.length) return;
      socials.forEach(s => {
        const a = document.createElement("a");
        a.className = "lb-social";
        a.href = s.href;
        a.target = "_blank";
        a.rel = "noopener";
        a.setAttribute("aria-label", s.label);
        a.title = s.label;
        a.innerHTML = SOCIAL_ICONS[s.type] || SOCIAL_ICONS.web;
        lbSocials.appendChild(a);
      });
    }

    function open(placeKey) {
      const p = PLACES[placeKey];
      if (!p) return;
      lastFocused = document.activeElement;
      lbMeta.textContent = p.meta;
      lbName.textContent = p.name;
      lbDesc.textContent = p.desc;
      lbAddr.textContent = p.addr;
      renderSocials(p.socials);
      photos = p.photos;
      currentIdx = 0;
      renderInitial();
      renderDots();
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.classList.add("lb-open");
      setTimeout(() => lbClose.focus(), 50);
    }
    function close() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lb-open");
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    // Place cards
    document.querySelectorAll(".place-card").forEach(card => {
      const key = card.dataset.place;
      card.addEventListener("click", () => open(key));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(key); }
      });
    });

    // Place cards renderizadas dinámicamente (subview)
    const subviewGrid = document.getElementById("todos-lugares-grid");
    if (subviewGrid) {
      subviewGrid.addEventListener("click", (e) => {
        const card = e.target.closest(".place-card");
        if (card && card.dataset.place) open(card.dataset.place);
      });
      subviewGrid.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const card = e.target.closest(".place-card");
        if (card && card.dataset.place) { e.preventDefault(); open(card.dataset.place); }
      });
    }

    // Constelación stars open the lightbox in-page
    document.querySelectorAll(".scene-share .const-link").forEach(g => {
      const key = g.dataset.place;
      if (!key) return;
      g.addEventListener("click", (e) => { e.preventDefault(); open(key); });
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(key); }
      });
    });

    lbClose.addEventListener("click", close);
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    lbPrev.addEventListener("click", (e) => { e.stopPropagation(); prev(); });
    lbNext.addEventListener("click", (e) => { e.stopPropagation(); next(); });

    // Click en tarjeta lateral del carrusel
    list.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li) return;
      if (li.classList.contains("prev")) prev();
      else if (li.classList.contains("next")) next();
    });

    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    });

    // Swipe nativo (pointer events + touch fallback) sobre la zona de swipe
    let startX = 0, startY = 0, tracking = false;
    const THRESHOLD = 35;
    function down(x, y) { startX = x; startY = y; tracking = true; }
    function up(x, y) {
      if (!tracking) return;
      tracking = false;
      const dx = x - startX;
      const dy = y - startY;
      if (Math.abs(dx) > THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        (dx < 0 ? next() : prev());
      }
    }
    if (window.PointerEvent) {
      swipe.addEventListener("pointerdown", (e) => { down(e.clientX, e.clientY); swipe.setPointerCapture(e.pointerId); });
      swipe.addEventListener("pointerup", (e) => up(e.clientX, e.clientY));
      swipe.addEventListener("pointercancel", () => { tracking = false; });
    } else {
      swipe.addEventListener("touchstart", (e) => { const t = e.touches[0]; down(t.clientX, t.clientY); }, { passive: true });
      swipe.addEventListener("touchend", (e) => { const t = e.changedTouches[0]; up(t.clientX, t.clientY); });
      swipe.addEventListener("mousedown", (e) => down(e.clientX, e.clientY));
      swipe.addEventListener("mouseup", (e) => up(e.clientX, e.clientY));
    }
  })();

  /* ----------------------------------------------------------
     9. Modal · Únete (con custom select)
  ---------------------------------------------------------- */
  (() => {
    const modal = document.getElementById("join-modal");
    if (!modal) return;
    const closeBtn = document.getElementById("join-close");
    const body = document.getElementById("join-body");
    const triggers = document.querySelectorAll("[data-open-join]");
    let lastFocused = null;
    const originalBodyHTML = body.innerHTML;

    function open(e) {
      if (e) e.preventDefault();
      lastFocused = document.activeElement;
      body.innerHTML = originalBodyHTML;
      bindForm();
      initLumSelects(body);
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      setTimeout(() => {
        const first = modal.querySelector("input:not([type='hidden']), textarea");
        if (first) first.focus();
      }, 60);
    }
    function close() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }
    function bindForm() {
      const f = document.getElementById("join-form");
      if (!f) return;
      const cancel = document.getElementById("join-cancel");
      if (cancel) cancel.addEventListener("click", close);
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        // Validar inputs nativos (name, email)
        const inputs = f.querySelectorAll("input:not([type='hidden'])");
        let ok = true;
        inputs.forEach(i => { if (!i.checkValidity()) ok = false; });
        if (!ok) { f.reportValidity(); return; }
        // Validar el custom select (mood)
        const moodSel = f.querySelector(".lum-select");
        const moodVal = f.querySelector("#join-mood").value;
        if (!moodVal) {
          moodSel.classList.add("invalid");
          moodSel.querySelector(".lum-select-trigger").focus();
          return;
        }
        moodSel.classList.remove("invalid");
        showSuccess();
      });
    }
    function showSuccess() {
      body.innerHTML = `
      <div class="modal-success">
        <span class="spark-big" aria-hidden="true">✦</span>
        <h3>Bienvenido a Lúmina.</h3>
        <p>Te enviaremos nuestras recomendaciones de nuevos lugares por descubrir.</p>
        <button type="button" id="join-done">Cerrar</button>
      </div>`;
      const done = document.getElementById("join-done");
      if (done) { done.addEventListener("click", close); setTimeout(() => done.focus(), 50); }
    }
    triggers.forEach(t => t.addEventListener("click", open));
    closeBtn.addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) close();
    });
    bindForm();
    initLumSelects(body);
  })();

  /* ----------------------------------------------------------
     10. Custom select (Lúmina) — accesible con teclado
  ---------------------------------------------------------- */
  function initLumSelects(root) {
    const selects = (root || document).querySelectorAll(".lum-select");
    selects.forEach(sel => {
      if (sel.dataset.bound === "true") return;
      sel.dataset.bound = "true";
      const trigger = sel.querySelector(".lum-select-trigger");
      const label = sel.querySelector(".lum-select-label");
      const panel = sel.querySelector(".lum-select-panel");
      const hidden = sel.querySelector("input[type='hidden']");
      const opts = [...sel.querySelectorAll("[role='option']")];
      let activeIdx = -1;

      function openPanel() {
        sel.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
        const selIdx = opts.findIndex(o => o.classList.contains("selected"));
        activeIdx = selIdx >= 0 ? selIdx : 0;
        updateActive();
      }
      function closePanel() {
        sel.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
        opts.forEach(o => o.removeAttribute("data-active"));
      }
      function updateActive() {
        opts.forEach((o, i) => {
          if (i === activeIdx) o.setAttribute("data-active", "true");
          else o.removeAttribute("data-active");
        });
        const active = opts[activeIdx];
        if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest" });
      }
      function selectIdx(idx) {
        const o = opts[idx];
        if (!o) return;
        opts.forEach(x => x.classList.remove("selected"));
        o.classList.add("selected");
        hidden.value = o.dataset.value;
        label.textContent = o.textContent;
        label.classList.remove("placeholder");
        sel.classList.remove("invalid");
        closePanel();
        trigger.focus();
      }

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        if (sel.classList.contains("open")) closePanel();
        else openPanel();
      });
      opts.forEach((o, i) => {
        o.addEventListener("click", (e) => { e.stopPropagation(); selectIdx(i); });
        o.addEventListener("mouseenter", () => { activeIdx = i; updateActive(); });
      });
      document.addEventListener("click", (e) => {
        if (!sel.contains(e.target)) closePanel();
      });
      trigger.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!sel.classList.contains("open")) {
            openPanel();
            if (e.key === "ArrowDown") { activeIdx = Math.min(opts.length - 1, activeIdx + 1); updateActive(); }
          } else {
            if (e.key === "ArrowDown") { activeIdx = (activeIdx + 1) % opts.length; updateActive(); }
            else if (e.key === "ArrowUp") { activeIdx = (activeIdx - 1 + opts.length) % opts.length; updateActive(); }
            else if (e.key === "Enter" || e.key === " ") selectIdx(activeIdx);
          }
        } else if (e.key === "Escape") {
          if (sel.classList.contains("open")) { closePanel(); }
        } else if (e.key === "Tab") {
          if (sel.classList.contains("open")) closePanel();
        }
      });
    });
  }

  /* ----------------------------------------------------------
     11. Subviews (#todos-lugares, #todas-postales) — hash routing
  ---------------------------------------------------------- */
  const SUBVIEW_IDS = ["todos-lugares", "todas-postales"];

  function renderTodosLugares() {
    const grid = document.getElementById("todos-lugares-grid");
    if (!grid || grid.dataset.rendered === "true") return;
    grid.dataset.rendered = "true";
    grid.innerHTML = Object.keys(PLACES).map(key => {
      const p = PLACES[key];
      const main = p.photos[0];
      const isWebp = /\.webp$/i.test(main);
      const fallback = main.replace(/\.webp$/i, ".jpg");
      return `
        <article class="place-card" data-place="${key}" tabindex="0" aria-label="${p.name} — abrir galería">
          <div class="stack">
            <picture class="stack-main">
              ${isWebp ? `<source srcset="${main}" type="image/webp" />` : ""}
              <img src="${fallback}" alt="${p.name}" loading="lazy" width="800" height="1000" />
            </picture>
          </div>
          <div class="place-info">
            <div class="place-meta">${p.meta}</div>
            <h3 class="place-name">${p.name}</h3>
            <p class="place-desc">${p.desc}</p>
            <span class="photo-pill">✦ ${p.photos.length} fotos</span>
          </div>
        </article>`;
    }).join("");
  }

  const POSTALES_SEED = [
    {
      name: "Andrea",
      place: "malaga",
      date: "Sábado 15 · Marzo",
      entry: "Llegué un martes lluvioso. Pedí un tinto. El señor de la mesa de al lado me contó que ahí firmaron, en 1978, un divorcio, un negocio y una declaración de amor. Todo en la misma tarde."
    },
    {
      name: "Camilo",
      place: "claustro",
      date: "Jueves 27 · Febrero",
      entry: "Me senté en el patio del Claustro a esperar que empezara el cine. Una abuela me convidó un café de su termo. Hablamos veinte minutos. No supe su nombre."
    },
    {
      name: "Valentina",
      place: "terracota",
      date: "Domingo 9 · Marzo",
      entry: "Pan recién horneado a las nueve de la mañana. Mi mamá quería pandebono. Yo quería quedarme. Pedimos los dos."
    },
    {
      name: "Tomás",
      place: "epico",
      date: "Viernes 28 · Febrero",
      entry: "Cena larga, mesa pequeña, sin afán. Comimos pasando los platos y nadie miró el celular en dos horas."
    }
  ];

  let inMemoryPostales = [];

  function loadPostales() {
    return inMemoryPostales;
  }

  function savePostal(p) {
    inMemoryPostales.unshift(p);
  }

  function showToast(platform, message, shareUrl, placeKey, customPhoto, customPhotoName) {
    let container = document.querySelector(".lum-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "lum-toast-container";
      document.body.appendChild(container);
    }
    
    const place = PLACES[placeKey];
    const placeName = place ? place.name : "Medellín";
    const placePhoto = customPhoto ? customPhoto : (place && place.photos && place.photos[0] ? place.photos[0] : "img/logo/lumina-logo.png");
    const fileName = customPhotoName ? customPhotoName : (placeKey ? `${placeKey}.webp` : "medellin.webp");
    const attachmentPrefix = customPhotoName ? "subidas" : "lugares";

    const toast = document.createElement("div");
    toast.className = "lum-toast";
    toast.innerHTML = `
      <div class="lum-toast-header">
        <span class="spark">✦</span>
        <span>Compartir en ${platform} (Simulado)</span>
      </div>
      <div class="lum-toast-body">
        <div class="lum-toast-preview">
          <img src="${placePhoto}" class="lum-toast-img" alt="${placeName}" />
          <div class="lum-toast-info">
            <span class="lum-toast-title">${placeName}</span>
            <span class="lum-toast-attachment">📎 img/${attachmentPrefix}/${fileName}</span>
          </div>
        </div>
        <p class="lum-toast-text">"${message}"</p>
      </div>
      <div class="lum-toast-meta">Enlace: ${shareUrl}</div>
    `;
    container.appendChild(toast);
    
    // Forzar layout para animación
    toast.offsetHeight;
    toast.classList.add("show");
    
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 5500);
  }

  function renderTodasPostales() {
    const grid = document.getElementById("postales-grid");
    if (!grid) return;
    const userPostales = loadPostales();
    const all = [...userPostales, ...POSTALES_SEED];
    grid.innerHTML = all.map((p) => {
      const place = PLACES[p.place];
      const placeName = place ? place.name : p.place;
      const placeMeta = place ? place.meta : "";
      const placePhoto = p.userPhoto || (place && place.photos && place.photos[0]) || "";
      const fromLabel = placeMeta ? `Desde ${placeMeta.split(" · ")[0]}` : "Lúmina · Medellín";
      return `
        <div class="scene-postcard postal-card">
          <div class="tape" aria-hidden="true"></div>
          <div class="postcard" tabindex="0" role="button" aria-label="Postal de ${escapeHtml(placeName)} — girar">
            <div class="postcard-face postcard-front" style="background-image:url('${placePhoto}')">
              <div class="corner"><span>Lúmina<br />Medellín</span></div>
              <div class="place-tag">
                <div class="label">Memoria registrada</div>
                <div class="name">${escapeHtml(placeName)}</div>
              </div>
              <span class="flip-hint">Toca para girar →</span>
            </div>
            <div class="postcard-face postcard-back">
              <div class="left">
                <div class="head">
                  <span class="date">${escapeHtml(p.date || "Sin fecha")}</span>
                  <span class="from">${escapeHtml(fromLabel)}</span>
                </div>
                <div class="pname">${escapeHtml(placeName)}</div>
                <p class="entry">${escapeHtml(p.entry)}</p>
                <div class="stamps">
                  <span class="stamp">Memoria</span>
                  <span class="stamp">Lúmina</span>
                </div>
              </div>
              <div class="right">
                <div class="stamp-square">
                  <div class="inner"></div>
                </div>
                <div class="address">
                  <span class="address-label">De</span>
                  <div class="address-line">${escapeHtml(p.name)}</div>
                </div>
                <div class="coords">
                  Lúmina · Medellín<br />
                  ${escapeHtml(placeMeta)}
                </div>
              </div>
            </div>
          </div>
        </div>`;
    }).join("");

    grid.querySelectorAll(".postal-card .postcard").forEach(card => {
      card.addEventListener("click", () => card.classList.toggle("flipped"));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.classList.toggle("flipped");
        }
      });
    });
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function applyHashRoute() {
    const raw = (location.hash || "").replace(/^#/, "");
    const isSubview = SUBVIEW_IDS.includes(raw);
    document.querySelectorAll(".subview").forEach(el => {
      const active = el.id === raw;
      el.classList.toggle("is-active", active);
      el.setAttribute("aria-hidden", active ? "false" : "true");
    });
    document.body.classList.toggle("subview-open", isSubview);
    if (raw === "todos-lugares") {
      renderTodosLugares();
      window.scrollTo(0, 0);
    } else if (raw === "todas-postales") {
      renderTodasPostales();
      window.scrollTo(0, 0);
    } else if (raw) {
      const target = document.getElementById(raw);
      if (target) {
        requestAnimationFrame(() => {
          target.scrollIntoView({ block: "start", behavior: "instant" });
        });
      }
    }
  }

  window.addEventListener("hashchange", applyHashRoute);
  applyHashRoute();

  /* ----------------------------------------------------------
     12. Modal · Agregar postal
  ---------------------------------------------------------- */
  (() => {
    const modal = document.getElementById("postal-modal");
    if (!modal) return;
    const closeBtn = document.getElementById("postal-close");
    const body = document.getElementById("postal-body");
    const triggers = document.querySelectorAll("[data-open-postal]");
    let lastFocused = null;
    const originalBodyHTML = body.innerHTML;
    let uploadedPhotoDataUrl = "";
    let uploadedPhotoName = "";

    function open(e) {
      if (e) e.preventDefault();
      lastFocused = document.activeElement;
      body.innerHTML = originalBodyHTML;
      uploadedPhotoDataUrl = "";
      uploadedPhotoName = "";
      bindForm();
      initLumSelects(body);
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      setTimeout(() => {
        const first = modal.querySelector("input:not([type='hidden']), textarea");
        if (first) first.focus();
      }, 60);
    }
    function close() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function bindForm() {
      const f = document.getElementById("postal-form");
      if (!f) return;

      const fileInput = document.getElementById("postal-file-input");
      const fileTrigger = document.getElementById("postal-file-trigger");
      const fileNameEl = document.getElementById("postal-file-name");

      if (fileTrigger && fileInput) {
        fileTrigger.addEventListener("click", () => {
          fileInput.click();
        });
      }

      if (fileInput) {
        fileInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (file) {
            uploadedPhotoName = file.name;
            const reader = new FileReader();
            reader.onload = (evt) => {
              uploadedPhotoDataUrl = evt.target.result;
              if (fileNameEl) {
                fileNameEl.textContent = file.name;
                fileNameEl.style.color = "var(--honey)";
              }
            };
            reader.readAsDataURL(file);
          } else {
            uploadedPhotoDataUrl = "";
            uploadedPhotoName = "";
            if (fileNameEl) {
              fileNameEl.textContent = "Sin archivo seleccionado";
              fileNameEl.style.color = "";
            }
          }
        });
      }

      const cancel = document.getElementById("postal-cancel");
      if (cancel) cancel.addEventListener("click", close);
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("postal-name");
        const entry = document.getElementById("postal-entry");
        const placeVal = document.getElementById("postal-place").value;
        const placeSel = f.querySelector(".lum-select");

        let ok = true;
        if (!name.checkValidity()) ok = false;
        if (!entry.checkValidity()) ok = false;
        if (!ok) { f.reportValidity(); return; }
        if (!placeVal) {
          placeSel.classList.add("invalid");
          placeSel.querySelector(".lum-select-trigger").focus();
          return;
        }
        placeSel.classList.remove("invalid");

        const today = new Date();
        const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const dateStr = `${dias[today.getDay()]} ${today.getDate()} · ${meses[today.getMonth()]}`;

        savePostal({
          name: name.value.trim(),
          email: (document.getElementById("postal-email") || {}).value || "",
          place: placeVal,
          entry: entry.value.trim(),
          date: dateStr,
          createdAt: today.toISOString(),
          userPhoto: uploadedPhotoDataUrl,
          userPhotoName: uploadedPhotoName
        });

        // Si estamos viendo la lista de postales, re-render
        if (document.body.classList.contains("subview-open") && location.hash === "#todas-postales") {
          renderTodasPostales();
        }
        showSuccess(
          name.value.trim(),
          placeVal,
          entry.value.trim(),
          uploadedPhotoDataUrl,
          uploadedPhotoName
        );
      });
    }

    function showSuccess(userName, placeKey, entryText, photoUrl, photoName) {
      body.innerHTML = `
      <div class="modal-success">
        <span class="spark-big" aria-hidden="true">✦</span>
        <h3>Tu postal quedó guardada.</h3>
        <p>Se suma a la constelación de memorias de Lúmina. Puedes verla en "Todas las postales".</p>
        
        <div class="success-share-section">
          <span class="success-share-title">Compartir mi postal</span>
          <div class="share-row">
            <button type="button" class="share-btn success-share-btn" data-share="instagram" title="Compartir en Instagram" aria-label="Compartir en Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
              </svg>
            </button>
            <button type="button" class="share-btn success-share-btn" data-share="facebook" title="Compartir en Facebook" aria-label="Compartir en Facebook">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </button>
            <button type="button" class="share-btn success-share-btn" data-share="twitter" title="Compartir en X" aria-label="Compartir en X">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4l7.5 9.5L4.5 20H7l6-6.5L17 20h3l-7.8-10L19.5 4H17l-5.5 6L7 4z" />
              </svg>
            </button>
            <button type="button" class="share-btn success-share-btn" data-share="whatsapp" title="Compartir en WhatsApp" aria-label="Compartir en WhatsApp">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 21l1.5-5A8 8 0 1 1 9 20.5z" />
                <path d="M8 10c.4 1.5 1.5 2.6 3 3 .8.2 1.3.1 1.8-.4l.4-.4c.2-.2.5-.2.7 0l1.2.8c.3.2.3.6.1.9-.6.8-1.5 1.2-2.5 1-2-.4-4.6-3-5-5-.2-1 .2-1.9 1-2.5.3-.2.7-.2.9.1l.8 1.2c.2.2.2.5 0 .7l-.4.4c-.5.5-.6 1-.4 1.8z" />
              </svg>
            </button>
          </div>
        </div>

        <div class="modal-success-actions">
          <button type="button" class="btn-primary" id="postal-view-mine">Ver mi postal ✦</button>
          <button type="button" class="btn-secondary" id="postal-done">Cerrar</button>
        </div>
      </div>`;
      const viewMine = document.getElementById("postal-view-mine");
      const done = document.getElementById("postal-done");
      if (viewMine) {
        viewMine.addEventListener("click", () => {
          close();
          location.hash = "#todas-postales";
        });
      }
      if (done) {
        done.addEventListener("click", close);
      }

      // Bind click events on the share buttons inside success modal
      body.querySelectorAll(".success-share-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const type = btn.dataset.share;
          const place = PLACES[placeKey];
          const placeName = place ? place.name : "Medellín";
          const text = entryText ? `Mi postal de ${placeName}: "${entryText}" — por ${userName} en Lúmina` : `Mi postal de ${placeName} en Lúmina.`;
          const url = "https://lumina.medellin";
          const encText = encodeURIComponent(text);
          const encUrl = encodeURIComponent(url);
          let shareUrl = "";
          let platformName = "";

          if (type === "twitter") {
            shareUrl = `https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}`;
            platformName = "Twitter / X";
          } else if (type === "facebook") {
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}&quote=${encText}`;
            platformName = "Facebook";
          } else if (type === "whatsapp") {
            shareUrl = `https://wa.me/?text=${encText}%20${encUrl}`;
            platformName = "WhatsApp";
          } else if (type === "instagram") {
            shareUrl = "https://www.instagram.com/";
            platformName = "Instagram";
          }

          if (navigator.clipboard) {
            navigator.clipboard.writeText(`${text} ${url}`).then(() => {
              btn.classList.add("copied");
              setTimeout(() => { btn.classList.remove("copied"); }, 1800);
            }).catch(() => {});
          }

          // Cerrar este modal antes de mostrar el toast — nunca dos modales a la vez
          close();

          // Trigger simulated Toast with exact custom parameters!
          showToast(platformName, text, url, placeKey, photoUrl, photoName);

          if (shareUrl) {
            try {
              window.open(shareUrl, "_blank", "noopener,noreferrer");
            } catch (err) {
              console.warn("Ventana bloqueada, simulado con éxito.");
            }
          }
        });
      });

      setTimeout(() => {
        if (viewMine) viewMine.focus();
      }, 50);
    }

    triggers.forEach(t => t.addEventListener("click", open));
    closeBtn.addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) close();
    });
  })();
})();
