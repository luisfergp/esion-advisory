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

    // 2. Mostrar contenedores
    document.getElementById('results-container').classList.remove('hidden');
    document.getElementById('results-container').scrollIntoView({ behavior: 'smooth' });

    // 3. GENERADOR DE RECOMENDACIONES DETALLADAS
    const recDiv = document.getElementById('recommendations');
    let htmlRecs = `<h3 class='text-xl font-bold text-blue-900 mb-6'>Análisis Estratégico de Esion Advisory</h3>`;
    
    // Lógica de diagnóstico por eje
    const diagnosticos = [
        { nombre: 'Identificar', valor: dataNIST[0], consejo: 'Falta visibilidad sobre sus activos y riesgos. Sin un inventario y gobernanza clara, la seguridad es reactiva.' },
        { nombre: 'Proteger', valor: dataNIST[1], consejo: 'Sus barreras preventivas (MFA, Cifrado, Concienciación) son insuficientes. El factor humano es su mayor riesgo actual.' },
        { nombre: 'Detectar', valor: dataNIST[2], consejo: 'Está operando "a ciegas". Necesita implementar monitorización continua para identificar ataques antes de que sea tarde.' },
        { nombre: 'Responder', valor: dataNIST[3], consejo: 'No tiene capacidad de reacción formal. Un incidente hoy podría paralizar la empresa por falta de protocolos.' },
        { nombre: 'Recuperar', valor: dataNIST[4], consejo: 'Su resiliencia es baja. Necesita asegurar copias inmutables y planes de continuidad de negocio.' }
    ];

    diagnosticos.forEach(d => {
        if (d.valor < 3.5) { // Si la nota es baja (Criterio consultivo)
            htmlRecs += `
                <div class='mb-4 p-4 bg-white border-l-4 border-red-500 shadow-sm rounded-r-lg'>
                    <span class='text-xs font-bold text-red-600 uppercase tracking-wider'>Prioridad Alta: ${d.nombre}</span>
                    <p class='text-slate-700 text-sm mt-1'>${d.consejo}</p>
                </div>`;
        } else {
            htmlRecs += `
                <div class='mb-4 p-4 bg-white border-l-4 border-green-500 shadow-sm rounded-r-lg'>
                    <span class='text-xs font-bold text-green-600 uppercase tracking-wider'>Fortaleza: ${d.nombre}</span>
                    <p class='text-slate-700 text-sm mt-1'>Mantiene un nivel adecuado, continúe con la mejora continua.</p>
                </div>`;
        }
    });

    // Botón de contacto dinámico
    htmlRecs += `
        <div class='mt-10 p-6 bg-blue-900 text-white rounded-2xl text-center shadow-xl'>
            <h4 class='text-lg font-bold mb-2'>¿Necesita un Plan de Remediación?</h4>
            <p class='text-blue-100 text-sm mb-6 text-balance'>Podemos ayudarle a cerrar estas brechas y cumplir con normativas DORA, NIS2 y leyes de privacidad en España y Latam.</p>
            <a href='mailto:contacto@esionadvisory.com?subject=Informe EvalSeg' class='inline-block bg-white text-blue-900 px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors'>
                Solicitar Auditoría Detallada
            </a>
        </div>`;

    recDiv.innerHTML = htmlRecs;

    // 4. DIBUJAR GRÁFICO (Optimizado)
    const ctx = document.getElementById('complianceChart');
    if (window.myChart) { window.myChart.destroy(); }
    window.myChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Identificar', 'Proteger', 'Detectar', 'Responder', 'Recuperar'],
            datasets: [{
                label: 'Nivel de Madurez NIST CSF',
                data: dataNIST.map(v => v.toFixed(2)),
                backgroundColor: 'rgba(30, 58, 138, 0.2)',
                borderColor: 'rgb(30, 58, 138)',
                pointBackgroundColor: 'rgb(30, 58, 138)',
                borderWidth: 3
            }]
        },
        options: {
            scales: { r: { min: 0, max: 5, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
        }
    });
}

document.addEventListener('DOMContentLoaded', cargarPreguntas);
