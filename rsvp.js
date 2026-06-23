const $ = (s) => document.querySelector(s);

function getGuest() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "guest";
  const data = window.currentGuest || null;
  console.log("[RSVP] Leyendo ?id= de la URL", { id });
  return {
    id: String(data?.id || id),
    name: data?.name || "Invitado",
    passes: Math.max(1, Number(data?.passes || 1)),
  };
}

function keyFor(id) {
  return `rsvp_state_${id}`;
}

function waitForRSVPDatabase(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = window.setInterval(() => {
      if (window.RSVPDatabase?.getConfirmationByGuestId) {
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

function setupResultModal() {
  const backdrop = document.getElementById("rsvpResultBackdrop");
  const textEl = document.getElementById("rsvpResultText");
  const btnClose = document.getElementById("btnCloseRsvpResult");
  const btnOk = document.getElementById("btnOkRsvpResult");

  const close = () => {
    if (!backdrop) return;
    backdrop.classList.remove("is-open");
    setTimeout(() => {
      backdrop.style.display = "none";
      backdrop.setAttribute("aria-hidden", "true");
    }, 260);
  };

  if (btnClose) btnClose.addEventListener("click", close);
  if (btnOk) btnOk.addEventListener("click", close);
  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });
  }

  return (text) => {
    if (!backdrop || !textEl) return;
    textEl.textContent = text;
    backdrop.style.display = "flex";
    backdrop.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => backdrop.classList.add("is-open"));
  };
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("[RSVP] DOM listo. Verificando Firebase.", {
    firebaseReady: Boolean(window.firebaseReady),
    hasDatabase: Boolean(window.RSVPDatabase)
  });
  let guest = getGuest();
  const eventId = window.config?.event?.defaultEventId || "joserafaelynathalia2026";
  console.log("[RSVP] Inicializando RSVP", { eventId, guest });
  const inputName = $("#rsvpNombre");
  const selectGuests = $("#rsvpGuests");
  const guestsWrap = $("#rsvpGuestsWrap");
  const btnYes = $("#btnRsvpSi");
  const btnNo = $("#btnRsvpNo");
  const btnConfirm = $("#btnConfirmarRsvp");
  const msg = $("#msgRsvp");
  const intro = $("#rsvpSection .rsvp-strong");
  const actions = $("#rsvpInline .rsvp-actions");
  const inlineBlock = $("#rsvpInline");
  const showResult = setupResultModal();

  if (!inputName || !selectGuests || !guestsWrap || !btnYes || !btnNo || !btnConfirm || !msg || !intro) {
    console.error("[RSVP] Elementos del formulario no encontrados.");
    return;
  }

  console.log("[RSVP] Listeners activos", {
    yesButton: Boolean(btnYes),
    noButton: Boolean(btnNo),
    confirmButton: Boolean(btnConfirm)
  });

  const renderGuestFields = () => {
    console.log("[RSVP] Renderizando invitado", guest);
    inputName.value = guest.name;
    selectGuests.innerHTML = "";
    for (let i = 1; i <= guest.passes; i += 1) {
      const option = document.createElement("option");
      option.value = String(i);
      option.textContent = String(i);
      selectGuests.appendChild(option);
    }
  };

  renderGuestFields();

  window.addEventListener("guest:updated", () => {
    guest = getGuest();
    renderGuestFields();
  });

  let answer = null;

  const setActive = (type) => {
    btnYes.classList.toggle("is-active", type === "yes");
    btnNo.classList.toggle("is-active", type === "no");
  };

  const paintConfirmed = (state) => {
    answer = state.answer;
    setActive(answer);
    guestsWrap.style.display = answer === "yes" ? "block" : "none";
    if (answer === "yes") {
      selectGuests.value = String(state.guests || 1);
    }
    btnYes.disabled = true;
    btnNo.disabled = true;
    btnConfirm.disabled = true;
    if (actions) actions.style.display = "none";
    btnConfirm.style.display = "none";
    guestsWrap.style.display = "none";
    if (inlineBlock) inlineBlock.style.display = "none";
    intro.textContent = "Gracias por haber completado el formulario de asistencia";
    msg.style.display = "block";
    msg.className = "rsvp-msg ok";
    msg.textContent =
      answer === "yes"
        ? "Gracias por confirmar tu asistencia, te vemos pronto."
        : "Lamentamos que no puedas acompañarnos, te extrañaremos.";
  };

  async function hydrateConfirmationState() {
    const storageKey = keyFor(guest.id);
    const savedRaw = localStorage.getItem(storageKey);

    try {
      const rsvpDB = await waitForRSVPDatabase();
      console.log("[RSVP] Consultando confirmación remota", `eventos/${eventId}/rsvp/${guest.id}`);
      const remoteConfirmation = await rsvpDB.getConfirmationByGuestId(eventId, guest.id);

      if (remoteConfirmation) {
        const remoteState = {
          eventId,
          guestId: guest.id,
          guestName: guest.name,
          assignedPasses: guest.passes,
          answer: remoteConfirmation.respuesta === "no" ? "no" : "yes",
          guests: Number(remoteConfirmation.cantidadConfirmada || 0),
          at: Number(remoteConfirmation.fechaConfirmacion || Date.now()),
          atLocal: new Date(Number(remoteConfirmation.fechaConfirmacion || Date.now())).toISOString()
        };
        localStorage.setItem(storageKey, JSON.stringify(remoteState));
        console.log("[RSVP] Confirmación remota encontrada", remoteState);
        paintConfirmed(remoteState);
        return true;
      }

      if (savedRaw) {
        console.warn("[RSVP] Había confirmación local pero no existe en Firebase. Limpiando estado local.", { guestId: guest.id });
        localStorage.removeItem(storageKey);
      }
      return false;
    } catch (error) {
      console.warn("[RSVP] No se pudo consultar confirmación remota. Usando fallback local si existe.", error);

      if (!savedRaw) return false;

      try {
        const savedState = JSON.parse(savedRaw);
        if (savedState?.eventId === eventId && savedState?.guestId === guest.id) {
          console.log("[RSVP] Usando confirmación local fallback", savedState);
          paintConfirmed(savedState);
          return true;
        }
        localStorage.removeItem(storageKey);
      } catch {
        localStorage.removeItem(storageKey);
      }

      return false;
    }
  }

  btnYes.addEventListener("click", () => {
    console.log("[RSVP] Click Sí");
    answer = "yes";
    setActive("yes");
    guestsWrap.style.display = "block";
  });

  btnNo.addEventListener("click", () => {
    console.log("[RSVP] Click No");
    answer = "no";
    setActive("no");
    guestsWrap.style.display = "none";
  });

  btnConfirm.addEventListener("click", async () => {
    console.log("[RSVP] Click confirmar", { answer, guest });
    if (!answer) {
      msg.style.display = "block";
      msg.className = "rsvp-msg error";
      msg.textContent = "Por favor selecciona una opción para continuar.";
      return;
    }

    btnConfirm.disabled = true;

    const state = {
      eventId,
      guestId: guest.id,
      guestName: guest.name,
      assignedPasses: guest.passes,
      answer,
      guests: answer === "yes" ? Number(selectGuests.value || 1) : 0,
      at: Date.now(),
      atLocal: new Date().toISOString(),
    };

    try {
      const rsvpDB = window.RSVPDatabase;
      console.log("[RSVP] Estado Firebase antes de guardar", {
        firebaseReady: Boolean(window.firebaseReady),
        hasSaveConfirmation: Boolean(rsvpDB?.saveConfirmation)
      });
      if (!rsvpDB?.saveConfirmation) {
        throw new Error("Firebase RSVPDatabase no disponible");
      }
      if (rsvpDB?.saveConfirmation) {
        console.log("[RSVP] Intentando guardar en Firebase", `eventos/${eventId}/rsvp/${guest.id}`);
        await rsvpDB.saveConfirmation(eventId, {
          id: guest.id,
          nombre: guest.name,
          pasesAsignados: guest.passes,
          respuesta: answer === "yes" ? "si" : "no",
          cantidadConfirmada: answer === "yes" ? Number(selectGuests.value || 1) : 0,
          fechaConfirmacion: Date.now(),
        });
        localStorage.setItem(keyFor(guest.id), JSON.stringify(state));
        console.log("[RSVP] Confirmación guardada en Firebase con éxito", `eventos/${eventId}/rsvp/${guest.id}`);
      }
    } catch (error) {
      console.error("[RSVP] Error al guardar confirmación", error);
      btnConfirm.disabled = false;
      msg.style.display = "block";
      msg.className = "rsvp-msg error";
      msg.textContent = error?.code === "RSVP_ALREADY_CONFIRMED"
        ? "Esta invitación ya fue confirmada anteriormente."
        : "Tu confirmación quedó guardada en este dispositivo. Revisa Firebase.";
      return;
    }

    console.log("[RSVP] Confirmación completada", state);
    const popupText =
      answer === "yes"
        ? "Gracias por confirmar tu asistencia, te vemos pronto."
        : "Lamentamos que no puedas acompañarnos, te extrañaremos.";

    showResult(popupText);
    paintConfirmed(state);
  });

  hydrateConfirmationState();
});
