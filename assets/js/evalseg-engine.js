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
        btn.innerText = "Finalizar y Ver Gráfico de Madurez";
        btn.className = "w-full bg-blue-900 text-white py-4 rounded-xl font-bold mt-6 shadow-lg hover:bg-blue-800 transition-all active:scale-95";
        btn.onclick = mostrarResultados;
        contenedor.appendChild(btn);

    } catch (e) {
        contenedor.innerHTML = "<p class='p-4 bg-red-50 text-red-600 rounded'>Error cargando la matriz de controles.</p>";
    }
}

function mostrarResultados() {
    const scores = { 'NIST': [], 'DORA': [], 'ISO27001': [], 'RGPD': [] };

    // 1. Recopilar respuestas
    preguntasGlobal.forEach(p => {
        const seleccion = document.querySelector(`input[name="q${p.id}"]:checked`);
        const valor = seleccion ? parseFloat(seleccion.value) : 0;
        
        // Asignar el valor a cada marco que tenga la pregunta
        if (p.marcos) {
            p.marcos.forEach(marco => {
                if (scores[marco]) scores[marco].push(valor);
            });
        }
    });

    // 2. Calcular promedios
    const promedios = Object.keys(scores).map(marco => {
        const lista = scores[marco];
        return lista.length > 0 ? (lista.reduce((a, b) => a + b, 0) / lista.length).toFixed(2) : 0;
    });

    // 3. Mostrar contenedor y dibujar gráfico
    document.getElementById('results-container').classList.remove('hidden');
    document.getElementById('results-container').scrollIntoView({ behavior: 'smooth' });

    const ctx = document.getElementById('complianceChart');
    
    // Destruir gráfico previo si existe para evitar errores
    if (window.myChart) { window.myChart.destroy(); }

    window.myChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['NIST CSF', 'DORA / NIS2', 'ISO 27001', 'Privacidad Global'],
            datasets: [{
                label: 'Nivel de Madurez (0-5)',
                data: promedios,
                backgroundColor: 'rgba(30, 58, 138, 0.2)',
                borderColor: 'rgb(30, 58, 138)',
                pointBackgroundColor: 'rgb(30, 58, 138)',
                borderWidth: 3
            }]
        },
        options: {
            scales: {
                r: {
                    min: 0,
                    max: 5,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', cargarPreguntas);
