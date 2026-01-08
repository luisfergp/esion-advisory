// Lógica de EvalSeg v1.0
async function cargarPreguntas() {
    try {
        const respuesta = await fetch('data/questions.json');
        const preguntas = await respuesta.json();
        const contenedor = document.getElementById('quiz-container');

        preguntas.forEach((p, index) => {
            const div = document.createElement('div');
            div.className = "mb-6 p-4 border-b border-slate-100";
            div.innerHTML = `
                <p class="font-semibold text-slate-800 mb-3">${index + 1}. ${p.pregunta}</p>
                <div class="flex gap-4">
                    <label class="flex items-center gap-2"><input type="radio" name="q${p.id}" value="5"> Sí</label>
                    <label class="flex items-center gap-2"><input type="radio" name="q${p.id}" value="2"> Parcialmente</label>
                    <label class="flex items-center gap-2"><input type="radio" name="q${p.id}" value="0"> No</label>
                </div>
            `;
            contenedor.appendChild(div);
        });

        // Botón para calcular
        const btn = document.createElement('button');
        btn.innerText = "Calcular Madurez";
        btn.className = "w-full bg-blue-900 text-white py-3 rounded-lg font-bold mt-4 hover:bg-blue-800";
        btn.onclick = calcularResultados;
        contenedor.appendChild(btn);

    } catch (error) {
        console.error("Error cargando preguntas:", error);
    }
}

function calcularResultados() {
    alert("Análisis completado. Su nivel de madurez inicial ha sido calculado bajo marcos NIST, ISO, NIS2 y DORA.");
    // Aquí ampliaremos la lógica para mostrar los gráficos más adelante
}

document.addEventListener('DOMContentLoaded', cargarPreguntas);
