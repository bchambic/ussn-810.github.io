// Tolerancia global 
const TOLERANCE = 0.005;

// Actualizar estado visual del submarino
function updateSystemStatus(system, error) {
    const artElement = document.getElementById(`${system}-art`);
    const indicator = document.getElementById(`${system}-indicator`);
    const statusElement = document.getElementById(`${system}-status`);

    // Reset classes
    artElement.className = `${system}-section`;
    indicator.className = 'status-indicator';

    if (error < 0.005) {
        artElement.classList.add('status-blue');
        indicator.classList.add('bg-primary');
        statusElement.textContent = `Estado: 🔵 Muy cerca (${error.toFixed(4)})`;
    } else if (error < 0.01) {
        artElement.classList.add('status-green');
        indicator.classList.add('bg-success');
        statusElement.textContent = `Estado: 🟢 Cerca (${error.toFixed(4)})`;
    } else if (error < 1) {
        artElement.classList.add('status-yellow');
        indicator.classList.add('bg-warning');
        statusElement.textContent = `Estado: 🟡 Alejándose (${error.toFixed(4)})`;
    } else {
        artElement.classList.add('status-red');
        indicator.classList.add('bg-danger');
        statusElement.textContent = `Estado: 🔴 Muy lejos (${error.toFixed(4)})`;
    }
}

// Métodos numéricos genéricos
function newtonRaphson(f, df, x0, maxIter = 100) {
    let x = x0;
    let iterations = 0;
    let error = 1;

    while (error > TOLERANCE && iterations < maxIter) {
        const fx = f(x);
        const dfx = df(x);
        if (Math.abs(dfx) < 1e-10) {
            throw new Error("Derivada cercana a cero en Newton-Raphson");
        }

        const xNew = x - fx / dfx;
        error = Math.abs(xNew - x);
        x = xNew;
        iterations++;
    }

    return { solution: x, iterations, error };
}

function secante(f, x0, x1, maxIter = 100) {
    let xPrev = x0;
    let x = x1;
    let iterations = 0;
    let error = 1;

    while (error > TOLERANCE && iterations < maxIter) {
        const fx = f(x);
        const fxPrev = f(xPrev);
        const denominator = fx - fxPrev;

        if (Math.abs(denominator) < 1e-10) {
            throw new Error("División por cero en método de la secante");
        }

        const xNew = x - fx * (x - xPrev) / denominator;

        error = Math.abs(xNew - x);
        xPrev = x;
        x = xNew;
        iterations++;
    }

    return { solution: x, iterations, error };
}

function biseccion(f, a, b, maxIter = 100) {
    let iterations = 0;
    let error = 1;
    let c = a;

    if (f(a) * f(b) >= 0) {
        throw new Error("La función debe tener signos opuestos en los extremos del intervalo");
    }

    while (error > TOLERANCE && iterations < maxIter) {
        c = (a + b) / 2;

        if (f(c) === 0.0) {
            break;
        } else if (f(c) * f(a) < 0) {
            b = c;
        } else {
            a = c;
        }

        error = Math.abs(b - a);
        iterations++;
    }

    return { solution: c, iterations, error };
}

// Solución para el reactor
function solveReactor(method) {
    const Q = parseFloat(document.getElementById('reactor-q').value);
    const A = parseFloat(document.getElementById('reactor-area').value);
    const dT = parseFloat(document.getElementById('reactor-dt').value);

    if (isNaN(Q) || isNaN(A) || isNaN(dT) || A <= 0 || dT <= 0) {
        document.getElementById('reactor-result').textContent = "Error: Parámetros inválidos";
        document.getElementById('reactor-iterations').textContent = "0";
        document.getElementById('reactor-error').textContent = "Error: NaN";
        updateSystemStatus('reactor', 1);
        return;
    }

    const f = h => Q - h * A * dT;
    const df = h => -A * dT;

    let result;

    try {
        switch (method) {
            case 'newton':
                result = newtonRaphson(f, df, 5.0);
                break;
            case 'secante':
                result = secante(f, 4.0, 6.0);
                break;
            case 'biseccion':
                result = biseccion(f, 4.0, 8.0);
                break;
        }

        document.getElementById('reactor-result').textContent =
            `Coeficiente de transferencia (h): ${result.solution.toFixed(6)}`;
        document.getElementById('reactor-iterations').textContent = result.iterations;
        document.getElementById('reactor-error').textContent =
            `Error final: ${result.error.toFixed(6)}`;

        updateSystemStatus('reactor', result.error);
    } catch (e) {
        alert(`Error: ${e.message}`);
    }
}

// Solución para comunicaciones
function solveComms(method) {
    const T = parseFloat(document.getElementById('comms-tension').value);
    const F = parseFloat(document.getElementById('comms-flotacion').value);

    if (isNaN(T) || isNaN(F) || T <= 0) {
        document.getElementById('comms-result').textContent = "Error: Parámetros inválidos";
        document.getElementById('comms-iterations').textContent = "0";
        document.getElementById('comms-error').textContent = "Error: NaN";
        updateSystemStatus('comms', 1);
        return;
    }

    const f = thetaRad => T * Math.cos(thetaRad) - F;
    const df = thetaRad => -T * Math.sin(thetaRad);

    let result;

    try {
        switch (method) {
            case 'newton':
                result = newtonRaphson(f, df, 0.7);
                break;
            case 'secante':
                result = secante(f, 0.5, 1.0);
                break;
            case 'biseccion':
                result = biseccion(f, 0.0, Math.PI / 2);
                break;
        }

        const thetaDeg = result.solution * 180 / Math.PI;

        document.getElementById('comms-result').textContent =
            `Ángulo óptimo (θ): ${thetaDeg.toFixed(2)}°`;
        document.getElementById('comms-iterations').textContent = result.iterations;
        document.getElementById('comms-error').textContent =
            `Error final: ${result.error.toFixed(6)}`;

        updateSystemStatus('comms', result.error);
    } catch (e) {
        document.getElementById('comms-result').textContent = "Error: No converge";
        document.getElementById('comms-iterations').textContent = "0";
        document.getElementById('comms-error').textContent = "Error: NaN";
        updateSystemStatus('comms', 1);
        console.error("Error en COMMS:", e);
    }
}

// Solución para sistema ECOG
function solveOxygen(method) {
    const r = parseFloat(document.getElementById('oxygen-r').value);
    const K = parseFloat(document.getElementById('oxygen-k').value);
    const G = parseFloat(document.getElementById('oxygen-g').value);

    if (isNaN(r) || isNaN(K) || isNaN(G) || K <= 0) {
        document.getElementById('oxygen-result').textContent = "Error: Parámetros inválidos";
        document.getElementById('oxygen-iterations').textContent = "0";
        document.getElementById('oxygen-error').textContent = "Error: NaN";
        updateSystemStatus('oxygen', 1);
        return;
    }

    const f = C => r * C * (1 - C / K) - G;
    const df = C => r * (1 - (2 * C) / K);

    let result;
    try {
        switch (method) {
            case 'newton':
                // Punto inicial cercano a una de las soluciones
                result = newtonRaphson(f, df, 5); // O prueba con 9995
                break;
            case 'secante':
                // Dos puntos iniciales cercanos a una de las soluciones
                result = secante(f, 4, 6); // O prueba con 9990, 10000
                break;
            case 'biseccion':
                // Intervalo que contenga una de las soluciones y tenga signos opuestos en los extremos
                if (f(0) * f(10) >= 0) { // Intervalo cercano a la solución C=5
                    console.warn("Advertencia: No hay cambio de signo cerca de la primera raíz para Bisección.");
                }
                result = biseccion(f, 0, 10); // Intenta un intervalo pequeño alrededor de 5
                // Alternativamente, para la otra raíz:
                // if (f(9990) * f(10000) >= 0) {
                //     console.warn("Advertencia: No hay cambio de signo cerca de la segunda raíz para Bisección.");
                // }
                // result = biseccion(f, 9990, 10000);
                break;
        }

        document.getElementById('oxygen-result').textContent =
            `Concentración CO₂ (ppm): ${result.solution.toFixed(2)}`;
        document.getElementById('oxygen-iterations').textContent = result.iterations;
        document.getElementById('oxygen-error').textContent =
            `Error final: ${result.error.toFixed(6)}`;

        updateSystemStatus('oxygen', result.error);
    } catch (e) {
        document.getElementById('oxygen-result').textContent = "Error: No converge";
        document.getElementById('oxygen-iterations').textContent = "0";
        document.getElementById('oxygen-error').textContent = "Error: NaN";
        updateSystemStatus('oxygen', 1);
        console.error("Error en ECOG:", e);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
    updateSystemStatus('reactor', 4);
    updateSystemStatus('comms', 15);
    updateSystemStatus('oxygen', 1);

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
