// PIN de acceso fijo
const PIN_CORRECTO = "1834";

// Cargar historial desde localStorage
let historial = JSON.parse(localStorage.getItem("historial_asistencia")) || [];

// Cargar usuarios desde localStorage
const usuarios = JSON.parse(localStorage.getItem("usuarios_webauthn")) || {};

// Verifica el PIN
function verificarPIN() {
  const pinInput = document.getElementById("pin-input").value;
  if (pinInput === PIN_CORRECTO) {
    document.getElementById("pin-container").style.display = "none";
    document.getElementById("app-container").style.display = "block";
    actualizarHistorialUI();
  } else {
    document.getElementById("pin-error").textContent = "PIN incorrecto.";
  }
}

// Muestra el historial en pantalla
function actualizarHistorialUI() {
  const historialUl = document.getElementById("historial");
  historialUl.innerHTML = "";
  historial.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.nombre} - ${item.tipo} - ${item.fecha} ${item.hora}`;
    historialUl.appendChild(li);
  });
}

// Registra un nuevo usuario con huella
function registrarUsuarioConHuella() {
  const nombre = document.getElementById("nombre").value.trim();
  if (!nombre) return alert("Escribe un nombre primero");

  const credOptions = {
    publicKey: {
      challenge: new Uint8Array(32),
      rp: { name: "Lector Beta" },
      user: {
        id: Uint8Array.from(nombre, c => c.charCodeAt(0)),
        name: nombre,
        displayName: nombre
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: { authenticatorAttachment: "platform" },
      timeout: 60000,
      attestation: "direct"
    }
  };

  navigator.credentials.create(credOptions).then(cred => {
    usuarios[nombre] = true;
    localStorage.setItem("usuarios_webauthn", JSON.stringify(usuarios));
    alert(`Usuario ${nombre} registrado con huella.`);
    document.getElementById("nombre").value = "";
  }).catch(err => {
    console.error(err);
    alert("Fallo al registrar huella");
  });
}

// Autentica con huella y registra asistencia
function autenticarYRegistrarAsistencia() {
  const nombre = document.getElementById("nombre").value.trim();
  if (!nombre) return alert("Escribe tu nombre para verificar");

  if (!usuarios[nombre]) {
    return alert("El usuario no está registrado. Regístralo primero.");
  }

  const credOptions = {
    publicKey: {
      challenge: new Uint8Array(32),
      timeout: 60000,
      rpId: window.location.hostname,
      allowCredentials: [{
        id: Uint8Array.from(nombre, c => c.charCodeAt(0)),
        type: "public-key"
      }],
      userVerification: "preferred"
    }
  };

  navigator.credentials.get(credOptions).then(() => {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString("es-CO");
    const hora = ahora.toLocaleTimeString("es-CO");

    const asistencia = {
      nombre: nombre,
      tipo: "Asistencia",
      fecha: fecha,
      hora: hora
    };

    historial.push(asistencia);
    localStorage.setItem("historial_asistencia", JSON.stringify(historial));
    actualizarHistorialUI();

    alert(`Asistencia registrada para ${nombre} a las ${hora}`);
  }).catch(err => {
    console.error(err);
    alert("Fallo en la autenticación con huella.");
  });
}

// Borrar historial con confirmación
function borrarHistorial() {
  if (confirm("¿Estás seguro de borrar el historial?")) {
    historial = [];
    localStorage.removeItem("historial_asistencia");
    actualizarHistorialUI();
  }
}