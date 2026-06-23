const eventDate = new Date("2026-10-24T16:00:00-06:00");
const galleryImages = ["images/V1.jpeg", "images/V2.jpeg", "images/V3.jpeg", "images/V4.jpeg", "images/V5.jpeg", "images/H1.jpeg"];
let currentGalleryIndex = 0;
let invitationOpened = false;
let currentSlideIndex = 0;

function updateMusicButton(isPlaying) {
  const musicToggle = document.getElementById("musicToggle");
  const stateIcon = musicToggle?.querySelector("i");
  if (!musicToggle || !stateIcon) return;

  musicToggle.setAttribute("aria-pressed", isPlaying ? "true" : "false");
  musicToggle.setAttribute("aria-label", isPlaying ? "Pausar música" : "Reproducir música");
  stateIcon.className = isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";
}

async function startMusic() {
  const audio = document.getElementById("weddingMusic");
  if (!audio) return;

  try {
    await audio.play();
    updateMusicButton(true);
  } catch (error) {
    console.warn("Autoplay bloqueado. La música queda disponible en la burbuja.", error);
    updateMusicButton(false);
  }
}

function revealMusicBubble() {
  const musicToggle = document.getElementById("musicToggle");
  if (!musicToggle) return;
  musicToggle.hidden = false;
  requestAnimationFrame(() => musicToggle.classList.add("is-visible"));
}

function openInvitation() {
  if (invitationOpened) return;
  invitationOpened = true;
  const cover = document.getElementById("cover");
  const invitation = document.getElementById("invitation");
  if (cover) {
    cover.classList.add("is-leaving");
    window.setTimeout(() => {
      cover.style.display = "none";
    }, 650);
  }
  if (invitation) {
    invitation.classList.add("is-open");
    invitation.setAttribute("aria-hidden", "false");
  }
  revealMusicBubble();
  startMusic();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateCountdown() {
  const diff = Math.max(0, eventDate.getTime() - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const values = { days, hours, mins, secs };
  Object.entries(values).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value).padStart(2, "0");
  });
}

function showModal(el) {
  if (!el) return;
  el.style.display = "flex";
  el.setAttribute("aria-hidden", "false");
}

function hideModal(el) {
  if (!el) return;
  el.style.display = "none";
  el.setAttribute("aria-hidden", "true");
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
}

function renderLightbox() {
  const img = document.getElementById("lightboxImg");
  if (img) img.src = galleryImages[currentGalleryIndex];
}

function openLightbox(index) {
  currentGalleryIndex = index;
  renderLightbox();
  showModal(document.getElementById("lightbox"));
}

function moveLightbox(step) {
  currentGalleryIndex = (currentGalleryIndex + step + galleryImages.length) % galleryImages.length;
  renderLightbox();
}

function startPhotoSlider() {
  const track = document.querySelector(".slider-track");
  if (!track) return;
  const slides = track.querySelectorAll("img");
  if (slides.length <= 1) return;

  window.setInterval(() => {
    currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
  }, 3500);
}

function toggleCollapsiblePanel(panel) {
  if (!panel) return;
  const isOpen = panel.classList.toggle("is-open");
  panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
}

function getEventId() {
  return window.config?.event?.defaultEventId || "joserafaelynathalia2026";
}

async function handleWishSubmit(event) {
  event.preventDefault();
  console.log("[Wishes] Submit recibido.");

  const form = event.currentTarget;
  const name = document.getElementById("wish-name");
  const message = document.getElementById("wish-message");
  const status = document.getElementById("wish-status");
  const nombre = String(name?.value || "").trim();
  const mensaje = String(message?.value || "").trim();
  const eventId = getEventId();

  console.log("[Wishes] Verificando Firebase antes de escribir", {
    firebaseReady: Boolean(window.firebaseReady),
    hasSaveWish: Boolean(window.RSVPDatabase?.saveWish),
    path: `eventos/${eventId}/deseos`
  });

  if (!nombre || !mensaje) {
    console.warn("[Wishes] Formulario incompleto.");
    if (status) status.textContent = "Completa nombre y mensaje para continuar.";
    return false;
  }

  try {
    if (!window.RSVPDatabase?.saveWish) {
      throw new Error("Firebase no disponible");
    }

    console.log("[Wishes] Intentando escribir en Firebase", `eventos/${eventId}/deseos`, { nombre, mensaje });
    await window.RSVPDatabase.saveWish(eventId, { nombre, mensaje, timestamp: Date.now() });
    console.log("[Wishes] Mensaje guardado con éxito.");
    if (status) status.textContent = "Gracias por compartir tus buenos deseos.";
    form.reset();
    console.log("[Wishes] Formulario limpiado después del envío.");
  } catch (error) {
    console.error("[Wishes] Error al enviar mensaje", error);
    if (status) status.textContent = "No se pudo enviar el mensaje. Intenta nuevamente.";
  }

  return false;
}

function renderWishes(records) {
  const list = document.getElementById("wishes");
  if (!list) return;
  list.innerHTML = "";
  (records || []).slice(0, 40).forEach((wish) => {
    const card = document.createElement("article");
    card.className = "wish-card";
    const name = document.createElement("strong");
    name.textContent = wish.nombre || "Invitado";
    const message = document.createElement("p");
    message.textContent = wish.mensaje || "";
    card.append(name, message);
    list.appendChild(card);
  });
}

window.submitWish = handleWishSubmit;

function waitForDatabase(callback, tries = 0) {
  if (window.RSVPDatabase) {
    callback(window.RSVPDatabase);
    return;
  }
  if (tries > 160) return;
  window.setTimeout(() => waitForDatabase(callback, tries + 1), 50);
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Wishes] DOM listo. Verificando inicialización global.", {
    firebaseReady: Boolean(window.firebaseReady),
    hasDatabase: Boolean(window.RSVPDatabase)
  });
  document.getElementById("btnOpenInvite")?.addEventListener("click", openInvitation);
  document.getElementById("btnOpenEnvelope")?.addEventListener("click", openInvitation);
  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, { threshold: 0.16 });
  document.querySelectorAll(".fade-in-element").forEach((el) => observer.observe(el));
  startPhotoSlider();

  const accounts = document.getElementById("accountsBackdrop");
  document.getElementById("btnVerCuentas")?.addEventListener("click", () => showModal(accounts));
  document.getElementById("btnCloseAccounts")?.addEventListener("click", () => hideModal(accounts));
  accounts?.addEventListener("click", (event) => {
    if (event.target === accounts) hideModal(accounts);
  });
  document.querySelectorAll(".copy-account").forEach((button) => {
    button.addEventListener("click", async () => {
      const account = button.closest(".account");
      await copyText(account?.dataset.copy || "");
      button.textContent = "Copiado";
      button.classList.add("copied");
      window.setTimeout(() => {
        button.textContent = "Copiar";
        button.classList.remove("copied");
      }, 1800);
    });
  });

  document.querySelectorAll("[data-gallery-index]").forEach((button) => {
    button.addEventListener("click", () => openLightbox(Number(button.dataset.galleryIndex || 0)));
  });
  const lightbox = document.getElementById("lightbox");
  document.getElementById("lightboxClose")?.addEventListener("click", () => hideModal(lightbox));
  document.getElementById("lightPrev")?.addEventListener("click", () => moveLightbox(-1));
  document.getElementById("lightNext")?.addEventListener("click", () => moveLightbox(1));
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) hideModal(lightbox);
  });

  document.getElementById("btnToggleWishForm")?.addEventListener("click", () => {
    toggleCollapsiblePanel(document.getElementById("wishFormPanel"));
  });
  document.getElementById("btnToggleWishes")?.addEventListener("click", () => {
    toggleCollapsiblePanel(document.getElementById("wishesPanel"));
  });

  const wishForm = document.getElementById("wish-form");
  if (wishForm) {
    wishForm.addEventListener("submit", handleWishSubmit);
    console.log("[Wishes] Listener de submit conectado al formulario.");
  } else {
    console.error("[Wishes] No se encontró el formulario de buenos deseos.");
  }

  document.addEventListener("keydown", (event) => {
    if (lightbox?.style.display !== "flex") return;
    if (event.key === "Escape") hideModal(lightbox);
    if (event.key === "ArrowLeft") moveLightbox(-1);
    if (event.key === "ArrowRight") moveLightbox(1);
  });

  document.getElementById("musicToggle")?.addEventListener("click", async () => {
    const audio = document.getElementById("weddingMusic");
    if (!audio) return;
    if (audio.paused) {
      await startMusic();
      return;
    }
    audio.pause();
    updateMusicButton(false);
  });

  waitForDatabase((db) => {
    console.log("[Wishes] Firebase listo. Inicializando suscripción de buenos deseos.", getEventId());
    if (db.subscribeToWishes) db.subscribeToWishes(getEventId(), renderWishes, console.error);
  });
});
