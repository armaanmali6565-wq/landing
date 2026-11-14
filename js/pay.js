(() => {
  const CFG = window.ZEROTRX_CONFIG || {};
  const address = CFG.providerAddress || "TVDidDEcxfGg6YfuSvmiuzDWWz95hmKErY";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const addr = document.getElementById("providerAddress");
  const verify = document.getElementById("verifyAddress");
  if (addr) {
    addr.textContent = address;
    addr.setAttribute("title", address);
  }
  if (verify) verify.textContent = address;

  const copyBtn = document.getElementById("copyBtn");
  const copyLabel = document.getElementById("copyLabel");
  const copyIco = document.getElementById("copyIco");
  const copyFloat = document.getElementById("copyFloat");
  const portalStatus = document.getElementById("portalStatus");
  const addrFlags = document.getElementById("addrFlags");
  let copyBusy = false;

  function setCopyIdle() {
    if (!copyBtn) return;
    copyBtn.classList.remove("success");
    if (copyIco) copyIco.textContent = "▣";
    if (copyLabel) copyLabel.textContent = "Copy address";
    copyBusy = false;
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      if (copyBusy) return;
      copyBusy = true;
      if (copyIco) copyIco.textContent = "◌";
      if (copyLabel) copyLabel.textContent = "Copying...";
      try {
        await navigator.clipboard.writeText(address);
        copyBtn.classList.add("success");
        if (copyIco) copyIco.textContent = "✓";
        if (copyLabel) copyLabel.textContent = "Copied";
        if (copyFloat) {
          copyFloat.classList.remove("show");
          void copyFloat.offsetWidth;
          copyFloat.classList.add("show");
        }
        if (portalStatus) {
          portalStatus.classList.remove("wait");
          portalStatus.innerHTML = '<span class="dot" aria-hidden="true"></span> COPIED';
        }
        if (addrFlags) addrFlags.innerHTML = "<span>✓ ADDRESS COPIED</span><span>✓ READY TO SEND 0.2 TRX</span>";
        setTimeout(setCopyIdle, 2200);
      } catch {
        if (addr) {
          const range = document.createRange();
          range.selectNodeContents(addr);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
        if (copyLabel) copyLabel.textContent = "Select & copy";
        setTimeout(setCopyIdle, 2200);
      }
    });
  }

  /* QR scan line once on first view */
  const qrPortal = document.getElementById("qrPortal");
  const portal = document.getElementById("paymentPortal");
  if (qrPortal && portal && !reduceMotion && "IntersectionObserver" in window) {
    const once = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        portal.classList.add("in");
        qrPortal.classList.add("active");
        setTimeout(() => qrPortal.classList.remove("active"), 1200);
        once.disconnect();
      });
    }, { threshold: 0.35 });
    once.observe(portal);
  } else if (portal) {
    portal.classList.add("in");
  }

  function showAddressOnly(el) {
    el.innerHTML = '<p class="qr-fallback">QR unavailable. Copy the address below.</p>';
  }

  function renderQr() {
    const el = document.getElementById("qrcode");
    if (!el) return false;
    if (window.QRCode && typeof QRCode.toCanvas === "function") {
      const canvas = document.createElement("canvas");
      el.innerHTML = "";
      el.appendChild(canvas);
      QRCode.toCanvas(canvas, address, {
        width: 200,
        margin: 1,
        color: { dark: "#07162F", light: "#FFFFFF" },
        errorCorrectionLevel: "M"
      }, (err) => { if (err) showAddressOnly(el); });
      return true;
    }
    return false;
  }

  function ensureQr(attempts) {
    if (renderQr()) return;
    if (attempts <= 0) {
      const el = document.getElementById("qrcode");
      if (el) showAddressOnly(el);
      return;
    }
    setTimeout(() => ensureQr(attempts - 1), 80);
  }
  ensureQr(40);
  window.addEventListener("load", () => ensureQr(10));

  /* Check my payment — Tronscan only until API exists */
  const txForm = document.getElementById("txCheckForm");
  const txInput = document.getElementById("txHashInput");
  const txMsg = document.getElementById("txCheckMsg");
  if (txForm && txInput) {
    txForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const cleaned = (txInput.value || "").trim().replace(/^0x/i, "");
      const ok = /^[a-fA-F0-9]{64}$/.test(cleaned);
      if (!ok) {
        if (txMsg) {
          txMsg.classList.add("is-error");
          txMsg.textContent = "Enter a 64-character TRON transaction ID, then try again.";
        }
        txInput.focus();
        return;
      }
      if (txMsg) {
        txMsg.classList.remove("is-error");
        txMsg.textContent = "Paste your transaction ID to view it on Tronscan.";
      }
      const win = window.open(
        "https://tronscan.org/#/transaction/" + cleaned,
        "_blank",
        "noopener,noreferrer"
      );
      if (win) win.opener = null;
    });
  }

  const stickyCopy = document.getElementById("stickyCopyBtn");
  if (stickyCopy) {
    stickyCopy.addEventListener("click", () => {
      const target = document.getElementById("providerAddress");
      if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      if (copyBtn) copyBtn.click();
    });
  }
})();
