const userInput = document.getElementById("user-function");
const canvas = document.getElementById("plotter");
const plotCTX = canvas.getContext('2d');

let scala = 30;
let larghezzaLogica = 0;
let altezzaLogica = 0;

function configuraRisoluzioneHD() {
    const dpr = window.devicePixelRatio || 1;
    const rettangolo = canvas.getBoundingClientRect();

    larghezzaLogica = rettangolo.width || canvas.width;
    altezzaLogica = rettangolo.height || canvas.height;

    canvas.width = larghezzaLogica * dpr;
    canvas.height = altezzaLogica * dpr;

    canvas.style.width = larghezzaLogica + "px";
    canvas.style.height = altezzaLogica + "px";

    plotCTX.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function preparaFormula(testo) {
    return testo
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/\^/g, '**')
        .replace(/(\d)([a-z\(])/g, '$1*$2')
        .replace(/(\))([a-z0-9\(])/g, '$1*$2')
        .replace(/(x)(\()/g, '$1*$2')
        .replace(/\b(sin|cos|tan|sqrt|abs|log|exp)\b/g, 'Math.$1')
        .replace(/\bpi\b/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E');
}

function validaECompila(testoGrezzo) {
    if (!testoGrezzo) return null;

    const caratteriAmmessi = /^[0-9x+\-*/^().\s a-z]+$/i;
    if (!caratteriAmmessi.test(testoGrezzo)) return null;

    const aperte = (testoGrezzo.match(/\(/g) || []).length;
    const chiuse = (testoGrezzo.match(/\)/g) || []).length;
    if (aperte !== chiuse) return null;

    try {
        const formulaJS = preparaFormula(testoGrezzo);
        const fn = new Function("x", `return ${formulaJS};`);

        const testRisultato = fn(1);
        if (typeof testRisultato !== "number" || Number.isNaN(testRisultato)) {
            return null;
        }
        return fn;
    } catch (e) {
        return null;
    }
}

function calcolaPasso(scalaAttuale) {
    const pixelMinimiTraTacche = 45;
    const passoGrezzo = pixelMinimiTraTacche / scalaAttuale;
    const potenza10 = Math.pow(10, Math.floor(Math.log10(passoGrezzo)));
    const frazione = passoGrezzo / potenza10;

    if (frazione < 1.5) return 1 * potenza10;
    if (frazione < 3.5) return 2 * potenza10;
    if (frazione < 7.5) return 5 * potenza10;
    return 10 * potenza10;
}

function disegnaAssi() {
    const centroX = Math.floor(larghezzaLogica / 2) + 0.5;
    const centroY = Math.floor(altezzaLogica / 2) + 0.5;
    const passo = calcolaPasso(scala);
    const decimali = passo < 1 ? Math.max(0, -Math.floor(Math.log10(passo))) : 0;

    plotCTX.font = "9px sans-serif";
    plotCTX.fillStyle = "#666";

    plotCTX.textAlign = "center";
    plotCTX.textBaseline = "top";

    const xMin = Math.floor((-centroX / scala) / passo) * passo;
    const xMax = Math.ceil((centroX / scala) / passo) * passo;

    for (let x = xMin; x <= xMax; x += passo) {
        const valore = Number(x.toFixed(decimali));
        if (valore === 0) continue;

        const px = Math.floor(centroX + (valore * scala)) + 0.5;

        plotCTX.strokeStyle = "#f2f2f2";
        plotCTX.lineWidth = 1;
        plotCTX.beginPath();
        plotCTX.moveTo(px, 0);
        plotCTX.lineTo(px, altezzaLogica);
        plotCTX.stroke();

        plotCTX.strokeStyle = "#999";
        plotCTX.beginPath();
        plotCTX.moveTo(px, centroY - 2.5);
        plotCTX.lineTo(px, centroY + 2.5);
        plotCTX.stroke();

        plotCTX.fillText(valore.toString(), px, centroY + 4);
    }

    plotCTX.textAlign = "right";
    plotCTX.textBaseline = "middle";

    const yMin = Math.floor((-centroY / scala) / passo) * passo;
    const yMax = Math.ceil((centroY / scala) / passo) * passo;

    for (let y = yMin; y <= yMax; y += passo) {
        const valore = Number(y.toFixed(decimali));
        if (valore === 0) continue;

        const py = Math.floor(centroY - (valore * scala)) + 0.5;

        plotCTX.strokeStyle = "#f2f2f2";
        plotCTX.lineWidth = 1;
        plotCTX.beginPath();
        plotCTX.moveTo(0, py);
        plotCTX.lineTo(larghezzaLogica, py);
        plotCTX.stroke();

        plotCTX.strokeStyle = "#999";
        plotCTX.beginPath();
        plotCTX.moveTo(centroX - 2.5, py);
        plotCTX.lineTo(centroX + 2.5, py);
        plotCTX.stroke();

        plotCTX.fillText(valore.toString(), centroX - 5, py);
    }

    plotCTX.strokeStyle = "#888";
    plotCTX.lineWidth = 1;
    plotCTX.beginPath();
    plotCTX.moveTo(0, centroY);
    plotCTX.lineTo(larghezzaLogica, centroY);
    plotCTX.moveTo(centroX, 0);
    plotCTX.lineTo(centroX, altezzaLogica);
    plotCTX.stroke();

    plotCTX.textAlign = "right";
    plotCTX.textBaseline = "top";
    plotCTX.fillText("0", centroX - 4, centroY + 4);
}

function disegnaGrafico() {
    plotCTX.clearRect(0, 0, larghezzaLogica, altezzaLogica);
    disegnaAssi();

    const testoGrezzo = userInput.value.trim();
    if (!testoGrezzo) {
        userInput.style.borderColor = "";
        return;
    }

    const fn = validaECompila(testoGrezzo);
    if (!fn) {
        userInput.style.borderColor = "red";
        return;
    }

    userInput.style.borderColor = "green";

    plotCTX.beginPath();
    plotCTX.strokeStyle = "#007BFF";
    plotCTX.lineWidth = 1.2;
    plotCTX.lineJoin = "round";
    plotCTX.lineCap = "round";

    let staDisegnando = false;
    const centroX = larghezzaLogica / 2;
    const centroY = altezzaLogica / 2;

    for (let px = 0; px <= larghezzaLogica; px += 0.25) {
        const mathX = (px - centroX) / scala;
        const mathY = fn(mathX);

        if (!isNaN(mathY) && isFinite(mathY)) {
            const py = centroY - (mathY * scala);

            if (py < -altezzaLogica || py > altezzaLogica * 2) {
                staDisegnando = false;
                continue;
            }

            if (!staDisegnando) {
                plotCTX.moveTo(px, py);
                staDisegnando = true;
            } else {
                plotCTX.lineTo(px, py);
            }
        } else {
            staDisegnando = false;
        }
    }

    plotCTX.stroke();
}

canvas.addEventListener("wheel", (event) => {
    event.preventDefault();

    const fattoreZoom = 1.1;
    if (event.deltaY < 0) {
        scala *= fattoreZoom;
    } else {
        scala /= fattoreZoom;
    }

    scala = Math.max(0.5, Math.min(scala, 5000));
    disegnaGrafico();
}, { passive: false });

userInput.addEventListener("input", disegnaGrafico);

userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
    }
});

configuraRisoluzioneHD();
disegnaGrafico();
