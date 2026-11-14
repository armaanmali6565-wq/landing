(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CFG = window.ZEROTRX_CONFIG || {};

  /* Provider address text fallbacks (no-JS HTML already shows the address) */
  document.querySelectorAll("#providerAddress, #verifyAddress, #verifyAddressHome").forEach((el) => {
    if (!CFG.providerAddress) return;
    el.textContent = CFG.providerAddress;
    if (el.id === "providerAddress") el.setAttribute("title", CFG.providerAddress);
  });

  /* Drawer: focus trap, Esc, link close, restore focus */
  const drawer = document.getElementById("drawer");
  const openBtn = document.getElementById("menuOpen");
  const closeBtn = document.getElementById("menuClose");
  let lastFocus = null;

  function getFocusable(root) {
    return Array.from(root.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
  }

  function setPageInert(on) {
    const openBtn = document.getElementById("menuOpen");
    const closeBtnLocal = document.getElementById("menuClose");
    const nodes = [
      document.querySelector(".skip-link"),
      document.getElementById("main"),
      document.querySelector("footer"),
      document.getElementById("supportFab"),
      document.getElementById("supportPanel"),
      document.querySelector(".sticky-cta"),
      document.querySelector(".site-header .brand"),
      document.querySelector(".desk-nav")
    ].filter(Boolean);
    nodes.forEach((el) => {
      if (on) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    });
    if (openBtn) openBtn.removeAttribute("inert");
    if (closeBtnLocal) closeBtnLocal.removeAttribute("inert");
  }

  function openDrawer() {
    if (!drawer || !openBtn) return;
    lastFocus = document.activeElement;
    openBtn.classList.add("is-open");
    openBtn.setAttribute("aria-expanded", "true");
    drawer.hidden = false;
    void drawer.offsetWidth;
    drawer.classList.add("open");
    document.body.style.overflow = "hidden";
    setPageInert(true);
    const panel = drawer.querySelector(".drawer-panel") || drawer;
    const focusables = getFocusable(panel);
    (closeBtn || focusables[0] || panel).focus();
  }

  function closeDrawer() {
    if (!drawer || !openBtn) return;
    openBtn.classList.remove("is-open");
    openBtn.setAttribute("aria-expanded", "false");
    drawer.classList.remove("open");
    document.body.style.overflow = "";
    setPageInert(false);
    const finish = () => { if (!drawer.classList.contains("open")) drawer.hidden = true; };
    drawer.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, 360);
    (lastFocus || openBtn).focus();
  }

  if (drawer && openBtn && closeBtn) {
    openBtn.addEventListener("click", () => (drawer.classList.contains("open") ? closeDrawer() : openDrawer()));
    closeBtn.addEventListener("click", closeDrawer);
    drawer.addEventListener("click", (e) => { if (e.target === drawer) closeDrawer(); });
    drawer.querySelectorAll("a[href]").forEach((a) => a.addEventListener("click", closeDrawer));
    document.addEventListener("keydown", (e) => {
      if (!drawer.classList.contains("open")) return;
      if (e.key === "Escape") { e.preventDefault(); closeDrawer(); return; }
      if (e.key !== "Tab") return;
      const panel = drawer.querySelector(".drawer-panel") || drawer;
      const items = getFocusable(panel);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  }

  /* Support FAB */
  const supportFab = document.getElementById("supportFab");
  const supportPanel = document.getElementById("supportPanel");
  const supportClose = document.getElementById("supportClose");
  if (supportFab && supportPanel) {
    supportFab.addEventListener("click", () => {
      const open = supportPanel.classList.toggle("open");
      supportFab.setAttribute("aria-expanded", open ? "true" : "false");
    });
    if (supportClose) supportClose.addEventListener("click", () => {
      supportPanel.classList.remove("open");
      supportFab.setAttribute("aria-expanded", "false");
      supportFab.focus();
    });
  }

  /* Scroll reveal <= 400ms, fade-up 14px (CSS) */
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("in"));
    } else {
      const rio = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          rio.unobserve(entry.target);
        });
      }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
      revealEls.forEach((el) => rio.observe(el));
    }
  }

  /* Timeline fill once */
  document.querySelectorAll(".timeline").forEach((timeline) => {
    const steps = Array.from(timeline.querySelectorAll(".step"));
    if (!steps.length) return;
    let idx = 0;
    let started = false;
    function paint(n) {
      steps.forEach((step, i) => {
        step.classList.toggle("filled", i < n);
        step.classList.toggle("done", i < n);
        step.classList.toggle("active", i === n);
        step.classList.toggle("in", i <= n);
      });
    }
    function start() {
      if (started) return;
      started = true;
      timeline.classList.add("drawn");
      if (reduceMotion) {
        steps.forEach((s) => s.classList.add("in", "filled", "done"));
        return;
      }
      paint(0);
      const timer = setInterval(() => {
        idx += 1;
        if (idx >= steps.length) {
          clearInterval(timer);
          steps.forEach((s) => {
            s.classList.add("filled", "done", "in");
            s.classList.remove("active");
          });
        } else paint(idx);
      }, 1400);
    }
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) start(); });
      }, { threshold: 0.25 });
      io.observe(timeline);
    } else start();
  });

  /* Hero transaction steps — play once */
  const heroRows = Array.from(document.querySelectorAll("[data-hero]"));
  const heroParticle = document.getElementById("heroParticle");
  const heroTrack = heroParticle && heroParticle.parentElement;
  let heroIndex = 0;
  function placeHeroParticle(i) {
    if (!heroParticle || !heroTrack || !heroRows[i]) return;
    const node = heroRows[i].querySelector(".node");
    if (!node) return;
    const trackBox = heroTrack.getBoundingClientRect();
    const nodeBox = node.getBoundingClientRect();
    const halfW = heroParticle.offsetWidth / 2 || 5;
    const halfH = heroParticle.offsetHeight / 2 || 5;
    const centerX = nodeBox.left - trackBox.left + nodeBox.width / 2;
    const centerY = nodeBox.top - trackBox.top + nodeBox.height / 2;
    heroTrack.style.setProperty("--tx-rail", Math.round(centerX) + "px");
    heroParticle.style.left = Math.round(centerX - halfW) + "px";
    heroParticle.style.top = Math.round(centerY - halfH) + "px";
  }
  function paintHero(i) {
    heroRows.forEach((row, n) => {
      row.classList.toggle("active", n === i);
      row.classList.toggle("done", n < i);
    });
    placeHeroParticle(i);
  }
  if (heroRows.length) {
    if (reduceMotion) {
      heroRows.forEach((r) => r.classList.add("active", "done"));
      if (heroParticle) heroParticle.style.opacity = "0";
    } else {
      paintHero(0);
      requestAnimationFrame(() => placeHeroParticle(0));
      const heroTimer = setInterval(() => {
        heroIndex += 1;
        if (heroIndex >= heroRows.length) {
          clearInterval(heroTimer);
          heroRows.forEach((r) => { r.classList.add("done"); r.classList.remove("active"); });
          heroRows[heroRows.length - 1].classList.add("active", "done");
          placeHeroParticle(heroRows.length - 1);
          return;
        }
        paintHero(heroIndex);
      }, 2200);
      window.addEventListener("resize", () => placeHeroParticle(Math.min(heroIndex, heroRows.length - 1)));
    }
  }

  /* Cost meter typing — once, then final state */
  const costMeter = document.getElementById("costMeter");
  function startCostStory() {
    if (!costMeter || costMeter.dataset.playing === "1") return;
    costMeter.dataset.playing = "1";
    costMeter.classList.add("in");
    const typed = document.getElementById("costTyped");
    const full = costMeter.getAttribute("data-cost-text") || "~18–20 TRX network fee*";
    const freeEl = costMeter.querySelector(".cost-free");

    function showFree() {
      costMeter.classList.remove("is-typing");
      costMeter.classList.add("is-struck");
      setTimeout(() => {
        costMeter.classList.add("is-free");
        if (freeEl) freeEl.setAttribute("aria-hidden", "false");
      }, reduceMotion ? 0 : 500);
    }

    if (reduceMotion) {
      if (typed) typed.textContent = full;
      showFree();
      return;
    }
    costMeter.classList.add("is-typing");
    if (typed) typed.textContent = "";
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      if (typed) typed.textContent = full.slice(0, i);
      if (i >= full.length) {
        clearInterval(timer);
        setTimeout(showFree, 400);
      }
    }, 48);
  }
  if (costMeter) {
    if (reduceMotion) startCostStory();
    else if ("IntersectionObserver" in window) {
      const cio = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          startCostStory();
          cio.disconnect();
        });
      }, { threshold: 0.35 });
      cio.observe(costMeter);
    } else startCostStory();
  }

  /* Logo: animate continuously (respect reduced motion) */
  if (reduceMotion) {
    document.querySelectorAll(".logo-live").forEach((el) => el.classList.add("is-settled"));
  } else {
    document.querySelectorAll(".logo-live").forEach((el) => el.classList.remove("is-settled"));
  }
})();
