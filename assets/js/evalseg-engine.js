// evalseg | Motor ESCE (procesamiento local)
// - Perfilado inicial (tamaño/sector/facturación) para adaptar preguntas
// - Resultados orientados a seguridad + continuidad (no "solo cumplimiento")

let preguntasGlobal = [];
let preguntasFiltradas = [];
let profile = null;

const NIST_BLOCKS = ["IDENTIFICAR", "PROTEGER", "DETECTAR", "RESPONDER", "RECUPERAR"];
const EXTRA_BLOCKS = ["PRIVACIDAD", "GOBERNANZA", "PROVEEDORES"]; // se muestran como análisis adicional

async function cargarPreguntas() {
  try {
    const respuesta = await fetch("./data/questions.json");
    preguntasGlobal = await respuesta.json();
  } catch (e) {
    console.error("Error cargando questions.json", e);
  }
}

function profileLabel(p) {
  const sizeLabel =
    p.size === "micro" ? "1–9" :
    p.size === "small" ? "10–49" :
    p.size === "mid" ? "50–249" : "250–1000";

  const revLabel =
    p.revenue === "rev_a" ? "≤1M€" :
    p.revenue === "rev_b" ? "1–5M€" :
    p.revenue === "rev_c" ? "5–20M€" :
    p.revenue === "rev_d" ? "20–100M€" : ">100M€";

  const sectorLabelMap = {
    services: "Servicios",
    legal: "Legal/Gestoría",
    health: "Salud",
    finance: "Finanzas",
    education: "Educación",
    tech: "Tecnología/SaaS",
    industry: "Industria",
    retail: "Retail",
    other: "Otro",
  };

  return `${sectorLabelMap[p.sector] || "—"} · ${sizeLabel} empleados · ${revLabel}`;
}

/**
 * Filtra preguntas por aplicabilidad:
 * - Siempre incluye las preguntas "core": true
 * - Incluye si coincide el sector (o "any")
 * - Incluye si coincide el tamaño (o "any")
 * - Incluye si coincide la facturación (o "any")
 */
function filtrarPreguntas(profile) {
  const size = profile.size;
  const sector = profile.sector;
  const revenue = profile.revenue;

  const base = preguntasGlobal.filter(q => q.core === true);

  const extra = preguntasGlobal.filter(q => {
    if (q.core === true) return false;

    const sizeOk = !q.apply?.sizes || q.apply.sizes.includes("any") || q.apply.sizes.includes(size);
    const sectorOk = !q.apply?.sectors || q.apply.sectors.includes("any") || q.apply.sectors.includes(sector);
    const revOk = !q.apply?.revenues || q.apply.revenues.includes("any") || q.apply.revenues.includes(revenue);

    return sizeOk && sectorOk && revOk;
  });

  // Orden: por prioridad (desc), y luego por id
  const merged = [...base, ...extra].sort((a, b) => (b.priority || 0) - (a.priority || 0) || a.id - b.id);

  return merged;
}

function renderQuiz() {
  const contenedor = document.getElementById("quiz-container");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!preguntasFiltradas.length) {
    contenedor.innerHTML = `
      <div class="bg-white p-6 rounded-xl border border-red-200 text-red-700">
        No se han encontrado preguntas aplicables para este perfil. Revisa questions.json.
      </div>
    `;
    return;
  }

  preguntasFiltradas.forEach((p, index) => {
    const div = document.createElement("div");
    div.className = "mb-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm";

    const blockPill = p.bloque ? `
      <span class="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 text-slate-600">
        ${p.bloque}
      </span>` : "";

    const explain = p.why ? `<p class="text-xs text-slate-500 mt-2">${p.why}</p>` : "";

    div.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <p class="font-black text-slate-900 text-lg">
          ${index + 1}. ${p.pregunta}
        </p>
        ${blockPill}
      </div>
      ${explain}

      <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <label class="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-blue-50">
          <input type="radio" name="q${p.id}" value="5" class="mr-2">
          <span class="text-sm font-bold text-slate-700">Sí</span>
        </label>

        <label class="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-blue-50">
          <input type="radio" name="q${p.id}" value="2.5" class="mr-2">
          <span class="text-sm font-bold text-slate-700">Parcial</span>
        </label>

        <label class="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-blue-50">
          <input type="radio" name="q${p.id}" value="0" class="mr-2">
          <span class="text-sm font-bold text-slate-700">No</span>
        </label>
      </div>
    `;

    contenedor.appendChild(div);
  });

  const btn = document.createElement("button");
  btn.innerText = "Generar Informe ESCE";
  btn.className = "w-full bg-blue-900 text-white py-4 rounded-xl font-black mt-4 shadow-lg hover:bg-blue-800 transition-all active:scale-[0.99]";
  btn.onclick = mostrarResultados;
  contenedor.appendChild(btn);
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function getAnswerValue(questionId) {
  const seleccion = document.querySelector(`input[name="q${questionId}"]:checked`);
  return seleccion ? parseFloat(seleccion.value) : 0;
}

function calcScoresByBlock() {
  const scores = {};
  [...NIST_BLOCKS, ...EXTRA_BLOCKS].forEach(b => scores[b] = []);

  preguntasFiltradas.forEach(q => {
    const v = getAnswerValue(q.id);
    if (scores[q.bloque]) scores[q.bloque].push(v);
  });

  const result = {};
  Object.keys(scores).forEach(k => result[k] = average(scores[k]));
  return result;
}

function maturityLabel(nota) {
  // 0..5
  if (nota >= 4.5) return { text: "Excelente (Nivel 5)", cls: "text-green-600" };
  if (nota >= 3.5) return { text: "Sólido (Nivel 4)", cls: "text-blue-600" };
  if (nota >= 2.5) return { text: "En progreso (Nivel 3)", cls: "text-yellow-600" };
  if (nota >= 1.5) return { text: "Básico (Nivel 2)", cls: "text-orange-600" };
  return { text: "Crítico (Nivel 1)", cls: "text-red-600" };
}

function roadmapByProfile(profile, scores) {
  // Roadmap simple por fases, adaptado a tamaño/facturación y brechas
  // (Esto se puede refinar más adelante con “motor IA” real. Aquí: reglas explicables.)
  const quickWins = [];
  const phase90 = [];
  const phase180 = [];

  const weak = (b) => (scores[b] || 0) < 3.5;

  // Reglas base
  if (weak("PROTEGER")) quickWins.push("Activar MFA en correo y sistemas críticos; endurecer accesos privilegiados.");
  if (weak("RECUPERAR")) quickWins.push("Asegurar copias 3-2-1 con pruebas de restauración; definir RPO/RTO básicos.");
  if (weak("DETECTAR")) phase90.push("Habilitar registro centralizado y alertas mínimas (accesos anómalos, admin, backups).");
  if (weak("RESPONDER")) phase90.push("Formalizar respuesta a incidentes: roles, playbooks y comunicación.");
  if (weak("IDENTIFICAR")) phase90.push("Inventario de activos y mapa de procesos críticos; clasificación de información.");

  // Sector-specific
  if (profile.sector === "health") {
    phase90.push("Reforzar control de acceso a datos clínicos y trazabilidad (quién accede y cuándo).");
  }
  if (profile.sector === "finance") {
    phase180.push("Plan de resiliencia operativa TIC: pruebas, terceros críticos y ejercicios de crisis.");
  }
  if (profile.sector === "legal") {
    phase90.push("Protección reforzada de expedientes y correo: cifrado, DLP básico y gestión de permisos.");
  }
  if (profile.sector === "tech") {
    phase180.push("Programa de seguridad SDLC: control de cambios, secretos, dependencias y vulnerabilidades.");
  }

  // Tamaño/facturación: ajustar ambición
  if (profile.size === "micro" || profile.size === "small") {
    phase180.push("Implantar políticas mínimas (accesos, backups, proveedores) y revisarlas trimestralmente.");
  } else {
    phase180.push("Cuadro de mando ESCE y reporting trimestral a dirección; KPIs y planes por dominios.");
  }

  return { quickWins, phase90, phase180 };
}

function mostrarResultados() {
  const scores = calcScoresByBlock();

  // Nota global: media NIST (5 bloques)
  const dataNIST = NIST_BLOCKS.map(b => scores[b] || 0);
  const notaFinal = (average(dataNIST)).toFixed(1);
  const level = maturityLabel(parseFloat(notaFinal));

  // Mostrar contenedor
  const results = document.getElementById("results-container");
  results.classList.remove("hidden");
  results.scrollIntoView({ behavior: "smooth" });

  // Contenido
  const recDiv = document.getElementById("recommendations");

  const diagnostics = [
    { nombre: "Identificar", bloque: "IDENTIFICAR", consejo: "Falta visibilidad de activos, riesgos y procesos críticos. Sin inventario, la seguridad se vuelve reactiva." },
    { nombre: "Proteger", bloque: "PROTEGER", consejo: "Las barreras preventivas son insuficientes. Accesos sin MFA y falta de higiene elevan el riesgo de intrusión." },
    { nombre: "Detectar", bloque: "DETECTAR", consejo: "Necesitas visibilidad: logs y alertas mínimas para detectar antes de que el impacto sea total." },
    { nombre: "Responder", bloque: "RESPONDER", consejo: "La reacción es informal. Un incidente puede escalar por falta de roles y playbooks claros." },
    { nombre: "Recuperar", bloque: "RECUPERAR", consejo: "Resiliencia baja. Urge asegurar backups probados y un plan de continuidad operativo." },
  ];

  const extras = [
    { nombre: "Privacidad", bloque: "PRIVACIDAD", consejo: "Gestión de datos personales: inventario, base legal, medidas y respuesta a incidentes." },
    { nombre: "Gobernanza", bloque: "GOBERNANZA", consejo: "Dirección y gobierno: estrategia aprobada, roles claros y seguimiento periódico." },
    { nombre: "Proveedores", bloque: "PROVEEDORES", consejo: "Evaluación de terceros: requisitos mínimos, contratos y revisión de riesgos." },
  ];

  const pill = profileLabel(profile);

  const roadmap = roadmapByProfile(profile, scores);

  let html = `
    <div class="text-center mb-10 py-10 bg-slate-50 rounded-3xl border-2 border-slate-100 shadow-inner">
      <p class="text-slate-500 uppercase tracking-widest text-xs font-black mb-2">Índice global ESCE</p>
      <div class="text-7xl font-black text-blue-900 mb-2">${notaFinal} <span class="text-2xl text-slate-300">/ 5.0</span></div>
      <p class="text-lg font-black ${level.cls}">${level.text}</p>
      <p class="text-xs text-slate-500 mt-4 font-bold">Perfil: ${pill}</p>
    </div>

    <h3 class="text-xl font-black text-blue-900 mb-5 px-2 border-b-2 border-blue-100 pb-2">Análisis por dominios</h3>
  `;

  diagnostics.forEach(d => {
    const v = scores[d.bloque] || 0;
    const weak = v < 3.5;
    const colorBar = weak ? "border-red-500" : "border-green-500";
    const labelColor = weak ? "text-red-600" : "text-green-600";

    html += `
      <div class="mb-4 p-5 bg-white border-l-8 ${colorBar} shadow-sm rounded-r-xl">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs font-black uppercase tracking-wider ${labelColor}">${d.nombre}</span>
          <span class="text-xs font-bold text-slate-400">${v.toFixed(1)} / 5.0</span>
        </div>
        <p class="text-slate-700 text-sm leading-relaxed">
          ${weak ? d.consejo : "Nivel adecuado. Mantén revisión periódica y mejora continua."}
        </p>
      </div>
    `;
  });

  // Extras (si hay preguntas de esos bloques)
  const hasExtra = extras.some(e => preguntasFiltradas.some(q => q.bloque === e.bloque));
  if (hasExtra) {
    html += `
      <h3 class="text-xl font-black text-blue-900 mt-10 mb-5 px-2 border-b-2 border-blue-100 pb-2">Factores adicionales</h3>
    `;
    extras.forEach(e => {
      const questionsFor = preguntasFiltradas.filter(q => q.bloque === e.bloque);
      if (!questionsFor.length) return;

      const v = scores[e.bloque] || 0;
      const weak = v < 3.5;
      const colorBar = weak ? "border-amber-500" : "border-green-500";
      const labelColor = weak ? "text-amber-700" : "text-green-600";

      html += `
        <div class="mb-4 p-5 bg-white border-l-8 ${colorBar} shadow-sm rounded-r-xl">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-black uppercase tracking-wider ${labelColor}">${e.nombre}</span>
            <span class="text-xs font-bold text-slate-400">${v.toFixed(1)} / 5.0</span>
          </div>
          <p class="text-slate-700 text-sm leading-relaxed">${e.consejo}</p>
        </div>
      `;
    });
  }

  // Roadmap
  html += `
    <h3 class="text-xl font-black text-blue-900 mt-10 mb-5 px-2 border-b-2 border-blue-100 pb-2">Hoja de ruta ejecutable</h3>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="p-5 bg-slate-50 rounded-2xl border border-slate-200">
        <p class="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">0–30 días</p>
        ${roadmap.quickWins.length ? `<ul class="text-sm text-slate-700 space-y-2 list-disc pl-4">${roadmap.quickWins.map(x => `<li>${x}</li>`).join("")}</ul>` : `<p class="text-sm text-slate-500">Sin acciones críticas detectadas.</p>`}
      </div>
      <div class="p-5 bg-slate-50 rounded-2xl border border-slate-200">
        <p class="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">30–90 días</p>
        ${roadmap.phase90.length ? `<ul class="text-sm text-slate-700 space-y-2 list-disc pl-4">${roadmap.phase90.map(x => `<li>${x}</li>`).join("")}</ul>` : `<p class="text-sm text-slate-500">Continuar consolidación y seguimiento.</p>`}
      </div>
      <div class="p-5 bg-slate-50 rounded-2xl border border-slate-200">
        <p class="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">90–180 días</p>
        ${roadmap.phase180.length ? `<ul class="text-sm text-slate-700 space-y-2 list-disc pl-4">${roadmap.phase180.map(x => `<li>${x}</li>`).join("")}</ul>` : `<p class="text-sm text-slate-500">Planificar mejoras y madurez.</p>`}
      </div>
    </div>
  `;

  // CTA (coherente con tu tesis, sin "vender rapidez")
  html += `
    <div class="mt-10 p-8 bg-blue-900 text-white rounded-3xl text-center shadow-2xl">
      <h4 class="text-xl font-black mb-3">¿Quieres convertir esta ESCE en ejecución?</h4>
      <p class="text-blue-200 text-sm mb-8 max-w-xl mx-auto">
        Podemos acompañarte con dirección ejecutiva (vCISO/vDPO) y una implantación por fases,
        ajustada a tu capacidad real. El objetivo: operar con seguridad para seguir operando.
      </p>
      <a href="mailto:contacto@esionadvisory.com?subject=Informe evalseg ESCE ${notaFinal}" class="inline-block bg-white text-blue-900 px-10 py-4 rounded-full font-black uppercase text-sm tracking-widest hover:bg-blue-50 shadow-lg">
        Hablar con Esion Advisory
      </a>
    </div>
  `;

  recDiv.innerHTML = html;

  // Chart radar (NIST 5)
  const ctx = document.getElementById("complianceChart");
  if (window.myChart) window.myChart.destroy();

  window.myChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Identificar", "Proteger", "Detectar", "Responder", "Recuperar"],
      datasets: [{
        label: "Madurez (referencia NIST CSF)",
        data: dataNIST.map(v => Number(v.toFixed(2))),
        backgroundColor: "rgba(30, 58, 138, 0.15)",
        borderColor: "rgb(30, 58, 138)",
        pointBackgroundColor: "rgb(30, 58, 138)",
        pointRadius: 4,
        borderWidth: 3
      }]
    },
    options: {
      scales: { r: { min: 0, max: 5, ticks: { stepSize: 1, display: false }, grid: { color: "#e2e8f0" } } },
      plugins: { legend: { display: false } }
    }
  });
}

function initProfileFlow() {
  const form = document.getElementById("profile-form");
  const quizSection = document.getElementById("quiz-section");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    profile = {
      size: document.getElementById("company-size").value,
      revenue: document.getElementById("company-revenue").value,
      sector: document.getElementById("company-sector").value,
      priority: document.getElementById("company-priority").value || "general",
    };

    // filtrar y renderizar
    preguntasFiltradas = filtrarPreguntas(profile);

    // actualizar UI de perfil
    document.getElementById("profile-pill").textContent = profileLabel(profile);
    document.getElementById("quiz-subtitle").textContent = `Preguntas adaptadas a tu perfil (${preguntasFiltradas.length} ítems).`;

    // ocultar intro, mostrar quiz
    document.getElementById("intro-container").classList.add("hidden");
    quizSection.classList.remove("hidden");

    renderQuiz();
    quizSection.scrollIntoView({ behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await cargarPreguntas();
  initProfileFlow();
});
