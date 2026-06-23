const guests = [
  { id: "1", name: "Familia García", passes: 4 },
  { id: "2", name: "Ana Martínez", passes: 2 },
  { id: "3", name: "Carlos y Sofía López", passes: 2 },
  { id: "4", name: "Familia Rodríguez", passes: 6 },
  { id: "5", name: "María Fernanda Pérez", passes: 1 }
];

window.guests = guests;
window.LocalGuestSeeds = {
  ...(window.LocalGuestSeeds || {}),
  joserafaelynathalia2026: guests.reduce((acc, guest) => {
    acc[String(guest.id)] = {
      id: String(guest.id),
      nombre: guest.name,
      pases: Number(guest.passes || 1),
      activo: true
    };
    return acc;
  }, {})
};

window.seedEventGuestsToFirebase = async function seedEventGuestsToFirebase() {
  const eventId = window.config?.event?.defaultEventId || "joserafaelynathalia2026";
  const rsvpDB = window.RSVPDatabase;
  if (!rsvpDB?.migrateLocalGuestsToFirebase) {
    console.warn("RSVPDatabase no está disponible. Revisa que database.js esté cargado.");
    return { ok: false, guests: 0 };
  }

  await rsvpDB.seedEventConfigToFirebase?.(eventId, { force: true });
  const result = await rsvpDB.migrateLocalGuestsToFirebase(eventId, { force: true });
  console.log(`Invitados creados en Firebase: ${result.total || guests.length}`);
  return { ok: true, guests: result.total || guests.length };
};

function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function notifyGuestUpdated() {
  window.dispatchEvent(new CustomEvent("guest:updated", { detail: window.currentGuest || null }));
}

function renderGuestCard(guest) {
  const nameEl = document.getElementById("guestCardName");
  const seatsEl = document.getElementById("guestCardSeats");
  const seatsTxtEl = document.getElementById("guestCardSeatsTxt");
  const passes = Math.max(1, Number(guest?.passes || 1));

  if (nameEl) nameEl.textContent = guest?.name || "Invitado especial";
  if (seatsEl) seatsEl.textContent = String(passes);
  if (seatsTxtEl) seatsTxtEl.textContent = passes === 1 ? "lugar" : "lugares";
}

function setCurrentGuest(guest) {
  if (!guest) {
    window.currentGuest = { id: getQueryParam("id") || "guest", name: "Invitado especial", passes: 1 };
    renderGuestCard(window.currentGuest);
    notifyGuestUpdated();
    return;
  }

  window.currentGuest = {
    id: String(guest.id),
    name: String(guest.name || guest.nombre || "Invitado especial").trim() || "Invitado especial",
    passes: Math.max(1, Number(guest.passes || guest.pases) || 1)
  };

  renderGuestCard(window.currentGuest);
  notifyGuestUpdated();
}

function waitForRSVPDatabase(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = window.setInterval(() => {
      if (window.RSVPDatabase?.getInvitadoById) {
        window.clearInterval(timer);
        resolve(window.RSVPDatabase);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        window.clearInterval(timer);
        reject(new Error("RSVPDatabase no disponible."));
      }
    }, 50);
  });
}

async function loadRemoteGuest(guestId) {
  try {
    const eventId = window.config?.event?.defaultEventId || "joserafaelynathalia2026";
    console.log("[RSVP][GuestLoad] Esperando Firebase para leer invitado", {
      firebaseReady: Boolean(window.firebaseReady),
      eventId,
      guestId,
      path: `eventos/${eventId}/invitados/${guestId}`
    });
    const db = await waitForRSVPDatabase();
    const remoteGuest = await db.getInvitadoById(eventId, guestId);
    if (remoteGuest && remoteGuest.activo !== false) {
      console.log("[RSVP][GuestLoad] Invitado encontrado en Firebase", remoteGuest);
      setCurrentGuest(remoteGuest);
      return;
    }

    console.warn("[RSVP][GuestLoad] Invitado no encontrado o inactivo en Firebase", {
      eventId,
      guestId
    });
  } catch (error) {
    console.warn("[RSVP][GuestLoad] No se pudo cargar invitado remoto", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const guestId = getQueryParam("id");
  console.log("[RSVP][GuestLoad] DOM listo. Leyendo parámetro ?id=", {
    guestId,
    firebaseReady: Boolean(window.firebaseReady),
    hasDatabase: Boolean(window.RSVPDatabase)
  });

  if (getQueryParam("seedGuests") === "1") window.seedEventGuestsToFirebase();

  if (!guestId) {
    setCurrentGuest(null);
    return;
  }

  const localGuest = guests.find((guest) => String(guest.id) === String(guestId));
  setCurrentGuest(localGuest || { id: guestId, name: "Invitado especial", passes: 1 });
  loadRemoteGuest(guestId);
});
