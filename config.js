const firebaseConfig = {
  apiKey: "AIzaSyAqOZQ5YFOdhL6dblHI5wIx10m6n4xt2Fg",
  authDomain: "buenosdeseos-twodesign.firebaseapp.com",
  databaseURL: "https://buenosdeseos-twodesign-default-rtdb.firebaseio.com",
  projectId: "buenosdeseos-twodesign",
  storageBucket: "buenosdeseos-twodesign.firebasestorage.app",
  messagingSenderId: "577908051871",
  appId: "1:577908051871:web:27fbd4e06b3d18da14b7aa"
};

const config = {
  event: {
    defaultEventId: "joserafaelynathalia2026",
    databaseURL: "https://buenosdeseos-twodesign-default-rtdb.firebaseio.com",
    eventIdParam: "eventId",
    legacyFallback: {
      read: false,
      write: false,
      subscribe: false
    }
  },
  admin: {
    adminKey: "twodesign123",
    keyParam: "key",
    legacyKeyParam: "admin"
  },
  seo: {
    titulo: "José Rafael & Nathalia • 24.10.2026",
    descripcion: "Boda de José Rafael González Brol y Nathalia Fernanda Arana Girón - 24 de octubre de 2026",
    autor: "Two Design"
  },
  pareja: {
    nombres: "José Rafael & Nathalia",
    fecha: "24-10-2026",
    fechaVisible: "24.10.2026"
  },
  musica: {
    titulo: "Playlist José Rafael & Nathalia",
    archivo: "music.mp3"
  },
  evento: {
    ceremonia: {
      titulo: "Ceremonia",
      lugar: "Iglesia San Ignacio de Loyola",
      hora: "4:00 PM",
      direccion: "Zona 10, Ciudad de Guatemala",
      ubicacionUrl: "https://maps.app.goo.gl/7547SfvciHp3J1GQ9"
    },
    recepcion: {
      titulo: "Recepción",
      lugar: "Hotel Barceló",
      hora: "6:45 PM",
      direccion: "7a Avenida 15-45, Zona 9, Ciudad de Guatemala",
      ubicacionUrl: "https://maps.app.goo.gl/d9kznhcLBugGfNWK9"
    }
  },
  textos: {
    mensajeInvitado: "Nos encantará compartir este día contigo",
    mensajePases: "Hemos reservado {pases} lugares en su honor"
  },
  footer: {
    hashtag: "#JoseRafaelYNathalia",
    instagramUrl: "https://www.instagram.com/thetwodesign",
    facebookUrl: "https://www.facebook.com/thetwodesign",
    marcaTexto: "Diseño",
    marcaNombre: "Two Design",
    marcaUrl: "https://twodesign.com"
  }
};

window.config = config;
window.firebaseConfig = firebaseConfig;
