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
    // Definimos los bloques oficiales de NIST
    const nistBlocks = ['IDENTIFICAR', 'PROTEGER', 'DETECTAR', 'RESPONDER', 'RECUPERAR'];
    const scores = { 'IDENTIFICAR': [], 'PROTEGER': [], 'DETECTAR': [], 'RESPONDER': [], 'RECUPERAR': [] };

    // 1. Agrupar puntuaciones por bloque
    preguntasGlobal.forEach(p => {
        const seleccion = document.querySelector(`input[name="q${p.id}"]:checked`);
        const valor = seleccion ? parseFloat(seleccion.value) : 0;
        
        // Si el bloque de la pregunta existe en nuestro mapa de NIST, lo sumamos
        if (scores[p.bloque]) {
            scores[p.bloque].push(valor);
        }
    });

    // 2. Calcular promedios para cada eje
    const dataNIST = nistBlocks.map(bloque => {
        const lista = scores[bloque];
        return lista.length > 0 ? (lista.reduce((a, b) => a + b, 0) / lista.length).toFixed(2) : 0;
    });

    // 3. Mostrar resultados y gráfico
    document.getElementById('results-container').classList.remove('hidden');
    document.getElementById('results-container').scrollIntoView({ behavior: 'smooth' });

    const ctx = document.getElementById('complianceChart');
    if (window.myChart) { window.myChart.destroy(); }

    window.myChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Identificar', 'Proteger', 'Detectar', 'Responder', 'Recuperar'],
            datasets: [{
                label: 'Nivel de Madurez (NIST CSF)',
                data: dataNIST,
                backgroundColor: 'rgba(30, 58, 138, 0.2)',
                borderColor: 'rgb(30, 58, 138)',
                pointBackgroundColor: 'rgb(30, 58, 138)',
                borderWidth: 3,
                fill: true
            }]
        },
        options: {
            scales: {
                r: {
                    min: 0,
                    max: 5,
                    beginAtZero: true,
                    ticks: { stepSize: 1, backdropColor: 'transparent' },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
                    pointLabels: { font: { size: 14, weight: 'bold' } }
                }
            },
            plugins: {
                legend: { position: 'top' }
            }
        }
    });

    // Actualizar recomendaciones básicas
    const recDiv = document.getElementById('recommendations');
    recDiv.innerHTML = `<p class='text-slate-600 mb-4'>Basado en las funciones de NIST CSF, su resiliencia operativa es de <strong>${(dataNIST.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / 5).toFixed(1)}/5</strong>.</p>`;
}

document.addEventListener('DOMContentLoaded', cargarPreguntas);
