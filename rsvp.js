const $ = (s) => document.querySelector(s);

const RSVP_OPEN_MESSAGE = "Para nosotros es muy importante que confirmes tu asistencia antes del 30 de septiembre, o bien que nos indiques si no podrás acompañarnos.";
const RSVP_CLOSED_MESSAGE = "Los extrañaremos y esperamos tener la oportunidad de compartir con ustedes en otra ocasión. Gracias por su comprensión y por acompañarnos con su cariño y buenos deseos.";
const RSVP_DEADLINE = new Date("2026-09-30T23:59:59-06:00").getTime();

function normalizeGuestMembers(rawMembers) {
  if (!Array.isArray(rawMembers)) return [];

  return rawMembers
    .map((member, index) => {
      const name = String(member?.name || member?.nombre || "").trim();
      if (!name) return null;

      return {
        id: String(member?.id || `member-${index + 1}`),
        name,
        passes: Math.max(1, Number(member?.passes || member?.pases || member?.pasesAsignados || 1))
      };
    })
    .filter(Boolean);
}

function getGuest() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "guest";
  const data = window.currentGuest || null;
  console.log("[RSVP] Leyendo ?id= de la URL", { id });
  return {
    id: String(data?.id || id),
    name: data?.name || "Invitado",
    passes: Math.max(1, Number(data?.passes || 1)),
    members: normalizeGuestMembers(data?.members || data?.integrantes)
  };
}

function keyFor(id) {
  return `rsvp_state_${id}`;
}

function isRsvpClosed() {
  return Date.now() > RSVP_DEADLINE;
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
  let confirmedState = null;
  let savingMemberId = null;

  const eventId = window.config?.event?.defaultEventId || "joserafaelynathalia2026";
  console.log("[RSVP] Inicializando RSVP", { eventId, guest });

  const inputName = $("#rsvpNombre");
  const membersWrap = $("#rsvpMembersWrap");
  const membersList = $("#rsvpMembersList");
  const msg = $("#msgRsvp");
  const intro = $("#rsvpSection .rsvp-strong");
  const inlineBlock = $("#rsvpInline");
  const showResult = setupResultModal();

  if (!inputName || !membersWrap || !membersList || !msg || !intro) {
    console.error("[RSVP] Elementos del formulario no encontrados.");
    return;
  }

  const getDisplayMembers = () => {
    if (guest.members.length > 0) return guest.members;
    return [{
      id: guest.id,
      name: guest.name,
      passes: Math.max(1, Number(guest.passes || 1))
    }];
  };

  const getConfirmedMembers = () => Array.isArray(confirmedState?.memberSelections)
    ? confirmedState.memberSelections
    : [];

  const getDeclinedMembers = () => Array.isArray(confirmedState?.declinedSelections)
    ? confirmedState.declinedSelections
    : [];

  const getConfirmedMemberIds = () => new Set(getConfirmedMembers().map((member) => String(member.id || "")).filter(Boolean));
  const getDeclinedMemberIds = () => new Set(getDeclinedMembers().map((member) => String(member.id || "")).filter(Boolean));

  const getPendingMembers = () => {
    const confirmedIds = getConfirmedMemberIds();
    const declinedIds = getDeclinedMemberIds();
    return getDisplayMembers().filter((member) => !confirmedIds.has(member.id) && !declinedIds.has(member.id));
  };

  const hasPendingMembers = () => getPendingMembers().length > 0;

  const getMemberStatus = (member) => {
    const confirmedIds = getConfirmedMemberIds();
    const declinedIds = getDeclinedMemberIds();

    if (confirmedIds.has(member.id)) {
      return { kind: "confirmed", text: "Asistencia confirmada" };
    }

    if (declinedIds.has(member.id)) {
      return { kind: "declined", text: "No asistira" };
    }

    if (isRsvpClosed()) {
      return { kind: "pending", text: "No indico su confirmacion" };
    }

    return { kind: "open", text: "" };
  };

  const renderMembers = () => {
    membersList.innerHTML = "";

    getDisplayMembers().forEach((member) => {
      const item = document.createElement("div");
      item.className = "rsvp-member-item";
      item.dataset.memberId = member.id;

      const text = document.createElement("div");
      text.className = "rsvp-member-copy";
      const strong = document.createElement("strong");
      const span = document.createElement("span");
      const status = getMemberStatus(member);

      strong.textContent = member.name;
      span.textContent = `${member.passes} ${member.passes === 1 ? "pase asignado" : "pases asignados"}`;

      text.appendChild(strong);
      text.appendChild(span);

      const side = document.createElement("div");

      if (status.kind === "open") {
        const actions = document.createElement("div");
        actions.className = "rsvp-member-actions";

        const btnYes = document.createElement("button");
        btnYes.type = "button";
        btnYes.className = "rsvp-btn";
        btnYes.dataset.memberId = member.id;
        btnYes.dataset.answer = "yes";
        btnYes.textContent = "Sí, asistiré";

        const btnNo = document.createElement("button");
        btnNo.type = "button";
        btnNo.className = "rsvp-btn";
        btnNo.dataset.memberId = member.id;
        btnNo.dataset.answer = "no";
        btnNo.textContent = "No podré asistir";

        if (savingMemberId) {
          const disableButtons = savingMemberId !== member.id;
          btnYes.disabled = disableButtons || savingMemberId === member.id;
          btnNo.disabled = disableButtons || savingMemberId === member.id;
        }

        actions.append(btnYes, btnNo);
        side.appendChild(actions);
      } else {
        const statusEl = document.createElement("span");
        statusEl.className = `rsvp-member-status is-${status.kind}`;
        statusEl.textContent = status.text;
        side.appendChild(statusEl);
      }

      item.append(text, side);
      membersList.appendChild(item);
    });
  };

  const syncVisibleFields = () => {
    membersWrap.style.display = "block";
  };

  const renderGuestFields = () => {
    console.log("[RSVP] Renderizando invitado", guest);
    inputName.value = guest.name;
    inputName.disabled = true;
    renderMembers();
    syncVisibleFields();
  };

  const setDisabledState = (disabled) => {
    inputName.disabled = disabled;
    membersList.querySelectorAll("button").forEach((button) => {
      button.disabled = disabled;
    });
  };

  const mergeMemberSelections = (baseMembers, extraMembers) => {
    const merged = [];
    const seen = new Set();

    [...(baseMembers || []), ...(extraMembers || [])].forEach((member) => {
      if (!member) return;
      const id = String(member.id || "").trim();
      if (!id || seen.has(id)) return;
      seen.add(id);
      merged.push({
        id,
        name: member.name,
        passes: Math.max(1, Number(member.passes || 1))
      });
    });

    return merged;
  };

  const buildResolvedState = (state) => {
    const memberSelections = mergeMemberSelections([], state.memberSelections);
    const declinedSelections = mergeMemberSelections([], state.declinedSelections);

    if (memberSelections.length === 0 && declinedSelections.length === 0 && (state.answer === "yes" || state.answer === "no")) {
      const fallbackMembers = getDisplayMembers();
      if (state.answer === "yes") {
        return {
          ...state,
          memberSelections: fallbackMembers,
          declinedSelections: []
        };
      }

      return {
        ...state,
        memberSelections: [],
        declinedSelections: fallbackMembers
      };
    }

    return {
      ...state,
      memberSelections,
      declinedSelections
    };
  };

  const applyPartialConfirmationState = (state) => {
    confirmedState = buildResolvedState(state);
    renderGuestFields();
    if (inlineBlock) inlineBlock.style.display = "grid";
    intro.textContent = "Tu confirmación sigue abierta para los integrantes pendientes. No olvides que la fecha máxima es el 30 de septiembre.";
    msg.style.display = "none";
    msg.className = "rsvp-msg";
    msg.textContent = "";
  };

  const paintConfirmed = (state) => {
    confirmedState = buildResolvedState(state);
    renderGuestFields();
    setDisabledState(true);
    if (inlineBlock) inlineBlock.style.display = "grid";
    intro.textContent = "Gracias por haber completado el formulario de asistencia";
    msg.style.display = "block";
    msg.className = "rsvp-msg ok";
    msg.textContent =
      getConfirmedMembers().length > 0
        ? "Gracias por confirmar tu asistencia, te vemos pronto."
        : "Lamentamos que no puedas acompañarnos, te extrañaremos.";
  };

  const applyClosedState = () => {
    intro.textContent = RSVP_CLOSED_MESSAGE;
    renderGuestFields();
    if (inlineBlock) inlineBlock.classList.add("is-closed");
    setDisabledState(true);
    msg.style.display = "none";
  };

  async function hydrateConfirmationState() {
    const storageKey = keyFor(guest.id);
    const savedRaw = localStorage.getItem(storageKey);

    try {
      const rsvpDB = await waitForRSVPDatabase();
      console.log("[RSVP] Consultando confirmación remota", `eventos/${eventId}/rsvp/${guest.id}`);
      const remoteConfirmation = await rsvpDB.getConfirmationByGuestId(eventId, guest.id);

      if (remoteConfirmation) {
        const memberSelections = normalizeGuestMembers(remoteConfirmation.integrantesConfirmados).map((member) => ({
          id: member.id,
          name: member.name,
          passes: member.passes
        }));
        const declinedSelections = normalizeGuestMembers(remoteConfirmation.integrantesDeclinados).map((member) => ({
          id: member.id,
          name: member.name,
          passes: member.passes
        }));

        const remoteState = {
          eventId,
          guestId: guest.id,
          guestName: guest.name,
          assignedPasses: guest.passes,
          answer: remoteConfirmation.respuesta === "no" ? "no" : "yes",
          guests: Number(remoteConfirmation.cantidadConfirmada || 0),
          memberSelections,
          declinedSelections,
          at: Number(remoteConfirmation.fechaConfirmacion || Date.now()),
          atLocal: new Date(Number(remoteConfirmation.fechaConfirmacion || Date.now())).toISOString()
        };
        localStorage.setItem(storageKey, JSON.stringify(remoteState));
        console.log("[RSVP] Confirmación remota encontrada", remoteState);
        if (
          getDisplayMembers().length > 0
          && (remoteState.memberSelections.length + remoteState.declinedSelections.length) > 0
          && (remoteState.memberSelections.length + remoteState.declinedSelections.length) < getDisplayMembers().length
        ) {
          applyPartialConfirmationState(remoteState);
          return true;
        }

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
          if (
            getDisplayMembers().length > 0
            && ((savedState.memberSelections || []).length + (savedState.declinedSelections || []).length) > 0
            && ((savedState.memberSelections || []).length + (savedState.declinedSelections || []).length) < getDisplayMembers().length
          ) {
            applyPartialConfirmationState(savedState);
            return true;
          }

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

  renderGuestFields();

  window.addEventListener("guest:updated", () => {
    guest = getGuest();
    confirmedState = null;
    savingMemberId = null;
    if (inlineBlock) inlineBlock.classList.remove("is-closed");
    msg.style.display = "none";
    msg.className = "rsvp-msg";
    msg.textContent = "";
    intro.textContent = RSVP_OPEN_MESSAGE;
    renderGuestFields();
  });

  membersList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-member-id][data-answer]");
    if (!button) return;

    const submittedAnswer = button.dataset.answer;
    const memberId = String(button.dataset.memberId || "");
    const selectedMember = getDisplayMembers().find((member) => member.id === memberId);

    if (!selectedMember || savingMemberId) return;

    console.log("[RSVP] Click confirmar integrante", { submittedAnswer, memberId, guest });

    if (isRsvpClosed()) {
      applyClosedState();
      return;
    }

    if (getConfirmedMemberIds().has(memberId) || getDeclinedMemberIds().has(memberId)) {
      return;
    }

    savingMemberId = memberId;
    renderMembers();

    const mergedMembers = submittedAnswer === "yes"
      ? mergeMemberSelections(getConfirmedMembers(), [selectedMember])
      : getConfirmedMembers();
    const mergedDeclinedMembers = submittedAnswer === "no"
      ? mergeMemberSelections(getDeclinedMembers(), [selectedMember])
      : getDeclinedMembers();
    const totalConfirmedGuests = mergedMembers.reduce((total, member) => total + member.passes, 0);
    const resolvedMemberIds = new Set([
      ...mergedMembers.map((member) => member.id),
      ...mergedDeclinedMembers.map((member) => member.id)
    ]);
    const hasOpenPendingMembers = getDisplayMembers().some((member) => !resolvedMemberIds.has(member.id));
    const finalAnswer = hasOpenPendingMembers
      ? "yes"
      : (mergedMembers.length > 0 ? "yes" : "no");

    const state = {
      eventId,
      guestId: guest.id,
      guestName: guest.name,
      assignedPasses: guest.passes,
      answer: finalAnswer,
      guests: totalConfirmedGuests,
      memberSelections: mergedMembers,
      declinedSelections: mergedDeclinedMembers,
      at: Date.now(),
      atLocal: new Date().toISOString()
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
          respuesta: finalAnswer === "yes" ? "si" : "no",
          cantidadConfirmada: totalConfirmedGuests,
          integrantesConfirmados: mergedMembers.map((member) => ({
            id: member.id,
            nombre: member.name,
            pasesAsignados: member.passes
          })),
          integrantesDeclinados: mergedDeclinedMembers.map((member) => ({
            id: member.id,
            nombre: member.name,
            pasesAsignados: member.passes
          })),
          fechaConfirmacion: Date.now()
        });
        localStorage.setItem(keyFor(guest.id), JSON.stringify(state));
        console.log("[RSVP] Confirmación guardada en Firebase con éxito", `eventos/${eventId}/rsvp/${guest.id}`);
      }
    } catch (error) {
      console.error("[RSVP] Error al guardar confirmación", error);
      savingMemberId = null;
      renderMembers();
      msg.style.display = "block";
      msg.className = "rsvp-msg error";
      msg.textContent = error?.code === "RSVP_ALREADY_CONFIRMED"
        ? "Esta invitación ya fue confirmada anteriormente."
        : "Tu confirmación quedó guardada en este dispositivo. Revisa Firebase.";
      return;
    }

    console.log("[RSVP] Confirmación completada", state);
    const popupText = submittedAnswer === "yes"
      ? "Gracias por confirmar tu asistencia, te vemos pronto"
      : "Lamentamos que no puedas acompanarnos, te extranaremos";

    savingMemberId = null;
    showResult(popupText);
    if (hasOpenPendingMembers) {
      applyPartialConfirmationState(state);
      return;
    }

    paintConfirmed(state);
  });

  hydrateConfirmationState().then((isConfirmed) => {
    if (!isConfirmed && isRsvpClosed()) applyClosedState();
  });
});
