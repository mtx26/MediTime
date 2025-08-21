// ScannerDataMatrix.jsx
import React, { useEffect, useRef, useState } from "react";
import { readBarcodes } from "zxing-wasm/reader";

const readerOptions = {
  tryHarder: true,
  formats: ["DataMatrix"],
  maxNumberOfSymbols: 1,
};

export default function ScannerDataMatrix() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [error, setError] = useState("");
  const [gtins, setGtins] = useState([]); // liste des GTIN uniques (01)

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
              setGtins((prev) => (prev.includes(gtin) ? prev : [...prev, gtin]));
            }
          }
        }
      }
    } catch (e) {
      // On ne spam pas l’erreur (caméra/permission/etc.)
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
    <div className="container" style={{ maxWidth: 680 }}>
      <h3>Scan boite médicament</h3>

      <div style={{ position: "relative", width: "100%", borderRadius: 8, overflow: "hidden" }}>
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ width: "100%", display: "block", background: "#000" }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      {error && (
        <p style={{ color: "#e66", marginTop: 12 }}>
          ❌ {error}
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <strong>GTIN (01) détectés (uniques) :</strong>
        <ul className="list-group" style={{ marginTop: 8 }}>
          {gtins.length === 0 && (
            <li className="list-group-item" style={{ opacity: 0.6 }}>
              Aucun code pour le moment.
            </li>
          )}
          {gtins.map((g) => (
            <li key={g} className="list-group-item d-flex justify-content-between align-items-center">
              {g}
              <code style={{ fontSize: 12, opacity: 0.7 }}>(01)</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
