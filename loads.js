const guests = [
  {
    id: "1",
    name: "Familia Arana Girón",
    passes: 5,
    members: [
      { name: "Fernando Arana", passes: 1 },
      { name: "Lissette de Arana", passes: 1 },
      { name: "Nathalia Arana", passes: 1 },
      { name: "Valeria Arana", passes: 1 },
      { name: "Marta Poyon", passes: 1 }
    ]
  },
  {
    id: "2",
    name: "Familia Galindo Brol",
    passes: 4,
    members: [
      { name: "Carola Brol", passes: 1 },
      { name: "Luis Galindo", passes: 1 },
      { name: "Natalia Gonzalez", passes: 1 },
      { name: "Jose Gonzalez", passes: 1 }
    ]
  },
  {
    id: "3",
    name: "Sra Aida Luna y Joseph Farach",
    passes: 2,
    members: [
      { name: "Aida Luna", passes: 1 },
      { name: "Joseph Farach", passes: 1 }
    ]
  },
  {
    id: "4",
    name: "Familia Aranki Franco",
    passes: 4,
    members: [
      { name: "Osama Aranki", passes: 1 },
      { name: "Iris Franco", passes: 1 },
      { name: "Pedro Aranki", passes: 1 },
      { name: "Amar Aranki", passes: 1 }
    ]
  },
  {
    id: "5",
    name: "Señora Blanca Alfaro de Girón",
    passes: 1,
    members: [
      { name: "Blanca Alfaro de Girón", passes: 1 }
    ]
  },
  {
    id: "6",
    name: "Señor Enrique Cazali y Sra Miriam de Cazali",
    passes: 2,
    members: [
      { name: "Enrique Cazali", passes: 1 },
      { name: "Miriam de Cazali", passes: 1 }
    ]
  },
  {
    id: "7",
    name: "Familia Cazali Girón",
    passes: 6,
    members: [
      { name: "Mauricio Cazali", passes: 1 },
      { name: "Jessica de Cazali", passes: 1 },
      { name: "Stefan Cazali", passes: 1 },
      { name: "Sebastián Cazali", passes: 1 },
      { name: "Santiago Cazali", passes: 1 },
      { name: "Adriana Evans", passes: 1 }
    ]
  },
  {
    id: "8",
    name: "Familia Barrientos Girón",
    passes: 5,
    members: [
      { name: "Rodolfo Barrientos", passes: 1 },
      { name: "Wendy de Barrientos", passes: 1 },
      { name: "Mishell Barrientos", passes: 1 },
      { name: "Rodolfo Barrientos Jr", passes: 1 },
      { name: "Daniela Montes", passes: 1 }
    ]
  },
  {
    id: "9",
    name: "Familia Barrientos Herrera",
    passes: 4,
    members: [
      { name: "Susel Herrera", passes: 1 },
      { name: "Gabriela Barrientos", passes: 1 },
      { name: "Eduardo Barrientos", passes: 1 },
      { name: "Diego Leiva", passes: 1 }
    ]
  },
  {
    id: "10",
    name: "Familia Ramírez",
    passes: 2,
    members: [
      { name: "Dionne de Ramírez", passes: 1 },
      { name: "Alisson Ramírez", passes: 1 }
    ]
  },
  {
    id: "11",
    name: "Familia Morales Arana",
    passes: 3,
    members: [
      { name: "Ernesto Morales", passes: 1 },
      { name: "María Eugenia de Morales", passes: 1 },
      { name: "María Eugenia Morales", passes: 1 }
    ]
  },
  {
    id: "12",
    name: "Señor Ernesto Morales y Sra Carla Martínez",
    passes: 2,
    members: [
      { name: "Ernesto Morales", passes: 1 },
      { name: "Carla Martínez", passes: 1 }
    ]
  },
  {
    id: "13",
    name: "Señor Juan Pablo Morales y Sra María Fernanda Gálvez",
    passes: 2,
    members: [
      { name: "Juan Pablo Morales", passes: 1 },
      { name: "María Fernanda Gálvez", passes: 1 }
    ]
  },
  {
    id: "14",
    name: "Señor Mario de León y María Alejandra de León",
    passes: 2,
    members: [
      { name: "Mario de León", passes: 1 },
      { name: "María Alejandra de León", passes: 1 }
    ]
  },
  {
    id: "15",
    name: "Luisa Arana y Martín Arana",
    passes: 2,
    members: [
      { name: "Luisa Arana", passes: 1 },
      { name: "Martín Arana", passes: 1 }
    ]
  },
  {
    id: "16",
    name: "Señor Ronald Stalling y Sra Paola Arana",
    passes: 2,
    members: [
      { name: "Ronald Stalling", passes: 1 },
      { name: "Paola Arana", passes: 1 }
    ]
  },
  {
    id: "17",
    name: "Señor Fernando Arana y Sra María Eugenia Urzua",
    passes: 2,
    members: [
      { name: "Fernando Arana", passes: 1 },
      { name: "María Eugenia Urzua", passes: 1 }
    ]
  },
  {
    id: "18",
    name: "Señor Rafael Brol y Sra Leticia Rivera de Brol",
    passes: 2,
    members: [
      { name: "Rafael Brol", passes: 1 },
      { name: "Leticia Rivera de Brol", passes: 1 }
    ]
  },
  {
    id: "19",
    name: "Señor Osvaldo González y Sra Lucia González",
    passes: 2,
    members: [
      { name: "Osvaldo González", passes: 1 },
      { name: "Lucia González", passes: 1 }
    ]
  },
  {
    id: "20",
    name: "Familia Alvarado Brol",
    passes: 4,
    members: [
      { name: "Jorge Alvarado", passes: 1 },
      { name: "Jennifer Brol", passes: 1 },
      { name: "Abby Alvarado", passes: 1 },
      { name: "Ally Alvarado", passes: 1 }
    ]
  },
  {
    id: "21",
    name: "Señor Marco Tulio Búcaro y Sra Ingrid de Búcaro",
    passes: 2,
    members: [
      { name: "Marco Tulio Búcaro", passes: 1 },
      { name: "Ingrid de Búcaro", passes: 1 }
    ]
  },
  {
    id: "22",
    name: "Señor Julio Batres y Sra Claudia Bucaro de Batres",
    passes: 2,
    members: [
      { name: "Julio Batres", passes: 1 },
      { name: "Claudia Bucaro de Batres", passes: 1 }
    ]
  },
  {
    id: "23",
    name: "Señor Marco Tulio Búcaro y Sra Princesita Monje",
    passes: 2,
    members: [
      { name: "Marco Tulio Búcaro", passes: 1 },
      { name: "Princesita Monje", passes: 1 }
    ]
  },
  {
    id: "24",
    name: "Sra Rosa María Arana y Sra Marcela Prado",
    passes: 3,
    members: [
      { name: "Rosa María Arana", passes: 1 },
      { name: "Marcela Prado", passes: 1 },
      { name: "Fernando de Dios", passes: 1 }
    ]
  },
  {
    id: "25",
    name: "Señor Arturo Batres y Sra Angela de Batres",
    passes: 2,
    members: [
      { name: "Arturo Batres", passes: 1 },
      { name: "Angela de Batres", passes: 1 }
    ]
  },
  {
    id: "26",
    name: "Señor Carlos Arturo Batres y Sra Leticia de Batres",
    passes: 2,
    members: [
      { name: "Carlos Arturo Batres", passes: 1 },
      { name: "Leticia de Batres", passes: 1 }
    ]
  },
  {
    id: "27",
    name: "Señora Sara Batres Gil",
    passes: 1,
    members: [
      { name: "Sara Batres Gil", passes: 1 }
    ]
  },
  {
    id: "28",
    name: "Señor Carlos Aguja y Sra Martha de Aguja",
    passes: 2,
    members: [
      { name: "Carlos Aguja", passes: 1 },
      { name: "Martha de Aguja", passes: 1 }
    ]
  },
  {
    id: "29",
    name: "Señor Gustavo Sandoval y Sra Claudia de Sandoval",
    passes: 2,
    members: [
      { name: "Gustavo Sandoval", passes: 1 },
      { name: "Claudia de Sandoval", passes: 1 }
    ]
  },
  {
    id: "30",
    name: "Monther Ghawali y Ricardo Ghawali +1",
    passes: 3,
    members: [
      { name: "Monther Ghawali", passes: 1 },
      { name: "Ricardo Ghawali", passes: 1 },
      { name: "Plus One", passes: 1 }
    ]
  },
  {
    id: "31",
    name: "Christian Ghawali y Paula Gularte",
    passes: 2,
    members: [
      { name: "Christian Ghawali", passes: 1 },
      { name: "Paula Gularte", passes: 1 }
    ]
  },
  {
    id: "32",
    name: "George Radi y Sofía Choriego",
    passes: 2,
    members: [
      { name: "George Radi", passes: 1 },
      { name: "Sofía Choriego", passes: 1 }
    ]
  },
  {
    id: "33",
    name: "Alexander Ghawali y Daniela Anguiano",
    passes: 2,
    members: [
      { name: "Alexander Ghawali", passes: 1 },
      { name: "Daniela Anguiano", passes: 1 }
    ]
  },
  {
    id: "34",
    name: "Familia Macarían Ghawali",
    passes: 4,
    members: [
      { name: "Cristina Macarían", passes: 1 },
      { name: "Gabriela Macarian", passes: 1 },
      { name: "Elías Macarían", passes: 1 },
      { name: "Daniel Pérez", passes: 1 }
    ]
  },
  {
    id: "35",
    name: "Valery Ghawali",
    passes: 1,
    members: [
      { name: "Valery Ghawali", passes: 1 }
    ]
  },
  {
    id: "36",
    name: "Señor Monder Ghawali y Sra María José Valladares",
    passes: 2,
    members: [
      { name: "Monder Ghawali", passes: 1 },
      { name: "María José Valladares", passes: 1 }
    ]
  },
  {
    id: "37",
    name: "Señor Bishara Ghawali y Sra Ruba de Ghawali",
    passes: 2,
    members: [
      { name: "Bishara Ghawali", passes: 1 },
      { name: "Ruba de Ghawali", passes: 1 }
    ]
  },
  {
    id: "38",
    name: "Señor Jude Ghawali y Sra Shadia de Ghawali",
    passes: 2,
    members: [
      { name: "Jude Ghawali", passes: 1 },
      { name: "Shadia de Ghawali", passes: 1 }
    ]
  },
  {
    id: "39",
    name: "Fernando Carvajal",
    passes: 1,
    members: [
      { name: "Fernando Carvajal", passes: 1 }
    ]
  },
  {
    id: "40",
    name: "Diego Ralon",
    passes: 1,
    members: [
      { name: "Diego Ralon", passes: 1 }
    ]
  },
  {
    id: "41",
    name: "Jorge Cabrera",
    passes: 1,
    members: [
      { name: "Jorge Cabrera", passes: 1 }
    ]
  },
  {
    id: "42",
    name: "Julio Secaida",
    passes: 1,
    members: [
      { name: "Julio Secaida", passes: 1 }
    ]
  },
  {
    id: "43",
    name: "José Moino",
    passes: 1,
    members: [
      { name: "José Moino", passes: 1 }
    ]
  },
  {
    id: "44",
    name: "Andrés Estrada",
    passes: 1,
    members: [
      { name: "Andrés Estrada", passes: 1 }
    ]
  },
  {
    id: "45",
    name: "Jacobo Calvo y Sofia Castellanos",
    passes: 2,
    members: [
      { name: "Jacobo Calvo", passes: 1 },
      { name: "Sofia Castellanos", passes: 1 }
    ]
  },
  {
    id: "46",
    name: "Victor García y Andrea López",
    passes: 2,
    members: [
      { name: "Victor García", passes: 1 },
      { name: "Andrea López", passes: 1 }
    ]
  },
  {
    id: "47",
    name: "Luis Herrera y Rachel López",
    passes: 2,
    members: [
      { name: "Luis Herrera", passes: 1 },
      { name: "Rachel López", passes: 1 }
    ]
  },
  {
    id: "48",
    name: "Jorge del Águila",
    passes: 1,
    members: [
      { name: "Jorge del Águila", passes: 1 }
    ]
  },
  {
    id: "49",
    name: "Señor Erick Fernández y Sra Miriam de Fernández",
    passes: 2,
    members: [
      { name: "Erick Fernández", passes: 1 },
      { name: "Miriam de Fernández", passes: 1 }
    ]
  },
  {
    id: "50",
    name: "Señor y Sra Cambara",
    passes: 2,
    members: [
      { name: "Fredy Cambara", passes: 1 },
      { name: "Lucky de Cambara", passes: 1 }
    ]
  },
  {
    id: "51",
    name: "Señor y Sra Figueroa",
    passes: 2,
    members: [
      { name: "Wilston Figueroa", passes: 1 },
      { name: "Lara de Figueroa", passes: 1 }
    ]
  },
  {
    id: "52",
    name: "Señor y Sra Monroy",
    passes: 2,
    members: [
      { name: "Hans Monroy", passes: 1 },
      { name: "Belen de Monroy", passes: 1 }
    ]
  },
  {
    id: "53",
    name: "Señor Bernic Paz y Sra Magda de Paz",
    passes: 2,
    members: [
      { name: "Bernic Paz", passes: 1 },
      { name: "Magda de Paz", passes: 1 }
    ]
  },
  {
    id: "54",
    name: "Álvaro Ramírez y Alejandra Paz de Ramírez",
    passes: 2,
    members: [
      { name: "Álvaro Ramírez", passes: 1 },
      { name: "Alejandra Paz de Ramírez", passes: 1 }
    ]
  },
  {
    id: "55",
    name: "Sra Carmen Guarderas Arana",
    passes: 1,
    members: [
      { name: "Carmen Guarderas Arana", passes: 1 }
    ]
  },
  {
    id: "56",
    name: "Señor Joe Guarderas y Sra Nancy de Guarderas",
    passes: 2,
    members: [
      { name: "Joe Guarderas", passes: 1 },
      { name: "Nancy de Guarderas", passes: 1 }
    ]
  },
  {
    id: "57",
    name: "Familia Key Guarderas",
    passes: 4,
    members: [
      { name: "Michael Key", passes: 1 },
      { name: "Vanessa Key", passes: 1 },
      { name: "Camila Key", passes: 1 },
      { name: "Daniela Key", passes: 1 }
    ]
  },
  {
    id: "58",
    name: "Señor Armando Enriquez y Sra Lorena Enriquez",
    passes: 2,
    members: [
      { name: "Armando Enriquez", passes: 1 },
      { name: "Lorena Enriquez", passes: 1 }
    ]
  },
  {
    id: "59",
    name: "Señor Alejandro Alfaro y Sra Cristina de Alfaro",
    passes: 2,
    members: [
      { name: "Alejandro Alfaro", passes: 1 },
      { name: "Cristina de Alfaro", passes: 1 }
    ]
  },
  {
    id: "60",
    name: "Señor Rodolfo Alfaro y Sra Guadalupe Alfaro",
    passes: 2,
    members: [
      { name: "Rodolfo Alfaro", passes: 1 },
      { name: "Guadalupe Alfaro", passes: 1 }
    ]
  },
  {
    id: "61",
    name: "Señora Isabela Melo",
    passes: 1,
    members: [
      { name: "Isabela Melo", passes: 1 }
    ]
  },
  {
    id: "62",
    name: "Señora Mónica Ortiz",
    passes: 1,
    members: [
      { name: "Mónica Ortiz", passes: 1 }
    ]
  },
  {
    id: "63",
    name: "Sr Evan Foster y Sra María Alejandra Morales",
    passes: 2,
    members: [
      { name: "Evan Foster", passes: 1 },
      { name: "María Alejandra Morales", passes: 1 }
    ]
  }
];

function normalizeGuestMembers(rawMembers) {
  if (!Array.isArray(rawMembers)) return [];

  return rawMembers
    .map((member, index) => {
      const name = String(member?.name || member?.nombre || "").trim();
      if (!name) return null;

      return {
        id: String(member?.id || member?.guestId || `member-${index + 1}`),
        name,
        passes: Math.max(1, Number(member?.passes || member?.pases || 1))
      };
    })
    .filter(Boolean);
}

window.guests = guests;
window.LocalGuestSeeds = {
  ...(window.LocalGuestSeeds || {}),
  joserafaelynathalia2026: guests.reduce((acc, guest) => {
    acc[String(guest.id)] = {
      id: String(guest.id),
      nombre: guest.name,
      pases: Number(guest.passes || 1),
      integrantes: normalizeGuestMembers(guest.members).map((member) => ({
        id: member.id,
        nombre: member.name,
        pases: member.passes
      })),
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
    passes: Math.max(1, Number(guest.passes || guest.pases) || 1),
    members: normalizeGuestMembers(guest.members || guest.integrantes)
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
      const localGuest = guests.find((guest) => String(guest.id) === String(guestId));
      const mergedGuest = {
        ...remoteGuest,
        integrantes: Array.isArray(remoteGuest.integrantes) && remoteGuest.integrantes.length > 0
          ? remoteGuest.integrantes
          : (localGuest?.members || [])
      };
      console.log("[RSVP][GuestLoad] Invitado encontrado en Firebase", remoteGuest);
      setCurrentGuest(mergedGuest);
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
