// Archivo: js/cuestionarioTarifario.js

// 🔧 Inicializar Firebase (solo si no se ha hecho antes)
const firebaseConfig = {
  apiKey: "AIzaSyBU23xF5UGPYajryv-nSNF4kM9rVOLcE4Y",
  authDomain: "freelo-e73e6.firebaseapp.com",
  projectId: "freelo-e73e6",
  storageBucket: "freelo-e73e6.appspot.com",
  messagingSenderId: "777861139397",
  appId: "1:777861139397:web:08d96bfcfe580f02cf19ac",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

const preguntas = [
  "¿Qué tipo de servicio necesitas?",
  "¿CUÁNTOS AÑOS DE EXPERIENCIA?",
  "¿Qué tipo de entregables realizas?",
  "¿Cuántas revisiones serán?",
  "¿El presupuesto será cubierto por tus medios o por una empresa?",
  "¿Cuál es el presupuesto aproximado en soles (PEN)?",
  "¿Cuál es la urgencia del proyecto?",
  "¿El trabajo requiere conocimientos técnicos específicos?",
  "¿Qué tipo de frecuencia tendrá?",
  "¿El trabajo incluye interacción directa con clientes o usuarios?",
  "¿Es necesario usar herramientas específicas?",
  "¿Se requiere que se firme un acuerdo de confidencialidad (NDA)?",
  "¿Qué idioma debe manejar el freelancer?",
  "¿Cuál es el formato de trabajo preferido?",
  "¿Deseas contratar a una persona o a un equipo?",
];

const opciones = [
  [
    "Diseño gráfico",
    "Redacción / Copywriting",
    "Traducción",
    "Desarrollo web",
    "App móvil",
    "Community manager",
    "Edición de video",
    "Fotografía / Retoque",
    "Asistencia virtual",
    "Marketing digital",
  ],
  ["1 o menos", "1 a 5", "5 a 10"],
  [
    "Archivos editables",
    "Imágenes listas para publicar",
    "Documentos",
    "Código fuente",
    "Videos finales",
    "Informes y reportes",
  ],
  ["1", "2", "3 o más"],
  [
    "Personal (pago con mis propios medios)",
    "Empresa (requiere factura o boleta)",
  ],
  ["Menos de S/ 200", "Entre S/ 200 y S/ 800", "Más de S/ 800"],
  [
    "Lo antes posible (1-3 días)",
    "Normal (4-7 días)",
    "Flexible (más de una semana)",
  ],
  ["Sí", "No"],
  [
    "Único / puntual",
    "Por entregas (ej. artículos semanales)",
    "Mensual / recurrente",
  ],
  ["Sí", "No"],
  ["Sí", "No"],
  ["Sí", "No"],
  ["Solo español", "Español e inglés", "Otro"],
  ["Remoto", "Presencial", "Híbrido"],
  ["Persona", "Equipo","No"],
];

const formulario = document.getElementById("formulario");
const resumen = document.getElementById("resultadoCotizacion");
const respuestas = [];
let paso = 0;
let uidUsuario = null;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    uidUsuario = user.uid;

    const spanNombre = document.getElementById("nombreUsuario");
    const fotoUsuario = document.getElementById("fotoUsuario");

    db.collection("usuarios")
      .doc(user.uid)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data();
          spanNombre.textContent = data.nombre || "Usuario";
          fotoUsuario.src = data.fotoURL || "img/default-user.png";
        }
      });
  }
});

function mostrarPaso(idx) {
  const preguntaHTML = `
    <div class="question active">
      <p>${idx + 1}. ${preguntas[idx]}</p>
      ${opciones[idx].map((opt) => `<label>${opt}</label>`).join("")}
      ${idx > 0 ? '<button id="volverPaso">← Volver</button>' : ""}
    </div>`;
  formulario.innerHTML = preguntaHTML;

  document.querySelectorAll("label").forEach((label) => {
    label.addEventListener("click", () => {
      respuestas[idx] = label.textContent;
      paso++;
      if (paso < preguntas.length) {
        mostrarPaso(paso);
      } else {
        mostrarResumen();
      }
    });
  });

  const volverBtn = document.getElementById("volverPaso");
  if (volverBtn)
    volverBtn.addEventListener("click", () => {
      paso--;
      mostrarPaso(paso);
    });
}

function mostrarResumen() {
  const categoria = respuestas[0]?.toLowerCase();
  let tarifaBase = 40;
  if (categoria.includes("diseño")) tarifaBase = 30;
  if (categoria.includes("redacción")) tarifaBase = 20;
  if (categoria.includes("marketing")) tarifaBase = 25;
  if (categoria.includes("desarrollo")) tarifaBase = 40;

  let horasEstimadas = 10;
  if (respuestas[2]?.includes("código") || respuestas[2]?.includes("videos"))
    horasEstimadas = 20;
  if (respuestas[6]?.includes("urgente")) horasEstimadas -= 2;

  let incremento = 0;
  const experiencia = respuestas[1];
  if (experiencia.includes("1 o menos")) incremento += 0.05;
  else if (experiencia.includes("1 a 5")) incremento += 0.1;
  else if (experiencia.includes("5 a 10")) incremento += 0.2;

  if (respuestas[10] === "Sí") incremento += 0.1;
  if (respuestas[6]?.includes("Lo antes")) incremento += 0.15;

  const total = tarifaBase * horasEstimadas * (1 + incremento);
  const minimo = Math.round(total * 0.95 * 100) / 100;
  const maximo = Math.round(total * 1.05 * 100) / 100;

  formulario.innerHTML = `
  <div class="question active">
    <p>Resumen de tus respuestas:</p>
    <div class="resumen-scroll">
      <ul>
        ${respuestas
          .map(
            (r, i) =>
              `<li><strong>${i + 1}. ${
                preguntas[i]
              }</strong><br>Respuesta: ${r}</li>`
          )
          .join("")}
      </ul>
      <div style="margin-top: 1rem;">
        <p><strong>Tarifa base por hora:</strong> S/.${tarifaBase}</p>
        <p><strong>Horas estimadas:</strong> ${horasEstimadas} h</p>
        <p><strong>Incremento aplicado:</strong> +${Math.round(
          incremento * 100
        )}%</p>
        <p><strong>Rango estimado:</strong> S/.${minimo} - S/.${maximo}</p>
      </div>
    </div>
    <button id="guardarCotizacion">Guardar cotización</button>
    <button id="volverPaso">← Volver</button>
  </div>`;

  document.getElementById("guardarCotizacion").addEventListener("click", () => {
    if (!uidUsuario) return;
    db.collection("cotizaciones")
      .add({
        uid: uidUsuario,
        respuestas,
        tarifaMin: minimo,
        tarifaMax: maximo,
        creado: new Date(),
      })
      .then(() => {
        resumen.innerHTML =
          "<p style='color:lime;'>Cotización guardada correctamente ✅</p>";
        setTimeout(() => {
          document.getElementById("formularioContenedor").style.display =
            "none";
        }, 1500);
      });
  });

  document.getElementById("volverPaso").addEventListener("click", () => {
    paso--;
    mostrarPaso(paso);
  });
}

document.getElementById("abrirFormulario").addEventListener("click", () => {
  paso = 0;
  respuestas.length = 0;
  document.getElementById("formularioContenedor").style.display = "flex";
  mostrarPaso(paso);
});

document.getElementById("cerrarModal").addEventListener("click", () => {
  document.getElementById("formularioContenedor").style.display = "none";
});

// Mostrar/ocultar menú del perfil al hacer click
const perfil = document.getElementById("perfilUsuario");
const menu = document.getElementById("menuUsuario");

perfil.addEventListener("click", () => {
  menu.style.display = menu.style.display === "block" ? "none" : "block";
});

document.addEventListener("click", (e) => {
  if (!perfil.contains(e.target)) menu.style.display = "none";
});

// ✅ Acciones para botones del menú
const btnVerPerfil = document.querySelector("#menuUsuario button:nth-child(1)");
const btnCerrarSesion = document.querySelector(
  "#menuUsuario button:nth-child(2)"
);

btnVerPerfil.addEventListener("click", () => {
  window.location.href = "verPerfil.html";
});

btnCerrarSesion.addEventListener("click", () => {
  firebase
    .auth()
    .signOut()
    .then(() => {
      localStorage.clear();
      window.location.href = "index.html";
    });
});

// 🔄 Agregar botón para ver cotizaciones
const btnCotizaciones = document.createElement("button");
btnCotizaciones.textContent = "📋 Cotizaciones";
btnCotizaciones.onclick = () => (window.location.href = "verCotizaciones.html");
document.getElementById("menuUsuario").appendChild(btnCotizaciones);
