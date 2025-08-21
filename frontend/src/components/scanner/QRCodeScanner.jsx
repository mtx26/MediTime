import React, { useEffect, useRef, useState } from "react";
import { readBarcodes } from "zxing-wasm/reader";
import { fetchMedicaments } from "../../utils/api/scanner";

const readerOptions = {
  tryHarder: true,
  formats: ["DataMatrix"],
  maxNumberOfSymbols: 1,
};

export default function QRCodeScanner({ onMedicineFound = null, singleScan = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [error, setError] = useState("");
  const [gtins, setGtins] = useState([]); // liste des GTIN uniques (01)
  const [medicines, setMedicines] = useState({}); // cache des médicaments trouvés par GTIN
  const [loadingGtin, setLoadingGtin] = useState(null); // GTIN en cours de recherche

  // Pour éviter de pousser 20x le même code d'affilée
  const lastSeenRef = useRef({ text: "", t: 0 });

  useEffect(() => {
    let stream;

    async function start() {
      setError("");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            // Astuces mobiles utiles :
            // width: { ideal: 1280 }, height: { ideal: 720 },
            // frameRate: { ideal: 30 }
          },
          audio: false,
        });

        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        scanLoop(); // démarrer la boucle
      } catch (e) {
        console.error(e);
        setError(e?.message || "Impossible d'accéder à la caméra.");
      }
    }

    function stop() {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    }

    start();
    return stop;
  }, []);

  // Boucle de scan (requestAnimationFrame)
  const scanLoop = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    try {
      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;

      if (w && h) {
        // Adapter le canvas à la frame vidéo
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, w, h);

        // On récupère un ImageData pour le décodage
        const imageData = ctx.getImageData(0, 0, w, h);

        // Tentative de décodage
        const results = await readBarcodes(imageData, readerOptions);

        // Clear overlay avant de redessiner
        ctx.drawImage(video, 0, 0, w, h);

        if (results && results.length) {
          const r = results[0];

          // Tracé contour si dispo
          drawDetection(ctx, r);

          // Anti-spam très basique
          const now = performance.now();
          const sameAsLast = r.text === lastSeenRef.current.text && (now - lastSeenRef.current.t < 1200);
          lastSeenRef.current = { text: r.text, t: now };

          if (!sameAsLast) {
            const gtin = extractGTIN01(r.text);
            if (gtin) {
              setGtins((prev) => {
                if (prev.includes(gtin)) return prev;
                // Nouveau GTIN détecté, chercher le médicament
                searchMedicine(gtin);
                const newGtins = singleScan ? [gtin] : [...prev, gtin];
                return newGtins;
              });
            }
          }
        }
      }
    } catch (e) {
      // On ne spam pas l'erreur (caméra/permission/etc.)
      // console.warn(e);
    }

    rafRef.current = requestAnimationFrame(scanLoop);
  };

  function drawDetection(ctx, r) {
    let points = [];

    if (r?.position?.points?.length) {
      points = r.position.points;
    } else if (
      r?.position?.topLeft &&
      r?.position?.topRight &&
      r?.position?.bottomRight &&
      r?.position?.bottomLeft
    ) {
      points = [
        r.position.topLeft,
        r.position.topRight,
        r.position.bottomRight,
        r.position.bottomLeft,
      ];
    }

    if (points.length >= 4) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#00FF00";
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Fonction pour chercher le médicament associé au GTIN
  const searchMedicine = async (gtin) => {
    if (medicines[gtin] || loadingGtin === gtin) return; // Déjà en cache ou en cours
    
    setLoadingGtin(gtin);
    try {
      const results = await fetchMedicaments(gtin);
      if (results && results.length > 0) {
        const medicine = results[0]; // Prendre le premier résultat
        setMedicines(prev => ({ ...prev, [gtin]: medicine }));
        
        // Callback optionnel pour notifier le parent
        if (onMedicineFound) {
          onMedicineFound(medicine);
        }
      } else {
        setMedicines(prev => ({ ...prev, [gtin]: null })); // Aucun résultat trouvé
      }
    } catch (error) {
      console.error("Erreur lors de la recherche du médicament:", error);
      setMedicines(prev => ({ ...prev, [gtin]: null }));
    } finally {
      setLoadingGtin(null);
    }
  };

  // Extraction GTIN (AI 01) : 14 chiffres
  // Gère plusieurs formats courants : "(01)12345678901234", "0112345678901234",
  // ou avec séparateurs FNC1 (\x1D) présents.
  function extractGTIN01(text) {
    if (!text) return null;

    // Normaliser les séparateurs GS1
    const cleaned = text.replace(/\u001D/g, ""); // retire le GS (FNC1) si présent

    // 1) Format standard parenthésé "(01) 14chiffres"
    let m = cleaned.match(/\(01\)\s*([0-9]{14})/);
    if (m) return m[1];

    // 2) Format sans parenthèses mais AI concaténé "01" + 14 chiffres
    m = cleaned.match(/(?:^|[^0-9])01([0-9]{14})(?:[^0-9]|$)/);
    if (m) return m[1];

    return null;
  }

  return (
    <div>
      {/* Aperçu caméra */}
      <div className="position-relative mb-3" style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "4/3" }}>
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-100 h-100 bg-dark"
          style={{ objectFit: "cover" }}
        />
        <canvas
          ref={canvasRef}
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ objectFit: "cover" }}
        />
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Instructions */}
      {gtins.length === 0 && !error && (
        <div className="text-center text-muted mb-3">
          <i className="bi bi-camera me-2"></i>
          Pointez vers le code DataMatrix
        </div>
      )}

      {/* Résultats */}
      {gtins.map((gtin) => {
        const medicine = medicines[gtin];
        const isLoading = loadingGtin === gtin;
        
        return (
          <div key={gtin} className="border rounded p-3 mb-2">
            {isLoading ? (
              <div className="text-center">
                <div className="spinner-border spinner-border-sm me-2"></div>
                Recherche...
              </div>
            ) : medicine ? (
              <div>
                <h6 className="text-primary mb-1">{medicine.name}</h6>
                {medicine.dose && (
                  <small className="text-muted">Dose : {medicine.dose}</small>
                )}
                {onMedicineFound && (
                  <button 
                    className="btn btn-success w-100 mt-2"
                    onClick={() => onMedicineFound({ gtin, medicine, action: 'select' })}
                  >
                    <i className="bi bi-check2 me-2"></i>
                    Utiliser ce médicament
                  </button>
                )}
              </div>
            ) : (
              <div className="text-warning text-center">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Médicament non trouvé
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
