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
  let answer = null;
  let confirmedState = null;

  const eventId = window.config?.event?.defaultEventId || "joserafaelynathalia2026";
  console.log("[RSVP] Inicializando RSVP", { eventId, guest });

  const inputName = $("#rsvpNombre");
  const membersWrap = $("#rsvpMembersWrap");
  const membersList = $("#rsvpMembersList");
  const btnYes = $("#btnRsvpSi");
  const btnNo = $("#btnRsvpNo");
  const btnConfirm = $("#btnConfirmarRsvp");
  const msg = $("#msgRsvp");
  const intro = $("#rsvpSection .rsvp-strong");
  const actions = $("#rsvpInline .rsvp-actions");
  const inlineBlock = $("#rsvpInline");
  const showResult = setupResultModal();

  if (!inputName || !membersWrap || !membersList || !btnYes || !btnNo || !btnConfirm || !msg || !intro) {
    console.error("[RSVP] Elementos del formulario no encontrados.");
    return;
  }

  console.log("[RSVP] Listeners activos", {
    yesButton: Boolean(btnYes),
    noButton: Boolean(btnNo),
    confirmButton: Boolean(btnConfirm)
  });

  const hasMembers = () => guest.members.length > 0;

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
    return guest.members.filter((member) => !confirmedIds.has(member.id) && !declinedIds.has(member.id));
  };

  const getTotalConfirmedPasses = (extraMembers = []) => {
    const merged = [...getConfirmedMembers()];
    const seen = new Set(merged.map((member) => member.id));

    extraMembers.forEach((member) => {
      if (!member || seen.has(member.id)) return;
      seen.add(member.id);
      merged.push(member);
    });

    return merged.reduce((total, member) => total + member.passes, 0);
  };

  const hasPendingMembers = () => hasMembers() && getPendingMembers().length > 0;

  const getSelectedMembers = () => {
    if (!hasMembers()) return [];

    return Array.from(membersList.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)'))
      .map((input) => guest.members.find((member) => member.id === input.value))
      .filter(Boolean);
  };

  const renderMembers = (selectedMemberIds = []) => {
    membersList.innerHTML = "";
    if (!hasMembers()) return;

    const confirmedIds = getConfirmedMemberIds();
    const declinedIds = getDeclinedMemberIds();

    guest.members.forEach((member) => {
      const label = document.createElement("label");
      label.className = "rsvp-member-item";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = member.id;
      const isConfirmed = confirmedIds.has(member.id);
      const isDeclined = declinedIds.has(member.id);
      input.checked = isConfirmed || selectedMemberIds.includes(member.id);
      input.disabled = isConfirmed || isDeclined;

      const text = document.createElement("div");
      const strong = document.createElement("strong");
      const span = document.createElement("span");

      strong.textContent = member.name;
      span.textContent = isConfirmed
        ? `Asistencia confirmada · ${member.passes} ${member.passes === 1 ? "pase asignado" : "pases asignados"}`
        : isDeclined
        ? `No podrá asistir · ${member.passes} ${member.passes === 1 ? "pase asignado" : "pases asignados"}`
        : `${member.passes} ${member.passes === 1 ? "pase asignado" : "pases asignados"}`;

      text.appendChild(strong);
      text.appendChild(span);
      label.appendChild(input);
      label.appendChild(text);
      membersList.appendChild(label);
    });
  };

  const syncVisibleFields = (preferredGuestCount) => {
    if (answer !== "yes" && answer !== "no") {
      if (confirmedState && hasMembers() && hasPendingMembers()) {
        membersWrap.style.display = "block";
        return;
      }

      if (hasMembers()) {
        membersWrap.style.display = "block";
        return;
      }

      membersWrap.style.display = "none";
      return;
    }

    if (!hasMembers()) {
      membersWrap.style.display = "none";
      return;
    }

    membersWrap.style.display = "block";

    if (confirmedState && !hasPendingMembers()) {
      membersWrap.style.display = "none";
    }
  };

  const renderGuestFields = (selectedMemberIds = [], preferredGuestCount) => {
    console.log("[RSVP] Renderizando invitado", guest);
    inputName.value = guest.name;
    inputName.disabled = true;
    intro.textContent = RSVP_OPEN_MESSAGE;
    renderMembers(selectedMemberIds);
    syncVisibleFields(preferredGuestCount);
  };

  const setActive = (type) => {
    btnYes.classList.toggle("is-active", type === "yes");
    btnNo.classList.toggle("is-active", type === "no");
  };

  const setDisabledState = (disabled) => {
    btnYes.disabled = disabled;
    btnNo.disabled = disabled;
    btnConfirm.disabled = disabled;
    inputName.disabled = disabled;
    membersList.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.disabled = disabled;
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

  const buildResolvedState = (state) => ({
    ...state,
    memberSelections: mergeMemberSelections([], state.memberSelections),
    declinedSelections: mergeMemberSelections([], state.declinedSelections)
  });

  const applyPartialConfirmationState = (state) => {
    confirmedState = buildResolvedState(state);
    answer = null;
    setActive(null);
    btnNo.disabled = false;
    renderGuestFields();
    btnConfirm.disabled = false;
    if (actions) actions.style.display = "grid";
    btnConfirm.style.display = "inline-flex";
    if (inlineBlock) inlineBlock.style.display = "grid";
    intro.textContent = "Tu confirmación sigue abierta para los integrantes pendientes.";
    msg.style.display = "none";
    msg.className = "rsvp-msg";
    msg.textContent = "";
  };

  const paintConfirmed = (state) => {
    confirmedState = state.answer === "yes" || Array.isArray(state.declinedSelections)
      ? buildResolvedState(state)
      : null;
    answer = state.answer;
    setActive(answer);

    const selectedIds = Array.isArray(state.memberSelections)
      ? state.memberSelections.map((member) => String(member.id || "")).filter(Boolean)
      : [];

    renderGuestFields(selectedIds, state.guests || 1);
    setDisabledState(true);
    if (actions) actions.style.display = "none";
    btnConfirm.style.display = "none";
    membersWrap.style.display = "none";
    if (inlineBlock) inlineBlock.style.display = "none";
    intro.textContent = "Gracias por haber completado el formulario de asistencia";
    msg.style.display = "block";
    msg.className = "rsvp-msg ok";
    msg.textContent =
      answer === "yes"
        ? "Gracias por confirmar tu asistencia, te vemos pronto."
        : "Lamentamos que no puedas acompañarnos, te extrañaremos.";
  };

  const applyClosedState = () => {
    answer = null;
    setActive(null);
    intro.textContent = RSVP_CLOSED_MESSAGE;
    membersWrap.style.display = "none";
    btnConfirm.style.display = "none";
    if (actions) actions.style.display = "none";
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
          hasMembers()
          && (remoteState.memberSelections.length + remoteState.declinedSelections.length) > 0
          && (remoteState.memberSelections.length + remoteState.declinedSelections.length) < guest.members.length
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
            hasMembers()
            && ((savedState.memberSelections || []).length + (savedState.declinedSelections || []).length) > 0
            && ((savedState.memberSelections || []).length + (savedState.declinedSelections || []).length) < guest.members.length
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
    answer = null;
    confirmedState = null;
    setActive(null);
    btnNo.disabled = false;
    renderGuestFields();
  });

  membersList.addEventListener("change", () => {
    if (answer !== "yes" && answer !== "no") return;
    syncVisibleFields();
  });

  btnYes.addEventListener("click", () => {
    console.log("[RSVP] Click Sí");
    answer = "yes";
    setActive("yes");
    syncVisibleFields();
  });

  btnNo.addEventListener("click", () => {
    console.log("[RSVP] Click No");
    answer = "no";
    setActive("no");
    syncVisibleFields();
  });

  btnConfirm.addEventListener("click", async () => {
    console.log("[RSVP] Click confirmar", { answer, guest });

    if (isRsvpClosed()) {
      applyClosedState();
      return;
    }

    if (!answer) {
      msg.style.display = "block";
      msg.className = "rsvp-msg error";
      msg.textContent = "Por favor selecciona una opción para continuar.";
      return;
    }

    const selectedMembers = answer === "yes" ? getSelectedMembers() : [];
    const selectedPendingMembers = answer === "no" && confirmedState ? getSelectedMembers() : [];
    if (answer === "yes" && hasMembers() && selectedMembers.length === 0) {
      msg.style.display = "block";
      msg.className = "rsvp-msg error";
      msg.textContent = confirmedState
        ? "Selecciona al menos un integrante pendiente para continuar."
        : "Selecciona al menos un integrante para continuar.";
      return;
    }

    if (answer === "no" && confirmedState && selectedPendingMembers.length === 0) {
      msg.style.display = "block";
      msg.className = "rsvp-msg error";
      msg.textContent = "Selecciona al menos un integrante pendiente para marcar que no asistira.";
      return;
    }

    btnConfirm.disabled = true;

    const mergedMembers = answer === "yes"
      ? mergeMemberSelections(getConfirmedMembers(), selectedMembers)
      : getConfirmedMembers();
    const mergedDeclinedMembers = answer === "no" && confirmedState
      ? mergeMemberSelections(getDeclinedMembers(), selectedPendingMembers)
      : answer === "no" && hasMembers()
      ? mergeMemberSelections([], guest.members)
      : getDeclinedMembers();
    const totalConfirmedGuests = (answer === "yes" || getConfirmedMembers().length > 0)
      ? hasMembers()
        ? mergedMembers.reduce((total, member) => total + member.passes, 0)
        : Math.max(1, Number(guest.passes || 1))
      : 0;
    const resolvedMemberIds = new Set([
      ...mergedMembers.map((member) => member.id),
      ...mergedDeclinedMembers.map((member) => member.id)
    ]);
    const hasOpenPendingMembers = hasMembers() && guest.members.some((member) => !resolvedMemberIds.has(member.id));
    const finalAnswer = answer === "yes"
      ? "yes"
      : hasMembers()
      ? (mergedMembers.length > 0 ? "yes" : (hasOpenPendingMembers ? "yes" : "no"))
      : "no";

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
      btnConfirm.disabled = false;
      msg.style.display = "block";
      msg.className = "rsvp-msg error";
      msg.textContent = error?.code === "RSVP_ALREADY_CONFIRMED"
        ? "Esta invitación ya fue confirmada anteriormente."
        : "Tu confirmación quedó guardada en este dispositivo. Revisa Firebase.";
      return;
    }

    console.log("[RSVP] Confirmación completada", state);
    const popupText = finalAnswer === "yes"
      ? "Gracias por confirmar tu asistencia, te vemos pronto"
      : "Lamentamos que no puedas acompanarnos, te extranaremos";

    showResult(popupText);
    if (hasMembers() && hasOpenPendingMembers) {
      applyPartialConfirmationState(state);
      return;
    }

    paintConfirmed(state);
  });

  hydrateConfirmationState().then((isConfirmed) => {
    if (!isConfirmed && isRsvpClosed()) applyClosedState();
  });
});
