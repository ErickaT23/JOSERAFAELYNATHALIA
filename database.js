import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, get, onValue, push, ref, runTransaction, set } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

const firebaseConfig = window.firebaseConfig;

if (!firebaseConfig || !firebaseConfig.databaseURL) {
  console.error("[Firebase] Configuración no disponible. Revisa que config.js cargue antes de database.js.");
}

console.log("[Firebase] Inicializando app", {
  projectId: firebaseConfig && firebaseConfig.projectId,
  databaseURL: firebaseConfig && firebaseConfig.databaseURL
});

const app = initializeApp(firebaseConfig);
const db = getDatabase(app, firebaseConfig.databaseURL);
window.firebaseApp = app;
window.firebaseDb = db;
window.firebaseReady = true;
console.log("[Firebase] Realtime Database inicializada correctamente.", {
  databaseURL: firebaseConfig.databaseURL
});
const legacyWishesPrimaryPath = "buenos-deseos";
const legacyWishesSecondaryPath = "buenos_deseos";
const legacyRsvpBasePath = "rsvp-confirmaciones";

function resolveLegacyPolicy() {
  const eventConfig = (window && window.config && window.config.event) || {};
  const rawPolicy = eventConfig.legacyFallback;

  const defaultPolicy = {
    read: false,
    write: false,
    subscribe: false
  };

  if (typeof rawPolicy === "boolean") {
    return {
      read: rawPolicy,
      write: rawPolicy,
      subscribe: rawPolicy
    };
  }

  if (!rawPolicy || typeof rawPolicy !== "object") {
    return defaultPolicy;
  }

  return {
    read: Boolean(rawPolicy.read),
    write: Boolean(rawPolicy.write),
    subscribe: Boolean(rawPolicy.subscribe)
  };
}

function sanitizeFirebaseKey(value) {
  const raw = String(value || "").trim() || "default";
  return raw.replace(/[.#$\[\]/]/g, "_");
}

function resolveEventId(explicitEventId) {
  const fromArgument = String(explicitEventId || "").trim();
  if (fromArgument) return sanitizeFirebaseKey(fromArgument);

  const fromGlobal = String(
    (window && window.currentEventId)
    || (window && window.EventContext && window.EventContext.eventId)
    || (window && window.config && window.config.event && window.config.event.defaultEventId)
    || "default-event"
  ).trim();

  return sanitizeFirebaseKey(fromGlobal || "default-event");
}

function getEventBasePath(eventId) {
  return "eventos/" + resolveEventId(eventId);
}

function getEventConfigPath(eventId) {
  return getEventBasePath(eventId) + "/config";
}

function getEventInvitadosPath(eventId) {
  return getEventBasePath(eventId) + "/invitados";
}

function getEventRsvpPath(eventId) {
  return getEventBasePath(eventId) + "/rsvp";
}

function getEventDeseosPath(eventId) {
  return getEventBasePath(eventId) + "/deseos";
}

function getLegacyRsvpRef(guestId) {
  const safeId = sanitizeFirebaseKey(guestId);
  return ref(db, legacyRsvpBasePath + "/" + safeId);
}

function getEventRsvpRef(eventId, guestId) {
  const safeId = sanitizeFirebaseKey(guestId);
  return ref(db, getEventRsvpPath(eventId) + "/" + safeId + "/rsvp");
}

function getLegacyWishesPrimaryRef() {
  return ref(db, legacyWishesPrimaryPath);
}

function getLegacyWishesSecondaryRef() {
  return ref(db, legacyWishesSecondaryPath);
}

function getLegacyWishesRefs() {
  return [getLegacyWishesPrimaryRef(), getLegacyWishesSecondaryRef()];
}

function getEventWishesRef(eventId) {
  return ref(db, getEventDeseosPath(eventId));
}

function getEventConfigRef(eventId) {
  return ref(db, getEventConfigPath(eventId));
}

function mapRsvpSnapshotToArray(snapshot) {
  if (!snapshot || !snapshot.exists()) return [];
  const raw = snapshot.val();
  if (!raw || typeof raw !== "object") return [];

  return Object.entries(raw)
    .map(function ([key, value]) {
      if (!value || typeof value !== "object") return null;
      if (value.rsvp && typeof value.rsvp === "object") {
        return {
          ...value.rsvp,
          id: String((value.rsvp && value.rsvp.id) || value.id || key),
          nombre: String((value.rsvp && value.rsvp.nombre) || value.nombre || ""),
          pasesAsignados: Number((value.rsvp && value.rsvp.pasesAsignados) || value.pases || 0),
          _key: key
        };
      }
      return {
        ...value,
        _key: key
      };
    })
    .filter(Boolean);
}

function mapWishesSnapshotToArray(snapshot) {
  if (!snapshot || !snapshot.exists()) return [];
  const raw = snapshot.val();
  if (!raw || typeof raw !== "object") return [];

  return Object.entries(raw)
    .map(function ([key, value]) {
      if (!value || typeof value !== "object") return null;
      return {
        ...value,
        _key: key
      };
    })
    .filter(Boolean)
    .sort(function (a, b) {
      return Number(b.timestamp || 0) - Number(a.timestamp || 0);
    });
}

function mapInvitadosSnapshotToArray(snapshot) {
  if (!snapshot || !snapshot.exists()) return [];
  const raw = snapshot.val();
  if (!raw || typeof raw !== "object") return [];

  return Object.entries(raw)
    .map(function ([key, value]) {
      if (!value || typeof value !== "object") return null;
      const id = String(value.id || key || "").trim();
      if (!id) return null;

      return {
        ...value,
        id,
        _key: key
      };
    })
    .filter(Boolean)
    .sort(function (a, b) {
      return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
    });
}

function mergeWishesRecords(eventRecords, legacyRecords) {
  const all = [];
  if (Array.isArray(eventRecords)) all.push(...eventRecords);
  if (Array.isArray(legacyRecords)) all.push(...legacyRecords);
  return all.sort(function (a, b) {
    return Number(b.timestamp || 0) - Number(a.timestamp || 0);
  });
}

function dedupeWishesRecords(records) {
  const seen = new Set();
  const result = [];

  (records || []).forEach(function (record) {
    if (!record || typeof record !== "object") return;
    const key = [
      String(record._key || ""),
      String(record.nombre || ""),
      String(record.mensaje || ""),
      String(Number(record.timestamp || 0))
    ].join("|");

    if (seen.has(key)) return;
    seen.add(key);
    result.push(record);
  });

  return result;
}

function getPreferredRecords(primaryRecords, fallbackRecords) {
  if (Array.isArray(primaryRecords) && primaryRecords.length > 0) {
    return primaryRecords;
  }
  return Array.isArray(fallbackRecords) ? fallbackRecords : [];
}

function normalizeRsvpRecordForMigration(record) {
  const response = String(record && record.respuesta || "").toLowerCase() === "no"
    ? "no"
    : "si";

  return {
    id: String((record && record.id) || (record && record._key) || "default").trim() || "default",
    nombre: sanitizeText(record && record.nombre),
    pasesAsignados: Math.max(0, Number(record && record.pasesAsignados) || 0),
    respuesta: response,
    cantidadConfirmada: response === "si"
      ? Math.max(0, Number(record && record.cantidadConfirmada) || 0)
      : 0,
    confirmado: true,
    fechaConfirmacion: Number(record && record.fechaConfirmacion) || Date.now()
  };
}

function getWishFingerprint(record) {
  return [
    sanitizeTextForFingerprint(record && record.nombre),
    sanitizeTextForFingerprint(record && record.mensaje),
    String(Number(record && record.timestamp || 0))
  ].join("|");
}

function getWishIdForMigration(record, index) {
  const timestamp = Number(record && record.timestamp) || 0;
  const fingerprint = getWishFingerprint(record);
  const hash = createStringHash(fingerprint + "|" + String(index));
  return sanitizeFirebaseKey("legacy_" + String(timestamp || "na") + "_" + hash);
}

function normalizeWishRecordForMigration(record) {
  return {
    nombre: sanitizeText(record && record.nombre),
    mensaje: sanitizeText(record && record.mensaje),
    timestamp: Number(record && record.timestamp) || Date.now()
  };
}

function parseEventAndGuestArgs(arg1, arg2) {
  if (typeof arg2 !== "undefined") {
    return { eventId: arg1, guestId: arg2 };
  }
  return { eventId: undefined, guestId: arg1 };
}

function parseEventAndPayloadArgs(arg1, arg2) {
  if (typeof arg2 !== "undefined") {
    return { eventId: arg1, payload: arg2 };
  }
  return { eventId: undefined, payload: arg1 };
}

function parseSubscriptionArgs(arg1, arg2, arg3) {
  if (typeof arg1 === "function") {
    return {
      eventId: undefined,
      onChange: arg1,
      onError: arg2
    };
  }

  return {
    eventId: arg1,
    onChange: arg2,
    onError: arg3
  };
}

function parseGuestMigrationArgs(arg1, arg2, arg3) {
  const eventId = arg1;
  let localSource = arg2;
  let options = arg3;

  const maybeOptions = arg2;
  if (
    maybeOptions
    && typeof maybeOptions === "object"
    && !Array.isArray(maybeOptions)
    && (
      Object.prototype.hasOwnProperty.call(maybeOptions, "force")
      || Object.prototype.hasOwnProperty.call(maybeOptions, "dryRun")
      || Object.prototype.hasOwnProperty.call(maybeOptions, "source")
    )
  ) {
    localSource = maybeOptions.source;
    options = maybeOptions;
  }

  return {
    eventId,
    localSource,
    options: options && typeof options === "object" ? options : {}
  };
}

function parseEventConfigSeedArgs(arg1, arg2) {
  return {
    eventId: arg1,
    options: arg2 && typeof arg2 === "object" ? arg2 : {}
  };
}

function parseLegacyMigrationArgs(arg1, arg2) {
  return {
    eventId: arg1,
    options: arg2 && typeof arg2 === "object" ? arg2 : {}
  };
}

function getGuestsSeedStorageKey(eventId) {
  return "migrate.invitados.seeded." + resolveEventId(eventId);
}

function getEventConfigSeedStorageKey(eventId) {
  return "migrate.event-config.seeded." + resolveEventId(eventId);
}

function getLegacyRsvpMigrationStorageKey(eventId) {
  return "migrate.legacy-rsvp.seeded." + resolveEventId(eventId);
}

function getLegacyWishesMigrationStorageKey(eventId) {
  return "migrate.legacy-wishes.seeded." + resolveEventId(eventId);
}

function readLocalStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeLocalStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // Ignore storage failures silently.
  }
}

function removeLocalStorage(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    // Ignore storage failures silently.
  }
}

function normalizeLocalGuestsSource(source) {
  if (!source) return [];

  if (Array.isArray(source)) {
    return source
      .map(function (guest, index) {
        if (!guest || typeof guest !== "object") return null;
        const id = String(guest.id || guest._key || index + 1).trim();
        if (!id) return null;

        return {
          id,
          nombre: String(guest.nombre || "").trim() || "Invitado",
          pases: Math.max(1, Number(guest.pases) || 1),
          activo: typeof guest.activo === "undefined" ? true : Boolean(guest.activo)
        };
      })
      .filter(Boolean);
  }

  if (typeof source === "object") {
    return Object.entries(source)
      .map(function ([key, guest]) {
        if (!guest || typeof guest !== "object") return null;
        const id = String(guest.id || key).trim();
        if (!id) return null;

        return {
          id,
          nombre: String(guest.nombre || "").trim() || "Invitado",
          pases: Math.max(1, Number(guest.pases) || 1),
          activo: typeof guest.activo === "undefined" ? true : Boolean(guest.activo)
        };
      })
      .filter(Boolean);
  }

  return [];
}

function resolveLocalGuestsSource(eventId, explicitSource) {
  if (explicitSource) {
    return { source: explicitSource, sourceLabel: "argumento" };
  }

  if (window.GuestConfig && window.GuestConfig.invitados) {
    return { source: window.GuestConfig.invitados, sourceLabel: "window.GuestConfig.invitados" };
  }

  const localSeeds = window.LocalGuestSeeds || window.DashboardGuestDirectoryByEvent;
  if (localSeeds && typeof localSeeds === "object") {
    const byEvent = localSeeds[resolveEventId(eventId)] || localSeeds[eventId];
    if (byEvent) {
      return { source: byEvent, sourceLabel: "window.LocalGuestSeeds[eventId]" };
    }
  }

  return { source: null, sourceLabel: "none" };
}

function sanitizeText(value) {
  return String(value == null ? "" : value).trim();
}

function sanitizeTextForFingerprint(value) {
  return sanitizeText(value).replace(/\s+/g, " ").toLowerCase();
}

function createStringHash(value) {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

function normalizeEventSection(section) {
  if (!section || typeof section !== "object") {
    return {
      titulo: "",
      lugar: "",
      hora: "",
      direccion: "",
      ubicacionUrl: ""
    };
  }

  return {
    titulo: sanitizeText(section.titulo),
    lugar: sanitizeText(section.lugar),
    hora: sanitizeText(section.hora),
    direccion: sanitizeText(section.direccion),
    ubicacionUrl: sanitizeText(section.ubicacionUrl || section.ubicacion)
  };
}

function normalizeTextObject(rawValue) {
  if (!rawValue || typeof rawValue !== "object") return {};

  const normalized = {};
  Object.entries(rawValue).forEach(function ([key, value]) {
    if (!key) return;
    const normalizedValue = sanitizeText(value);
    if (!normalizedValue) return;
    normalized[key] = normalizedValue;
  });
  return normalized;
}

function buildEventConfigSeedPayload(rawConfig) {
  if (!rawConfig || typeof rawConfig !== "object") return null;

  const sourceEvento = rawConfig.evento && typeof rawConfig.evento === "object"
    ? rawConfig.evento
    : {};
  const ceremoniaSource = sourceEvento.ceremonia || rawConfig.ceremonia;
  const recepcionSource = sourceEvento.recepcion || rawConfig.recepcion;

  const payload = {
    pareja: {
      nombres: sanitizeText(rawConfig.pareja && rawConfig.pareja.nombres),
      fecha: sanitizeText(rawConfig.pareja && rawConfig.pareja.fecha),
      fechaVisible: sanitizeText(rawConfig.pareja && rawConfig.pareja.fechaVisible)
    },
    musica: {
      titulo: sanitizeText(rawConfig.musica && rawConfig.musica.titulo),
      archivo: sanitizeText(rawConfig.musica && rawConfig.musica.archivo)
    },
    evento: {
      ceremonia: normalizeEventSection(ceremoniaSource),
      recepcion: normalizeEventSection(recepcionSource)
    }
  };

  payload.ceremonia = { ...payload.evento.ceremonia };
  payload.recepcion = { ...payload.evento.recepcion };

  const normalizedTextos = normalizeTextObject(rawConfig.textos);
  if (Object.keys(normalizedTextos).length > 0) {
    payload.textos = normalizedTextos;
  }

  return payload;
}

function resolveLocalEventConfigSource(options) {
  const explicitSource = options && options.source;
  if (explicitSource && typeof explicitSource === "object") {
    return { source: explicitSource, sourceLabel: "argumento" };
  }

  if (window.config && typeof window.config === "object") {
    return { source: window.config, sourceLabel: "window.config" };
  }

  if (window.SiteConfig && typeof window.SiteConfig === "object") {
    return { source: window.SiteConfig, sourceLabel: "window.SiteConfig" };
  }

  return { source: null, sourceLabel: "none" };
}

function createAlreadyConfirmedError(existingData) {
  const error = new Error("RSVP_ALREADY_CONFIRMED");
  error.code = "RSVP_ALREADY_CONFIRMED";
  error.existingData = existingData || null;
  return error;
}

async function saveConfirmationWithTransaction(targetRef, record) {
  const transactionResult = await runTransaction(
    targetRef,
    function (currentData) {
      if (currentData && currentData.confirmado) {
        return;
      }
      return record;
    },
    { applyLocally: false }
  );

  if (!transactionResult.committed) {
    const existingData = transactionResult.snapshot && transactionResult.snapshot.exists()
      ? transactionResult.snapshot.val()
      : null;
    throw createAlreadyConfirmedError(existingData);
  }

  return transactionResult.snapshot.val() || record;
}

async function getConfirmationByGuestId(arg1, arg2) {
  const parsed = parseEventAndGuestArgs(arg1, arg2);
  const eventId = parsed.eventId;
  const guestId = parsed.guestId;

  try {
    const eventSnapshot = await get(getEventRsvpRef(eventId, guestId));
    if (eventSnapshot.exists()) {
      const eventData = eventSnapshot.val();
      if (eventData && typeof eventData === "object") return eventData;
    }
  } catch (error) {
    console.warn("No se pudo leer RSVP por evento:", error);
  }

  return null;
}

async function saveConfirmation(arg1, arg2) {
  const parsed = parseEventAndPayloadArgs(arg1, arg2);
  const eventId = parsed.eventId;
  const payload = parsed.payload;
  const guestId = String((payload && payload.id) || "").trim() || "default";
  const record = {
    id: guestId,
    nombre: String((payload && payload.nombre) || ""),
    pasesAsignados: Number((payload && payload.pasesAsignados) || 0),
    respuesta: payload && payload.respuesta === "no" ? "no" : "si",
    cantidadConfirmada: Number((payload && payload.cantidadConfirmada) || 0),
    integrantesConfirmados: Array.isArray(payload && payload.integrantesConfirmados)
      ? payload.integrantesConfirmados
        .map(function (member) {
          const nombre = String(member && (member.nombre || member.name) || "").trim();
          if (!nombre) return null;
          return {
            id: String(member && member.id || "").trim(),
            nombre,
            pasesAsignados: Math.max(1, Number(member && (member.pasesAsignados || member.passes) || 1))
          };
        })
        .filter(Boolean)
      : [],
    confirmado: true,
    fechaConfirmacion: Number((payload && payload.fechaConfirmacion) || Date.now())
  };

  try {
    console.log("[Firebase][RSVP] Intentando guardar confirmación", getEventRsvpPath(eventId) + "/" + sanitizeFirebaseKey(guestId) + "/rsvp", record);
    const result = await saveConfirmationWithTransaction(getEventRsvpRef(eventId, guestId), record);
    console.log("[Firebase][RSVP] Confirmación guardada correctamente", result);
    return result;
  } catch (error) {
    console.error("[Firebase][RSVP] Error al guardar confirmación", error);
    if (error && error.code === "RSVP_ALREADY_CONFIRMED") {
      throw error;
    }

    const legacyPolicy = resolveLegacyPolicy();
    if (!legacyPolicy.write) {
      throw error;
    }

    console.warn("No se pudo guardar RSVP por evento, usando fallback legacy:", error);
    return saveConfirmationWithTransaction(getLegacyRsvpRef(guestId), record);
  }
}

async function getAllConfirmations(eventId) {
  const legacyPolicy = resolveLegacyPolicy();
  const eventRead = await Promise.allSettled([
    get(ref(db, getEventRsvpPath(eventId)))
  ]);

  const eventRecords = eventRead[0].status === "fulfilled"
    ? mapRsvpSnapshotToArray(eventRead[0].value)
    : [];

  if (eventRead[0].status === "rejected") {
    console.warn("No se pudo leer RSVP por evento en getAllConfirmations:", eventRead[0].reason);
  }

  if (eventRecords.length > 0 || !legacyPolicy.read) {
    return eventRecords;
  }

  const legacyRead = await Promise.allSettled([
    get(ref(db, legacyRsvpBasePath))
  ]);

  const legacyRecords = legacyRead[0].status === "fulfilled"
    ? mapRsvpSnapshotToArray(legacyRead[0].value)
    : [];

  return legacyRecords;
}

async function getEventConfig(eventId) {
  try {
    const snapshot = await get(getEventConfigRef(eventId));
    if (!snapshot.exists()) return null;

    const data = snapshot.val();
    if (!data || typeof data !== "object") return null;
    return data;
  } catch (error) {
    console.warn("No se pudo leer configuración del evento:", error);
    return null;
  }
}

function subscribeToEventConfig(arg1, arg2, arg3) {
  const parsed = parseSubscriptionArgs(arg1, arg2, arg3);
  const eventId = parsed.eventId;
  const onChange = parsed.onChange;
  const onError = parsed.onError;

  if (typeof onChange !== "function") {
    throw new Error("onChange callback es requerido");
  }

  return onValue(
    getEventConfigRef(eventId),
    function (snapshot) {
      if (!snapshot.exists()) {
        onChange(null);
        return;
      }

      const data = snapshot.val();
      onChange(data && typeof data === "object" ? data : null);
    },
    function (error) {
      if (typeof onError === "function") onError(error);
    }
  );
}

function subscribeToConfirmations(arg1, arg2, arg3) {
  const parsed = parseSubscriptionArgs(arg1, arg2, arg3);
  const eventId = parsed.eventId;
  const onChange = parsed.onChange;
  const onError = parsed.onError;

  if (typeof onChange !== "function") {
    throw new Error("onChange callback es requerido");
  }

  const legacyPolicy = resolveLegacyPolicy();
  let eventRecords = [];
  let legacyRecords = [];
  let unsubscribeLegacy = null;

  function emitPreferredData() {
    if (eventRecords.length > 0) {
      if (typeof unsubscribeLegacy === "function") {
        unsubscribeLegacy();
        unsubscribeLegacy = null;
        legacyRecords = [];
      }
      onChange(eventRecords);
      return;
    }

    if (legacyPolicy.read && legacyPolicy.subscribe) {
      onChange(legacyRecords);
      return;
    }

    onChange(eventRecords);
  }

  const unsubscribeEvent = onValue(
    ref(db, getEventRsvpPath(eventId)),
    function (snapshot) {
      eventRecords = mapRsvpSnapshotToArray(snapshot);
      emitPreferredData();
    },
    function (error) {
      if (typeof onError === "function") onError(error);
    }
  );

  if (legacyPolicy.read && legacyPolicy.subscribe) {
    unsubscribeLegacy = onValue(
      ref(db, legacyRsvpBasePath),
      function (snapshot) {
        legacyRecords = mapRsvpSnapshotToArray(snapshot);
        emitPreferredData();
      },
      function (error) {
        if (typeof onError === "function") onError(error);
      }
    );
  }

  return function unsubscribeAll() {
    unsubscribeEvent();
    if (typeof unsubscribeLegacy === "function") {
      unsubscribeLegacy();
    }
  };
}

async function saveWish(arg1, arg2) {
  const parsed = parseEventAndPayloadArgs(arg1, arg2);
  const eventId = parsed.eventId;
  const payload = parsed.payload;

  const wishRecord = {
    nombre: String((payload && payload.nombre) || "").trim(),
    mensaje: String((payload && payload.mensaje) || "").trim(),
    timestamp: Number((payload && payload.timestamp) || Date.now())
  };

  try {
    console.log("[Firebase][Wishes] Intentando guardar deseo", getEventDeseosPath(eventId), wishRecord);
    await push(getEventWishesRef(eventId), wishRecord);
    console.log("[Firebase][Wishes] Deseo guardado correctamente.");
    return wishRecord;
  } catch (error) {
    console.error("[Firebase][Wishes] Error al guardar deseo", error);
    const legacyPolicy = resolveLegacyPolicy();
    if (!legacyPolicy.write) {
      throw error;
    }

    console.warn("No se pudo guardar deseo por evento, usando fallback legacy:", error);
    try {
      await push(getLegacyWishesPrimaryRef(), wishRecord);
    } catch (legacyError) {
      console.warn("No se pudo guardar deseo en ruta legacy principal, intentando secundaria:", legacyError);
      await push(getLegacyWishesSecondaryRef(), wishRecord);
    }
    return wishRecord;
  }
}

async function getAllWishes(eventId) {
  const legacyPolicy = resolveLegacyPolicy();

  const eventRead = await Promise.allSettled([
    get(getEventWishesRef(eventId))
  ]);

  const eventRecords = eventRead[0] && eventRead[0].status === "fulfilled"
    ? mapWishesSnapshotToArray(eventRead[0].value)
    : [];

  if (eventRecords.length > 0 || !legacyPolicy.read) {
    return eventRecords;
  }

  const legacyReads = await Promise.allSettled(
    getLegacyWishesRefs().map(function (currentRef) {
      return get(currentRef);
    })
  );

  const legacyRecords = legacyReads
    .filter(function (result) {
      return result.status === "fulfilled";
    })
    .flatMap(function (result) {
      return mapWishesSnapshotToArray(result.value);
    });

  return dedupeWishesRecords(legacyRecords);
}

async function getInvitados(eventId) {
  try {
    const snapshot = await get(ref(db, getEventInvitadosPath(eventId)));
    return mapInvitadosSnapshotToArray(snapshot);
  } catch (error) {
    console.warn("No se pudo leer invitados del evento:", error);
    return [];
  }
}

async function getInvitadoById(arg1, arg2) {
  const parsed = parseEventAndGuestArgs(arg1, arg2);
  const eventId = parsed.eventId;
  const guestId = parsed.guestId;
  const safeGuestId = sanitizeFirebaseKey(guestId);

  try {
    console.log("[Firebase][Guests] Leyendo invitado", getEventInvitadosPath(eventId) + "/" + safeGuestId);
    const snapshot = await get(ref(db, getEventInvitadosPath(eventId) + "/" + safeGuestId));
    if (!snapshot.exists()) {
      console.warn("[Firebase][Guests] Invitado no encontrado", safeGuestId);
      return null;
    }

    const data = snapshot.val();
    if (!data || typeof data !== "object") return null;

    const guest = {
      ...data,
      id: String(data.id || guestId || safeGuestId)
    };
    console.log("[Firebase][Guests] Invitado cargado", guest);
    return guest;
  } catch (error) {
    console.warn("No se pudo leer invitado por id del evento:", error);
    return null;
  }
}

async function createInvitado(arg1, arg2) {
  const parsed = parseEventAndPayloadArgs(arg1, arg2);
  const eventId = parsed.eventId;
  const payload = parsed.payload || {};

  const id = String(payload.id || ("guest_" + Date.now())).trim() || ("guest_" + Date.now());
  const nombre = sanitizeText(payload.nombre);
  const pases = Math.max(1, Number(payload.pases) || 1);
  const activo = typeof payload.activo === "undefined" ? true : Boolean(payload.activo);

  if (!nombre) {
    throw new Error("INVITADO_NOMBRE_REQUERIDO");
  }

  const safeGuestId = sanitizeFirebaseKey(id);
  const invitadoRecord = {
    id,
    nombre,
    pases,
    activo
  };

  await set(ref(db, getEventInvitadosPath(eventId) + "/" + safeGuestId), invitadoRecord);
  return invitadoRecord;
}

async function updateInvitado(arg1, arg2, arg3) {
  const eventId = arg1;
  const guestId = String(arg2 || "").trim();
  const payload = arg3 || {};

  if (!guestId) {
    throw new Error("INVITADO_ID_REQUERIDO");
  }

  const nombre = sanitizeText(payload.nombre);
  const pases = Math.max(1, Number(payload.pases) || 1);
  const activo = typeof payload.activo === "undefined" ? true : Boolean(payload.activo);

  if (!nombre) {
    throw new Error("INVITADO_NOMBRE_REQUERIDO");
  }

  const safeGuestId = sanitizeFirebaseKey(guestId);
  const invitadoRecord = {
    id: guestId,
    nombre,
    pases,
    activo
  };

  await set(ref(db, getEventInvitadosPath(eventId) + "/" + safeGuestId), invitadoRecord);
  return invitadoRecord;
}

async function deleteInvitado(arg1, arg2) {
  const eventId = arg1;
  const guestId = String(arg2 || "").trim();

  if (!guestId) {
    throw new Error("INVITADO_ID_REQUERIDO");
  }

  const safeGuestId = sanitizeFirebaseKey(guestId);
  const targetRef = ref(db, getEventInvitadosPath(eventId) + "/" + safeGuestId);
  const snapshot = await get(targetRef);

  if (!snapshot.exists()) {
    return { ok: true, id: guestId, alreadyMissing: true };
  }

  const current = snapshot.val() || {};
  const updatedRecord = {
    id: String(current.id || guestId),
    nombre: sanitizeText(current.nombre) || "Invitado",
    pases: Math.max(1, Number(current.pases) || 1),
    activo: false
  };

  await set(targetRef, updatedRecord);
  return { ok: true, id: guestId, deactivated: true };
}

function subscribeToInvitados(arg1, arg2, arg3) {
  const parsed = parseSubscriptionArgs(arg1, arg2, arg3);
  const eventId = parsed.eventId;
  const onChange = parsed.onChange;
  const onError = parsed.onError;

  if (typeof onChange !== "function") {
    throw new Error("onChange callback es requerido");
  }

  return onValue(
    ref(db, getEventInvitadosPath(eventId)),
    function (snapshot) {
      onChange(mapInvitadosSnapshotToArray(snapshot));
    },
    function (error) {
      if (typeof onError === "function") onError(error);
    }
  );
}

async function migrateLocalGuestsToFirebase(arg1, arg2, arg3) {
  const parsed = parseGuestMigrationArgs(arg1, arg2, arg3);
  const eventId = resolveEventId(parsed.eventId);
  const options = parsed.options || {};
  const force = Boolean(options.force);
  const dryRun = Boolean(options.dryRun);
  const storageKey = getGuestsSeedStorageKey(eventId);

  const alreadySeededAt = readLocalStorage(storageKey);
  if (alreadySeededAt && !force) {
    return {
      ok: true,
      skipped: true,
      reason: "already-seeded",
      eventId,
      seededAt: alreadySeededAt
    };
  }

  const sourceInfo = resolveLocalGuestsSource(eventId, parsed.localSource);
  const guests = normalizeLocalGuestsSource(sourceInfo.source);

  if (guests.length === 0) {
    return {
      ok: false,
      skipped: true,
      reason: "no-local-guests-found",
      eventId,
      source: sourceInfo.sourceLabel
    };
  }

  if (!dryRun) {
    await Promise.all(
      guests.map(function (guest) {
        const guestId = sanitizeFirebaseKey(guest.id);
        return set(ref(db, getEventInvitadosPath(eventId) + "/" + guestId), {
          id: String(guest.id),
          nombre: String(guest.nombre || "").trim(),
          pases: Math.max(1, Number(guest.pases) || 1),
          activo: typeof guest.activo === "undefined" ? true : Boolean(guest.activo)
        });
      })
    );

    writeLocalStorage(storageKey, new Date().toISOString());
  }

  return {
    ok: true,
    skipped: false,
    dryRun,
    eventId,
    source: sourceInfo.sourceLabel,
    total: guests.length,
    guestIds: guests.map(function (guest) {
      return String(guest.id);
    })
  };
}

function clearGuestsMigrationMark(eventId) {
  const storageKey = getGuestsSeedStorageKey(eventId);
  removeLocalStorage(storageKey);
  return { ok: true, eventId: resolveEventId(eventId), cleared: true };
}

async function seedEventConfigToFirebase(arg1, arg2) {
  const parsed = parseEventConfigSeedArgs(arg1, arg2);
  const eventId = resolveEventId(parsed.eventId);
  const options = parsed.options || {};
  const force = Boolean(options.force);
  const dryRun = Boolean(options.dryRun);
  const storageKey = getEventConfigSeedStorageKey(eventId);

  const alreadySeededAt = readLocalStorage(storageKey);
  if (alreadySeededAt && !force) {
    return {
      ok: true,
      skipped: true,
      reason: "already-seeded",
      eventId,
      seededAt: alreadySeededAt
    };
  }

  const sourceInfo = resolveLocalEventConfigSource(options);
  const payload = buildEventConfigSeedPayload(sourceInfo.source);

  if (!payload) {
    return {
      ok: false,
      skipped: true,
      reason: "no-local-config-found",
      eventId,
      source: sourceInfo.sourceLabel
    };
  }

  if (!dryRun) {
    await set(getEventConfigRef(eventId), payload);
    writeLocalStorage(storageKey, new Date().toISOString());
  }

  return {
    ok: true,
    skipped: false,
    dryRun,
    eventId,
    source: sourceInfo.sourceLabel,
    payload
  };
}

function clearEventConfigMigrationMark(eventId) {
  const storageKey = getEventConfigSeedStorageKey(eventId);
  removeLocalStorage(storageKey);
  return { ok: true, eventId: resolveEventId(eventId), cleared: true };
}

async function seedEventConfig() {
  const eventId = "joserafaelynathalia2026";
  const payload = {
    eventId,
    bride: "Nathalia Fernanda Arana Girón",
    groom: "José Rafael González Brol",
    date: "2026-10-24",
    time: "16:00",
    timezone: "America/Guatemala",
    venue: "Iglesia San Ignacio de Loyola",
    reception: "Hotel Barceló"
  };

  console.log("[Firebase][seedEventConfig] Inicio", {
    ready: Boolean(window.firebaseReady),
    eventId,
    databaseURL: firebaseConfig && firebaseConfig.databaseURL
  });
  console.log("[Firebase][seedEventConfig] Escribiendo configuración", getEventConfigPath(eventId), payload);
  await set(getEventConfigRef(eventId), payload);
  console.log("[Firebase][seedEventConfig] Configuración guardada correctamente.");
  return payload;
}

async function seedEventData(arg1, arg2) {
  const eventId = resolveEventId(arg1);
  const options = arg2 && typeof arg2 === "object" ? arg2 : {};
  const force = Boolean(options.force);

  const sampleGuests = {
    "1": {
      id: "1",
      nombre: "Familia Barrientos",
      pases: 3,
      integrantes: [
        { id: "member-1", nombre: "Wendy Barrientos", pases: 1 },
        { id: "member-2", nombre: "Mishell Barrientos", pases: 1 },
        { id: "member-3", nombre: "Rodolfo Barrientos", pases: 1 }
      ],
      activo: true
    }
  };

  const [rsvpSnapshot, wishesSnapshot] = await Promise.all([
    get(ref(db, getEventRsvpPath(eventId))),
    get(ref(db, getEventDeseosPath(eventId)))
  ]);

  if (force || !rsvpSnapshot.exists()) {
    await set(ref(db, getEventRsvpPath(eventId)), {});
  }

  if (force || !wishesSnapshot.exists()) {
    await set(ref(db, getEventDeseosPath(eventId)), {});
  }

  await Promise.all(
    Object.entries(sampleGuests).map(function ([guestId, guest]) {
      return updateInvitado(eventId, guestId, guest);
    })
  );

  return {
    ok: true,
    eventId,
    rsvpInitialized: force || !rsvpSnapshot.exists(),
    wishesInitialized: force || !wishesSnapshot.exists(),
    invitadosSeeded: Object.keys(sampleGuests).length,
    guestIds: Object.keys(sampleGuests)
  };
}

async function migrateLegacyRsvpToEvent(arg1, arg2) {
  const parsed = parseLegacyMigrationArgs(arg1, arg2);
  const eventId = resolveEventId(parsed.eventId);
  const options = parsed.options || {};
  const force = Boolean(options.force);
  const dryRun = Boolean(options.dryRun);
  const storageKey = getLegacyRsvpMigrationStorageKey(eventId);

  const alreadyMigratedAt = readLocalStorage(storageKey);
  if (alreadyMigratedAt && !force) {
    return {
      ok: true,
      skipped: true,
      reason: "already-migrated",
      eventId,
      migratedAt: alreadyMigratedAt
    };
  }

  const reads = await Promise.allSettled([
    get(ref(db, legacyRsvpBasePath)),
    get(ref(db, getEventRsvpPath(eventId)))
  ]);

  const legacyRecords = reads[0].status === "fulfilled"
    ? mapRsvpSnapshotToArray(reads[0].value)
    : [];
  const existingEventRecords = reads[1].status === "fulfilled"
    ? mapRsvpSnapshotToArray(reads[1].value)
    : [];

  if (legacyRecords.length === 0) {
    return {
      ok: true,
      skipped: true,
      reason: "no-legacy-rsvp-found",
      eventId
    };
  }

  const existingByGuestKey = new Map(
    existingEventRecords.map(function (record) {
      const guestKey = sanitizeFirebaseKey(String(record && (record.id || record._key) || "default"));
      return [guestKey, record];
    })
  );

  const latestLegacyByGuest = new Map();
  legacyRecords.forEach(function (record) {
    const normalized = normalizeRsvpRecordForMigration(record);
    const guestKey = sanitizeFirebaseKey(normalized.id);
    const previous = latestLegacyByGuest.get(guestKey);
    if (!previous) {
      latestLegacyByGuest.set(guestKey, normalized);
      return;
    }

    if (Number(normalized.fechaConfirmacion || 0) >= Number(previous.fechaConfirmacion || 0)) {
      latestLegacyByGuest.set(guestKey, normalized);
    }
  });

  const writes = [];
  let skippedExisting = 0;
  latestLegacyByGuest.forEach(function (record, guestKey) {
    if (!force && existingByGuestKey.has(guestKey)) {
      skippedExisting += 1;
      return;
    }

    writes.push({
      guestKey,
      payload: record
    });
  });

  if (!dryRun) {
    await Promise.all(
      writes.map(function (entry) {
        return set(ref(db, getEventRsvpPath(eventId) + "/" + entry.guestKey), entry.payload);
      })
    );

    writeLocalStorage(storageKey, new Date().toISOString());
  }

  return {
    ok: true,
    skipped: false,
    dryRun,
    eventId,
    legacyTotal: legacyRecords.length,
    uniqueLegacyGuests: latestLegacyByGuest.size,
    toWrite: writes.length,
    skippedExisting
  };
}

function clearLegacyRsvpMigrationMark(eventId) {
  const resolvedEventId = resolveEventId(eventId);
  const storageKey = getLegacyRsvpMigrationStorageKey(resolvedEventId);
  removeLocalStorage(storageKey);
  return { ok: true, eventId: resolvedEventId, cleared: true };
}

async function migrateLegacyWishesToEvent(arg1, arg2) {
  const parsed = parseLegacyMigrationArgs(arg1, arg2);
  const eventId = resolveEventId(parsed.eventId);
  const options = parsed.options || {};
  const force = Boolean(options.force);
  const dryRun = Boolean(options.dryRun);
  const storageKey = getLegacyWishesMigrationStorageKey(eventId);

  const alreadyMigratedAt = readLocalStorage(storageKey);
  if (alreadyMigratedAt && !force) {
    return {
      ok: true,
      skipped: true,
      reason: "already-migrated",
      eventId,
      migratedAt: alreadyMigratedAt
    };
  }

  const allRefs = [
    getLegacyWishesPrimaryRef(),
    getLegacyWishesSecondaryRef(),
    getEventWishesRef(eventId)
  ];
  const reads = await Promise.allSettled(
    allRefs.map(function (currentRef) {
      return get(currentRef);
    })
  );

  const legacyPrimary = reads[0] && reads[0].status === "fulfilled"
    ? mapWishesSnapshotToArray(reads[0].value)
    : [];
  const legacySecondary = reads[1] && reads[1].status === "fulfilled"
    ? mapWishesSnapshotToArray(reads[1].value)
    : [];
  const existingEventWishes = reads[2] && reads[2].status === "fulfilled"
    ? mapWishesSnapshotToArray(reads[2].value)
    : [];

  const legacyCombined = [...legacyPrimary, ...legacySecondary];
  if (legacyCombined.length === 0) {
    return {
      ok: true,
      skipped: true,
      reason: "no-legacy-wishes-found",
      eventId
    };
  }

  const existingFingerprints = new Set(
    existingEventWishes.map(function (wish) {
      return getWishFingerprint(wish);
    })
  );

  const uniqueLegacyByFingerprint = new Map();
  legacyCombined.forEach(function (wish) {
    const normalized = normalizeWishRecordForMigration(wish);
    const fingerprint = getWishFingerprint(normalized);
    if (uniqueLegacyByFingerprint.has(fingerprint)) return;
    uniqueLegacyByFingerprint.set(fingerprint, normalized);
  });

  const writes = [];
  let skippedExisting = 0;
  Array.from(uniqueLegacyByFingerprint.entries()).forEach(function ([fingerprint, wish], index) {
    if (existingFingerprints.has(fingerprint)) {
      skippedExisting += 1;
      return;
    }

    const wishId = getWishIdForMigration(wish, index + 1);
    writes.push({ wishId, payload: wish });
  });

  if (!dryRun) {
    await Promise.all(
      writes.map(function (entry) {
        return set(ref(db, getEventDeseosPath(eventId) + "/" + entry.wishId), entry.payload);
      })
    );

    writeLocalStorage(storageKey, new Date().toISOString());
  }

  return {
    ok: true,
    skipped: false,
    dryRun,
    eventId,
    legacyTotal: legacyCombined.length,
    uniqueLegacyWishes: uniqueLegacyByFingerprint.size,
    toWrite: writes.length,
    skippedExisting
  };
}

function clearLegacyWishesMigrationMark(eventId) {
  const resolvedEventId = resolveEventId(eventId);
  const storageKey = getLegacyWishesMigrationStorageKey(resolvedEventId);
  removeLocalStorage(storageKey);
  return { ok: true, eventId: resolvedEventId, cleared: true };
}

function subscribeToWishes(arg1, arg2, arg3) {
  const parsed = parseSubscriptionArgs(arg1, arg2, arg3);
  const eventId = parsed.eventId;
  const onChange = parsed.onChange;
  const onError = parsed.onError;

  if (typeof onChange !== "function") {
    throw new Error("onChange callback es requerido");
  }

  const legacyPolicy = resolveLegacyPolicy();
  console.log("[Firebase][Wishes] Suscribiendo muro en tiempo real", getEventDeseosPath(eventId));
  let eventWishes = [];
  let legacyPrimaryWishes = [];
  let legacySecondaryWishes = [];
  let unsubscribeLegacyPrimary = null;
  let unsubscribeLegacySecondary = null;

  function emitPreferredData() {
    if (eventWishes.length > 0) {
      if (typeof unsubscribeLegacyPrimary === "function") {
        unsubscribeLegacyPrimary();
        unsubscribeLegacyPrimary = null;
      }
      if (typeof unsubscribeLegacySecondary === "function") {
        unsubscribeLegacySecondary();
        unsubscribeLegacySecondary = null;
      }
      legacyPrimaryWishes = [];
      legacySecondaryWishes = [];
      onChange(eventWishes);
      return;
    }

    if (legacyPolicy.read && legacyPolicy.subscribe) {
      const mergedLegacy = dedupeWishesRecords(
        mergeWishesRecords(legacyPrimaryWishes, legacySecondaryWishes)
      );
      onChange(mergedLegacy);
      return;
    }

    onChange(eventWishes);
  }

  const unsubscribeEvent = onValue(
    getEventWishesRef(eventId),
    function (snapshot) {
      eventWishes = mapWishesSnapshotToArray(snapshot);
      console.log("[Firebase][Wishes] Mensajes recibidos", eventWishes.length);
      emitPreferredData();
    },
    function (error) {
      console.error("[Firebase][Wishes] Error en suscripción", error);
      if (typeof onError === "function") onError(error);
    }
  );

  if (legacyPolicy.read && legacyPolicy.subscribe) {
    unsubscribeLegacyPrimary = onValue(
      getLegacyWishesPrimaryRef(),
      function (snapshot) {
        legacyPrimaryWishes = mapWishesSnapshotToArray(snapshot);
        emitPreferredData();
      },
      function (error) {
        if (typeof onError === "function") onError(error);
      }
    );

    unsubscribeLegacySecondary = onValue(
      getLegacyWishesSecondaryRef(),
      function (snapshot) {
        legacySecondaryWishes = mapWishesSnapshotToArray(snapshot);
        emitPreferredData();
      },
      function (error) {
        if (typeof onError === "function") onError(error);
      }
    );
  }

  return function unsubscribeAll() {
    unsubscribeEvent();
    if (typeof unsubscribeLegacyPrimary === "function") {
      unsubscribeLegacyPrimary();
    }
    if (typeof unsubscribeLegacySecondary === "function") {
      unsubscribeLegacySecondary();
    }
  };
}

window.RSVPDatabase = {
  resolveEventId,
  getEventBasePath,
  getEventConfigPath,
  getEventConfig,
  subscribeToEventConfig,
  getEventInvitadosPath,
  getEventRsvpPath,
  getEventDeseosPath,
  getConfirmationByGuestId,
  saveConfirmation,
  getAllConfirmations,
  subscribeToConfirmations,
  saveWish,
  getAllWishes,
  subscribeToWishes,
  getInvitados,
  subscribeToInvitados,
  getInvitadoById,
  createInvitado,
  updateInvitado,
  deleteInvitado,
  migrateLocalGuestsToFirebase,
  clearGuestsMigrationMark,
  seedEventConfig,
  seedEventConfigToFirebase,
  seedEventData,
  clearEventConfigMigrationMark,
  migrateLegacyRsvpToEvent,
  clearLegacyRsvpMigrationMark,
  migrateLegacyWishesToEvent,
  clearLegacyWishesMigrationMark
};

window.migrateLocalGuestsToFirebase = migrateLocalGuestsToFirebase;
window.clearGuestsMigrationMark = clearGuestsMigrationMark;
window.seedEventConfig = seedEventConfig;
window.seedEventConfigToFirebase = seedEventConfigToFirebase;
window.seedEventData = seedEventData;
window.clearEventConfigMigrationMark = clearEventConfigMigrationMark;
window.migrateLegacyRsvpToEvent = migrateLegacyRsvpToEvent;
window.clearLegacyRsvpMigrationMark = clearLegacyRsvpMigrationMark;
window.migrateLegacyWishesToEvent = migrateLegacyWishesToEvent;
window.clearLegacyWishesMigrationMark = clearLegacyWishesMigrationMark;

export {
  resolveEventId,
  getEventBasePath,
  getEventConfigPath,
  getEventConfig,
  subscribeToEventConfig,
  getEventInvitadosPath,
  getEventRsvpPath,
  getEventDeseosPath,
  getConfirmationByGuestId,
  saveConfirmation,
  getAllConfirmations,
  subscribeToConfirmations,
  saveWish,
  getAllWishes,
  subscribeToWishes,
  getInvitados,
  subscribeToInvitados,
  getInvitadoById,
  createInvitado,
  updateInvitado,
  deleteInvitado,
  migrateLocalGuestsToFirebase,
  clearGuestsMigrationMark,
  seedEventConfig,
  seedEventConfigToFirebase,
  seedEventData,
  clearEventConfigMigrationMark,
  migrateLegacyRsvpToEvent,
  clearLegacyRsvpMigrationMark,
  migrateLegacyWishesToEvent,
  clearLegacyWishesMigrationMark
};
