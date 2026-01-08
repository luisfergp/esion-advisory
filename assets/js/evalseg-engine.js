// Lógica de EvalSeg v1.0 para Esion Advisory
async function cargarPreguntas() {
    try {
        // Buscamos el archivo JSON (ajusta la ruta si es necesario)
        const respuesta = await fetch('./data/questions.json');
        const preguntas = await respuesta.json();
        const contenedor = document.getElementById('quiz-container');

        if (!contenedor) return;

        // --- ESTA ES LA LÍNEA CLAVE ---
        // Borramos el mensaje de "Cargando..." antes de poner las preguntas
        contenedor.innerHTML = ''; 

        preguntas.forEach((p, index) => {
            const div = document.createElement('div');
            div.className = "mb-8 p-6 bg-white rounded-xl border border-slate-200 shadow-sm";
            div.innerHTML = `
                <p class="font-bold text-slate-900 mb-4 text-lg">${index + 1}. ${p.pregunta}</p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50">
                        <input type="radio" name="q${p.id}" value="5" class="mr-2"> 
                        <span class="text-sm font-medium text-slate-700">Sí / Cumplido</span>
                    </label>
                    <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50">
                        <input type="radio" name="q${p.id}" value="2.5" class="mr-2"> 
                        <span class="text-sm font-medium text-slate-700">Parcialmente</span>
                    </label>
                    <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50">
                        <input type="radio" name="q${p.id}" value="0" class="mr-2"> 
                        <span class="text-sm font-medium text-slate-700">No / Sin iniciar</span>
                    </label>
                </div>
            `;
            contenedor.appendChild(div);
        });

        // Añadimos el botón de finalizar al final
        const btn = document.createElement('button');
        btn.innerText = "Finalizar Evaluación y Ver Resultados";
        btn.className = "w-full bg-blue-900 text-white py-4 rounded-xl font-bold mt-6 shadow-lg hover:bg-blue-800 transition-transform active:scale-95";
        btn.onclick = calcularResultados;
        contenedor.appendChild(btn);

    } catch (error) {
        console.error("Error al cargar EvalSeg:", error);
        const contenedor = document.getElementById('quiz-container');
        if(contenedor) contenedor.innerHTML = "<p class='text-red-500'>Error al cargar las preguntas. Verifique su conexión.</p>";
    }
}

function calcularResultados() {
    // Mostramos el contenedor de resultados que está en el HTML
    const resultsDiv = document.getElementById('results-container');
    if(resultsDiv) {
        resultsDiv.classList.remove('hidden');
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }
    alert("¡Evaluación finalizada! En la próxima sesión activaremos el gráfico de araña profesional.");
}

document.addEventListener('DOMContentLoaded', cargarPreguntas);
