/* WDR Bouw — interacties en animaties (geen externe libraries) */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Pagina-overgang ---------- */
  var curtain = $(".curtain");
  if (curtain) setTimeout(function () { curtain.classList.add("is-done"); }, 1000);
  if (curtain && !reduce) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a || a.hasAttribute("data-lightbox") || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank" || a.hasAttribute("download")) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || /\.(jpe?g|png|webp|pdf)$/i.test(url.pathname) ||(url.pathname === location.pathname && url.hash) || a.getAttribute("href").charAt(0) === "#") return;
      e.preventDefault();
      curtain.classList.remove("is-done");
      curtain.classList.add("is-leaving");
      setTimeout(function () { location.href = url.href; }, 520);
    });
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) curtain.classList.remove("is-leaving");
    });
  }

  /* ---------- Header ---------- */
  var header = $(".header");
  var lastY = 0;
  function onScrollHeader() {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    var hide = y > 400 && y > lastY && !document.body.classList.contains("menu-open");
    header.classList.toggle("is-hidden", hide);
    lastY = y;
    var wa = $(".wa-float");
    if (wa) wa.classList.toggle("is-visible", y > 500);
  }

  /* ---------- Mobiel menu ---------- */
  var burger = $(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open);
      $(".mobile-menu").setAttribute("aria-hidden", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) burger.click();
    });
  }

  /* ---------- Scroll-reveals ---------- */
  $$(".split-lines").forEach(function (el) {
    $$(".line > span", el).forEach(function (s, i) { s.style.setProperty("--i", i); });
  });
  var revealEls = $$("[data-reveal], .split-lines, .step");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Dienstenkaarten op touchscreens ----------
     Zonder muis bestaat 'hover' niet: de kaart die midden in beeld staat krijgt zijn foto,
     en aantikken werkt ook. */
  var serviceCards = $$(".service");
  if (serviceCards.length && window.matchMedia("(hover: none)").matches) {
    var setActive = function (card) {
      serviceCards.forEach(function (c) { c.classList.toggle("is-active", c === card); });
    };
    if ("IntersectionObserver" in window) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target); });
      }, { rootMargin: "-40% 0px -40% 0px" });
      serviceCards.forEach(function (c) { sio.observe(c); });
    }
    serviceCards.forEach(function (c) {
      c.addEventListener("click", function () { setActive(c.classList.contains("is-active") ? null : c); });
    });
  }

  /* ---------- Parallax ---------- */
  var para = $$("[data-parallax]");
  var steps = $(".steps");
  var ticking = false;
  function onFrame() {
    ticking = false;
    var vh = window.innerHeight;
    if (!reduce) {
      para.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.12;
        var offset = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
      });
    }
    if (steps) {
      var sr = steps.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (vh * 0.75 - sr.top) / (sr.height || 1)));
      steps.style.setProperty("--progress", p.toFixed(3));
    }
  }
  function requestTick() { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }
  window.addEventListener("scroll", function () { onScrollHeader(); requestTick(); }, { passive: true });
  window.addEventListener("resize", requestTick);
  onScrollHeader(); onFrame();

  /* ---------- Hero-slideshow ---------- */
  var slides = $$(".hero__slide");
  if (slides.length > 1) {
    var dotsWrap = $(".hero__dots"), cur = 0, timer;
    var dots = slides.map(function (s, i) {
      var b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", "Toon foto " + (i + 1));
      b.addEventListener("click", function () { show(i); restart(); });
      if (dotsWrap) dotsWrap.appendChild(b);
      return b;
    });
    var show = function (i) {
      slides[cur].classList.remove("is-active"); dots[cur].removeAttribute("aria-current");
      cur = i;
      var s = slides[cur];
      if (s.dataset.bg) { s.style.backgroundImage = "url(" + s.dataset.bg + ")"; s.removeAttribute("data-bg"); }
      s.classList.add("is-active"); dots[cur].setAttribute("aria-current", "true");
      var next = slides[(cur + 1) % slides.length];
      if (next.dataset.bg) { var im = new Image(); im.src = next.dataset.bg; }
    };
    var restart = function () { clearInterval(timer); if (!reduce) timer = setInterval(function () { show((cur + 1) % slides.length); }, 6500); };
    dots[0].setAttribute("aria-current", "true");
    show(0); restart();
  } else if (slides[0]) { slides[0].classList.add("is-active"); }

  /* ---------- Tellers ---------- */
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, end = parseFloat(el.dataset.count), t0 = null, dur = 1600;
        cio.unobserve(el);
        if (reduce) { el.textContent = end; return; }
        (function step(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 4);
          el.textContent = Math.round(end * e);
          if (k < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- Voor/na-slider ---------- */
  $$(".ba").forEach(function (ba) {
    var input = $("input", ba);
    var set = function (v) { ba.style.setProperty("--pos", v + "%"); };
    input.addEventListener("input", function () { set(input.value); });
    set(input.value);
  });

  /* ---------- Lightbox ---------- */
  var lb = $(".lightbox");
  if (lb) {
    var lbImg = $("img", lb), lbCount = $(".lightbox__count", lb), group = [], idx = 0, lastFocus;
    var open = function (items, i) {
      group = items; idx = i; lastFocus = document.activeElement;
      render(); lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden"; $(".lightbox__close", lb).focus();
    };
    var close = function () {
      lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = ""; if (lastFocus) lastFocus.focus();
    };
    var render = function () {
      var el = group[idx];
      lbImg.style.opacity = 0;
      lbImg.onload = function () { lbImg.style.opacity = 1; };
      lbImg.src = el.getAttribute("href") || el.dataset.src;
      lbImg.alt = ($("img", el) || {}).alt || "";
      lbCount.textContent = (idx + 1) + " / " + group.length;
    };
    var go = function (d) { idx = (idx + d + group.length) % group.length; render(); };
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-lightbox]");
      if (!t) return;
      e.preventDefault();
      var name = t.getAttribute("data-lightbox");
      var items = $$('[data-lightbox="' + name + '"]').filter(function (x) { return x.offsetParent !== null; });
      open(items, Math.max(0, items.indexOf(t)));
    });
    $(".lightbox__close", lb).addEventListener("click", close);
    $(".lightbox__prev", lb).addEventListener("click", function () { go(-1); });
    $(".lightbox__next", lb).addEventListener("click", function () { go(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    });
    var sx = null;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      sx = null;
    });
  }

  /* ---------- Galerij: meer laden ---------- */
  var moreBtn = $("[data-gallery-more]");
  if (moreBtn) {
    moreBtn.addEventListener("click", function () {
      $$(".gallery__item[hidden]").forEach(function (el, i) {
        el.hidden = false;
        el.style.opacity = 0; el.style.transform = "translateY(20px)";
        el.style.transition = "opacity .8s " + (i % 8) * 0.05 + "s, transform .9s cubic-bezier(.2,.7,.1,1) " + (i % 8) * 0.05 + "s";
        requestAnimationFrame(function () { requestAnimationFrame(function () { el.style.opacity = 1; el.style.transform = "none"; }); });
      });
      moreBtn.parentElement.remove();
    });
  }

  /* ---------- Contactformulier ---------- */
  var form = $("#contact-form");
  if (form) {
    var status = $(".form__status", form), btn = $("button[type=submit]", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if ($("[name=botcheck]", form).checked) return;
      var data = new FormData(form);
      var cfg = window.WDR_FORMULIER || {};
      var useWeb3 = !!cfg.web3formsKey;
      status.className = "form__status";

      var v = function (k) { return (data.get(k) || "").toString().trim(); };
      var fields = {
        naam: v("naam"), email: v("email"), telefoon: v("telefoon"),
        plaats: v("plaats") || "-", type_project: v("type_project") || "-", bericht: v("bericht"),
        datum: new Date().toLocaleString("nl-NL", { dateStyle: "long", timeStyle: "short" })
      };

      // Nog geen formulierdienst gekoppeld? Dan opent het e-mailprogramma met het bericht erin.
      if (!useWeb3) {
        var body = "Naam: " + fields.naam + "\nE-mail: " + fields.email + "\nTelefoon: " + fields.telefoon +
          "\nPlaats: " + fields.plaats + "\nType project: " + fields.type_project + "\n\n" + fields.bericht;
        var mailto = "mailto:info.wdrbouw@gmail.com?subject=" + encodeURIComponent("Offerteaanvraag via de website") + "&body=" + encodeURIComponent(body);
        status.innerHTML = 'Uw e-mailprogramma wordt geopend met uw aanvraag erin; klik daar op <strong>verzenden</strong>. ' +
          'Opent er niets? <a href="' + mailto + '"><strong>Klik hier</strong></a>, mail naar <a href="mailto:info.wdrbouw@gmail.com"><strong>info.wdrbouw@gmail.com</strong></a> of bel <a href="tel:+31623913642"><strong>06 2391 3642</strong></a>.';
        status.classList.add("is-ok");
        status.scrollIntoView({ behavior: "smooth", block: "center" });
        location.href = mailto;
        return;
      }

      // Web3Forms stuurt de aanvraag naar info.wdrbouw@gmail.com; "Beantwoorden" gaat naar het e-mailadres van de klant.
      data.set("access_key", cfg.web3formsKey);
      data.set("replyto", fields.email);
      data.set("subject", "Nieuwe aanvraag van " + fields.naam + (fields.type_project !== "-" ? " – " + fields.type_project : ""));

      btn.classList.add("is-loading");
      fetch(form.action, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error(); })
        .then(function () {
          var done = $(".form-done");
          if (done) {
            $("[data-done-naam]", done).textContent = fields.naam.split(" ")[0];
            form.hidden = true; done.hidden = false;
            done.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            status.textContent = "Bedankt voor uw aanvraag! Wij nemen zo spoedig mogelijk contact met u op.";
            status.classList.add("is-ok");
          }
          form.reset();
        })
        .catch(function () {
          status.innerHTML = 'Er ging iets mis bij het versturen. Bel of WhatsApp ons op <a href="tel:+31623913642"><strong>06 2391 3642</strong></a> of mail naar <a href="mailto:info.wdrbouw@gmail.com"><strong>info.wdrbouw@gmail.com</strong></a>.';
          status.classList.add("is-error");
        })
        .then(function () { btn.classList.remove("is-loading"); if (status.className !== "form__status") status.scrollIntoView({ behavior: "smooth", block: "center" }); });
    });
  }

  /* ---------- Jaartal ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
