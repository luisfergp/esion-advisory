// Lógica de EvalSeg v1.0 para Esion Advisory

let preguntasGlobal = [];

async function cargarPreguntas() {
    const contenedor = document.getElementById('quiz-container');
    if (!contenedor) return;

    try {
        const respuesta = await fetch('./data/questions.json');
        preguntasGlobal = await respuesta.json();
        contenedor.innerHTML = ""; 

        preguntasGlobal.forEach((p, index) => {
            const div = document.createElement('div');
            div.className = "mb-8 p-6 bg-white rounded-xl border border-slate-200 shadow-sm";
            div.innerHTML = `
                <p class="font-bold text-slate-900 mb-4 text-lg">${index + 1}. ${p.pregunta}</p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50">
                        <input type="radio" name="q${p.id}" value="5" class="mr-2"> <span class="text-sm font-medium text-slate-700">Sí</span>
                    </label>
                    <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50">
                        <input type="radio" name="q${p.id}" value="2.5" class="mr-2"> <span class="text-sm font-medium text-slate-700">Parcial</span>
                    </label>
                    <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50">
                        <input type="radio" name="q${p.id}" value="0" class="mr-2"> <span class="text-sm font-medium text-slate-700">No</span>
                    </label>
                </div>
            `;
            contenedor.appendChild(div);
        });

        const btn = document.createElement('button');
        btn.innerText = "Finalizar y Ver Gráfico de Madurez NIST";
        btn.className = "w-full bg-blue-900 text-white py-4 rounded-xl font-bold mt-6 shadow-lg hover:bg-blue-800 transition-all active:scale-95";
        btn.onclick = mostrarResultados;
        contenedor.appendChild(btn);

    } catch (e) {
        contenedor.innerHTML = "<p class='p-4 bg-red-50 text-red-600 rounded'>Error cargando la matriz de controles.</p>";
    }
}

function mostrarResultados() {
    const nistBlocks = ['IDENTIFICAR', 'PROTEGER', 'DETECTAR', 'RESPONDER', 'RECUPERAR'];
    const scores = { 'IDENTIFICAR': [], 'PROTEGER': [], 'DETECTAR': [], 'RESPONDER': [], 'RECUPERAR': [] };

    // 1. Calcular puntuaciones por bloque NIST
    preguntasGlobal.forEach(p => {
        const seleccion = document.querySelector(`input[name="q${p.id}"]:checked`);
        const valor = seleccion ? parseFloat(seleccion.value) : 0;
        if (scores[p.bloque]) {
            scores[p.bloque].push(valor);
        }
    });

    const dataNIST = nistBlocks.map(bloque => {
        const lista = scores[bloque];
        return lista.length > 0 ? (lista.reduce((a, b) => a + b, 0) / lista.length) : 0;
    });

    // --- CÁLCULO DE NOTA FINAL ---
    const notaFinal = (dataNIST.reduce((a, b) => a + b, 0) / 5).toFixed(1);

    // Determinar texto de nivel
    let nivelTexto = "";
    let colorClase = "";
    if (notaFinal >= 4.5) { nivelTexto = "Optimizado (Nivel 5)"; colorClase = "text-green-600"; }
    else if (notaFinal >= 3.5) { nivelTexto = "Gestionado (Nivel 4)"; colorClase = "text-blue-600"; }
    else if (notaFinal >= 2.5) { nivelTexto = "Definido (Nivel 3)"; colorClase = "text-yellow-600"; }
    else if (notaFinal >= 1.5) { nivelTexto = "En Desarrollo (Nivel 2)"; colorClase = "text-orange-600"; }
    else { nivelTexto = "Inicial (Nivel 1)"; colorClase = "text-red-600"; }

    // 2. Mostrar contenedores
    document.getElementById('results-container').classList.remove('hidden');
    document.getElementById('results-container').scrollIntoView({ behavior: 'smooth' });

    // 3. GENERADOR DE CONTENIDO (Puntuación + Recomendaciones)
    const recDiv = document.getElementById('recommendations');
    
    // CABECERA CON NOTA GRANDE
    let htmlContent = `
        <div class="text-center mb-12 py-10 bg-slate-50 rounded-3xl border-2 border-slate-100 shadow-inner">
            <p class="text-slate-500 uppercase tracking-widest text-xs font-black mb-2">Índice de Resiliencia Global</p>
            <div class="text-7xl font-black text-blue-900 mb-2">${notaFinal} <span class="text-2xl text-slate-300">/ 5.0</span></div>
            <p class="text-lg font-bold ${colorClase}">${nivelTexto}</p>
        </div>
        
        <h3 class='text-xl font-bold text-blue-900 mb-6 px-2 border-b-2 border-blue-100 pb-2'>Análisis Estratégico</h3>
    `;
    
    // Lógica de diagnóstico por eje
    const diagnosticos = [
        { nombre: 'Identificar', valor: dataNIST[0], consejo: 'Falta visibilidad sobre sus activos y riesgos. Sin un inventario claro, la seguridad es reactiva.' },
        { nombre: 'Proteger', valor: dataNIST[1], consejo: 'Sus barreras preventivas son insuficientes. El factor humano y el acceso sin MFA son riesgos críticos.' },
        { nombre: 'Detectar', valor: dataNIST[2], consejo: 'Operación "a ciegas". Necesita monitorización para identificar ataques antes de que el impacto sea total.' },
        { nombre: 'Responder', valor: dataNIST[3], consejo: 'Capacidad de reacción informal. Un incidente podría paralizar la operativa por falta de protocolos.' },
        { nombre: 'Recuperar', valor: dataNIST[4], consejo: 'Resiliencia baja. Urge asegurar copias inmutables y planes de continuidad probados.' }
    ];

    diagnosticos.forEach(d => {
        const colorBarra = d.valor < 3.5 ? 'border-red-500' : 'border-green-500';
        const labelColor = d.valor < 3.5 ? 'text-red-600' : 'text-green-600';
        
        htmlContent += `
            <div class='mb-4 p-5 bg-white border-l-8 ${colorBarra} shadow-sm rounded-r-xl'>
                <div class='flex justify-between items-center mb-1'>
                    <span class='text-xs font-black uppercase tracking-wider ${labelColor}'>${d.nombre}</span>
                    <span class='text-xs font-bold text-slate-400'>${d.valor.toFixed(1)} / 5.0</span>
                </div>
                <p class='text-slate-700 text-sm leading-relaxed'>${d.valor < 3.5 ? d.consejo : 'Cumplimiento adecuado. Mantenga la revisión periódica de controles.'}</p>
            </div>`;
    });

    // Botón de contacto final
    htmlContent += `
        <div class='mt-12 p-8 bg-blue-900 text-white rounded-3xl text-center shadow-2xl transform hover:scale-[1.02] transition-transform'>
            <h4 class='text-xl font-bold mb-3'>¿Desea cerrar estas brechas?</h4>
            <p class='text-blue-200 text-sm mb-8 max-w-md mx-auto'>Su organización presenta puntos críticos en la normativa <strong>DORA/NIS2</strong>. En Esion Advisory diseñamos su plan de remediación a medida.</p>
            <a href='mailto:contacto@esionadvisory.com?subject=Informe EvalSeg ${notaFinal}' class='inline-block bg-white text-blue-900 px-10 py-4 rounded-full font-black uppercase text-sm tracking-widest hover:bg-blue-50 shadow-lg'>
                Contactar con un Consultor
            </a>
        </div>`;

    recDiv.innerHTML = htmlContent;

    // 4. DIBUJAR GRÁFICO
    const ctx = document.getElementById('complianceChart');
    if (window.myChart) { window.myChart.destroy(); }
    window.myChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Identificar', 'Proteger', 'Detectar', 'Responder', 'Recuperar'],
            datasets: [{
                label: 'Madurez NIST CSF',
                data: dataNIST.map(v => v.toFixed(2)),
                backgroundColor: 'rgba(30, 58, 138, 0.15)',
                borderColor: 'rgb(30, 58, 138)',
                pointBackgroundColor: 'rgb(30, 58, 138)',
                pointRadius: 4,
                borderWidth: 3
            }]
        },
        options: {
            scales: { r: { min: 0, max: 5, ticks: { stepSize: 1, display: false }, grid: { color: '#e2e8f0' } } },
            plugins: { legend: { display: false } }
        }
    });
}
document.addEventListener('DOMContentLoaded', cargarPreguntas);
