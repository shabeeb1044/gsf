const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const params = new URLSearchParams(location.search);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initHeader() {
  const header = $("#site-header");
  const toggle = $(".menu-toggle");
  const menu = $("#mobile-menu");
  if (!header) return;

  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 18);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (!toggle || !menu) return;

  const close = () => {
    header.classList.remove("menu-open");
    document.body.style.overflow = "";
    toggle.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    if (open) {
      close();
      return;
    }
    header.classList.add("menu-open");
    document.body.style.overflow = "hidden";
    toggle.setAttribute("aria-expanded", "true");
    menu.setAttribute("aria-hidden", "false");
  });

  $$("#mobile-menu a").forEach((link) => link.addEventListener("click", close));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) close();
  });
}

function cardMarkup(item, href) {
  return `
    <a class="card" href="${href}">
      <img src="${item.image}" alt="${item.title}" />
      <div class="card-body">
        <span class="chip">${item.days || item.region || item.tag || item.category}</span>
        <h3>${item.title}</h3>
        <p>${item.summary || item.excerpt || item.copy || ""}</p>
      </div>
    </a>
  `;
}

function initHero() {
  const stage = $("#hero-slides");
  if (!stage || !window.GFT) return;

  const slides = GFT.slides;
  let index = 0;
  let timer;

  stage.innerHTML = slides
    .map(
      (slide, i) =>
        `<div class="hero-slide${i === 0 ? " is-active" : ""}" style="background-image:url('${slide.image}')" role="img" aria-label="${slide.title}"></div>`
    )
    .join("");

  const card = $("#place-card");
  const dots = $("#slide-dots");
  dots.innerHTML = slides.map((_, i) => `<button type="button" aria-label="Go to slide ${i + 1}"><i></i></button>`).join("");

  const renderCard = () => {
    const slide = slides[index];
    card.innerHTML = `
      <img src="${slide.image}" alt="${slide.title}" />
      <div>
        <small>${slide.kicker}</small>
        <strong>${slide.title}</strong>
        <p>${slide.copy}</p>
      </div>
      <span>→</span>
    `;
    card.href = "destinations.html";
    $$("#slide-dots button").forEach((btn, i) => btn.classList.toggle("is-active", i === index));
    $$(".hero-slide").forEach((el, i) => el.classList.toggle("is-active", i === index));
  };

  const go = (next) => {
    index = (next + slides.length) % slides.length;
    renderCard();
    play();
  };

  const play = () => {
    clearInterval(timer);
    if (reduceMotion) return;
    timer = setInterval(() => go(index + 1), 5500);
  };

  $("#hero-prev")?.addEventListener("click", () => go(index - 1));
  $("#hero-next")?.addEventListener("click", () => go(index + 1));
  dots.addEventListener("click", (event) => {
    const btn = event.target.closest("button");
    if (!btn) return;
    go([...dots.children].indexOf(btn));
  });

  let wheelLock = false;
  $(".hero")?.addEventListener(
    "wheel",
    (event) => {
      if (window.scrollY > 40 || wheelLock) return;
      if (Math.abs(event.deltaY) < 18) return;
      const next = event.deltaY > 0 ? index + 1 : index - 1;
      if (next >= slides.length || next < 0) return;
      event.preventDefault();
      wheelLock = true;
      go(next);
      setTimeout(() => {
        wheelLock = false;
      }, 900);
    },
    { passive: false }
  );

  let touchY = 0;
  $(".hero")?.addEventListener(
    "touchstart",
    (event) => {
      touchY = event.touches[0].clientY;
    },
    { passive: true }
  );
  $(".hero")?.addEventListener(
    "touchend",
    (event) => {
      const delta = touchY - event.changedTouches[0].clientY;
      if (Math.abs(delta) < 50 || window.scrollY > 40) return;
      go(index + (delta > 0 ? 1 : -1));
    },
    { passive: true }
  );

  renderCard();
  play();
}

function fillGrid(sel, items, hrefFor) {
  const node = $(sel);
  if (!node) return;
  node.innerHTML = items.map((item) => cardMarkup(item, hrefFor(item))).join("");
}

function initHome() {
  if (document.body.dataset.page !== "home") return;

  // ── Build Holiday Packages Swiper slides ──
  const swiperWrapper = $("#packages-swiper-wrapper");
  if (swiperWrapper && GFT.packages) {
    const regionTagClass = (region) => {
      const map = { UAE: "uae", Oman: "oman", Islands: "islands", Europe: "europe", Asia: "asia" };
      return map[region] || "default";
    };

    swiperWrapper.innerHTML = GFT.packages
      .map(
        (pkg) => `
        <div class="swiper-slide" style="background-image: url('${pkg.image}')">
          <span class="pkg-tag pkg-tag--${regionTagClass(pkg.region)}">${pkg.category}</span>
          <div class="pkg-content">
            <span class="pkg-days">${pkg.days}</span>
            <h3>${pkg.title}</h3>
            <p class="pkg-location">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              ${pkg.region}
            </p>
          </div>
        </div>
      `
      )
      .join("");

    // Initialize Swiper
    new Swiper(".packages-swiper", {
      effect: "coverflow",
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: "auto",
      coverflowEffect: {
        rotate: 0,
        stretch: 0,
        depth: 100,
        modifier: 2,
        slideShadows: true,
      },
      keyboard: { enabled: true },
      mousewheel: { thresholdDelta: 70 },
      spaceBetween: 60,
      loop: true,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      pagination: {
        el: ".packages-dots",
        clickable: true,
      },
    });
  }

  // Other home grids (visas & posts)
  fillGrid("#home-visas", GFT.visas.slice(0, 3), (item) => `visa.html?id=${item.id}`);
  fillGrid("#home-posts", GFT.posts.slice(0, 3), (item) => `article.html?id=${item.id}`);
}

function initFilterPage(config) {
  const grid = $(config.grid);
  const filters = $(config.filters);
  if (!grid) return;

  const unique = ["All", ...new Set(config.items.map((item) => item[config.key]))];
  if (filters) {
    filters.innerHTML = unique
      .map((label, i) => `<button type="button" class="${i === 0 ? "is-on" : ""}" data-filter="${label}">${label}</button>`)
      .join("");
  }

  const draw = (value = "All") => {
    const list = value === "All" ? config.items : config.items.filter((item) => item[config.key] === value);
    grid.innerHTML = list.map((item) => cardMarkup(item, config.href(item))).join("");
  };

  filters?.addEventListener("click", (event) => {
    const btn = event.target.closest("button");
    if (!btn) return;
    $$("button", filters).forEach((el) => el.classList.toggle("is-on", el === btn));
    draw(btn.dataset.filter);
  });

  draw();
}

function initDetail(kind) {
  const mount = $("#detail-root");
  if (!mount) return;
  const item = GFT[kind].find((entry) => entry.id === params.get("id")) || GFT[kind][0];
  document.title = `${item.title} | GFT`;
  const extra = (item.includes || item.steps || []).map((line) => `<li>${line}</li>`).join("");
  mount.innerHTML = `
    <section class="page-hero" style="--page-hero:url('${item.image}')">
      <div class="page-hero-inner">
        <p class="kicker">${item.region} ${item.days ? "· " + item.days : ""} ${item.timeline ? "· " + item.timeline : ""}</p>
        <h1>${item.title}</h1>
        <p class="hero-lead">${item.summary}</p>
      </div>
    </section>
    <section class="section">
      <div class="section-inner split">
        <div>
          <p class="muted" style="max-width:none">${item.body}</p>
          <ul class="include-list">${extra}</ul>
          <p style="margin-top:24px"><a class="btn btn-navy" href="contact.html">Enquire about this</a></p>
        </div>
        <img src="${item.image}" alt="${item.title}" />
      </div>
    </section>
  `;
}

function initArticle() {
  const mount = $("#article-root");
  if (!mount) return;
  const post = GFT.posts.find((entry) => entry.id === params.get("id")) || GFT.posts[0];
  document.title = `${post.title} | GFT Journal`;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", post.excerpt);
  let ld = document.getElementById("article-ld");
  if (!ld) {
    ld = document.createElement("script");
    ld.id = "article-ld";
    ld.type = "application/ld+json";
    document.head.appendChild(ld);
  }
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    author: { "@type": "Organization", name: "Gulf Fihaa Tourism LLC" },
  });
  mount.innerHTML = `
    <section class="page-hero" style="--page-hero:url('${post.image}')">
      <div class="page-hero-inner">
        <p class="kicker">${post.tag} · ${post.date}</p>
        <h1>${post.title}</h1>
      </div>
    </section>
    <section class="section">
      <article class="section-inner article-body">
        ${post.body.map((p) => `<p>${p}</p>`).join("")}
        <p><a class="btn btn-navy" href="blog.html">Back to journal</a></p>
      </article>
    </section>
  `;
}

function initGallery() {
  const grid = $("#gallery-grid");
  const filters = $("#gallery-filters");
  const light = $("#lightbox");
  if (!grid) return;

  initFilterPage({
    items: GFT.gallery,
    key: "category",
    grid: "#gallery-grid",
    filters: "#gallery-filters",
    href: (item) => `#${item.id}`,
  });

  if (!filters) return;

  const draw = () => {
    // after filter re-render, bind lightbox
  };

  grid.addEventListener("click", (event) => {
    event.preventDefault();
    const card = event.target.closest("a");
    if (!card) return;
    const img = $("img", card);
    $("#lightbox-image").src = img.src;
    $("#lightbox-image").alt = img.alt;
    light.classList.add("is-on");
  });

  light?.addEventListener("click", () => light.classList.remove("is-on"));
}

function initContact() {
  const form = $("#enquiry-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!data.name || !data.email || !data.message) {
      form.reportValidity();
      return;
    }
    $("#form-note").classList.add("is-on");
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initHero();
  initHome();
  initFilterPage({
    items: GFT.packages,
    key: "region",
    grid: "#package-grid",
    filters: "#package-filters",
    href: (item) => `destination.html?id=${item.id}`,
  });
  initFilterPage({
    items: GFT.visas,
    key: "region",
    grid: "#visa-grid",
    filters: "#visa-filters",
    href: (item) => `visa.html?id=${item.id}`,
  });
  initFilterPage({
    items: GFT.posts,
    key: "tag",
    grid: "#blog-grid",
    filters: "#blog-filters",
    href: (item) => `article.html?id=${item.id}`,
  });
  if (document.body.dataset.page === "destination") initDetail("packages");
  if (document.body.dataset.page === "visa") initDetail("visas");
  if (document.body.dataset.page === "article") initArticle();
  initGallery();
  initContact();
  document.body.classList.add("is-ready");
});
