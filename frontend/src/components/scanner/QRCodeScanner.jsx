import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, use } from "react";
import { useTranslation } from "react-i18next";
import { readBarcodes } from "zxing-wasm/reader";
import { fetchMedicaments } from "../../utils/api/scanner";

// Styles CSS pour les contrôles
const controlsStyle = `
  .scanner-controls .form-range {
    height: 0.5rem;
    width: 120px;
  }
  .scanner-controls .form-select-sm {
    padding: 0.125rem 0.25rem;
    font-size: 0.75rem;
    min-width: 120px;
  }
`;

// Injecter les styles
if (typeof document !== 'undefined' && !document.getElementById('scanner-controls-styles')) {
  const style = document.createElement('style');
  style.id = 'scanner-controls-styles';
  style.textContent = controlsStyle;
  document.head.appendChild(style);
}

const readerOptions = {
  tryHarder: true,
  formats: ["DataMatrix"],
  maxNumberOfSymbols: 1,
};

const QRCodeScanner = forwardRef(({
  onMedicineFound = null,
  singleScan = false,
  onClose = null,   // Fonction pour fermer la modal
  onAddAll = null,  // Fonction pour ajouter tous les médicaments scannés
  show = false,     // Contrôle l'affichage de la modal
  modal = true,     // Active/désactive le mode modal
  onStateChange = null,
}, ref) => {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [error, setError] = useState("");
  const [gtins, setGtins] = useState([]); // liste des GTIN uniques (01)
  const [medicines, setMedicines] = useState({}); // cache des médicaments trouvés par GTIN - contient directement les medicine_boxes
  const [loadingGtin, setLoadingGtin] = useState(null); // GTIN en cours de recherche
  
  // Nouveaux états pour les contrôles de caméra
  const [zoom, setZoom] = useState(1.5); // Zoom par défaut à 1.5
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const hideControlsTimeoutRef = useRef(null);
  const streamRef = useRef(null);
  const isLoadingRef = useRef(false);
  const lastScanTimeRef = useRef(0);
  const scanIntervalMs = 150; // Intervalle entre les scans en ms (réduit la consommation)

  // Pour éviter de pousser 20x le même code d'affilée
  const lastSeenRef = useRef({ text: "", t: 0 });

  // Fonction pour masquer automatiquement les contrôles
  const autoHideControls = () => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000); // Masquer après 3 secondes d'inactivité
  };

  // Fonction pour afficher les contrôles
  const showControlsTemporary = () => {
    setShowControls(true);
    autoHideControls();
  };

  // Exposer handleAddAll au composant parent via useImperativeHandle
  useImperativeHandle(ref, () => ({
    handleAddAll
  }));

  // Fonction pour réinitialiser la liste des médicaments scannés
  const resetScannedMedicines = () => {
    setGtins([]);
    setMedicines({});
    setLoadingGtin(null);
    setError("");
  };

  useEffect(() => {
    if (onStateChange) {
      const medicineBoxes = Object.values(medicines).filter(med => med !== null);
      onStateChange({
        hasMedicine: medicineBoxes.length > 0
      });
    }
  }, [medicines, onStateChange]);

  useEffect(() => {
    // Fonction pour obtenir la liste des caméras disponibles
    async function getCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(cameras);
        
        // Sélectionner la caméra arrière par défaut si disponible
        if (cameras.length > 0 && !selectedCamera) {
          const backCamera = cameras.find(camera => 
            camera.label.toLowerCase().includes('back') || 
            camera.label.toLowerCase().includes('rear') ||
            camera.label.toLowerCase().includes('environment')
          );
          setSelectedCamera(backCamera || cameras[0]);
        }
      } catch (error) {
        console.error('Erreur lors de l\'énumération des caméras:', error);
      }
    }

    async function start() {
      // Éviter les chargements multiples simultanés
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      setError("");
      
      // Arrêter le stream précédent s'il existe
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      try {
        // Obtenir les caméras disponibles
        await getCameras();

        const constraints = {
          video: {
            deviceId: selectedCamera ? { exact: selectedCamera.deviceId } : undefined,
            facingMode: selectedCamera ? undefined : { ideal: "environment" },
            // Astuces mobiles utiles :
            // width: { ideal: 1280 }, height: { ideal: 720 },
            // frameRate: { ideal: 30 }
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (!videoRef.current) {
          isLoadingRef.current = false;
          return;
        }

        // Attendre que la vidéo soit prête avant de jouer
        videoRef.current.srcObject = stream;
        
        try {
          await videoRef.current.play();
          scanLoop(); // démarrer la boucle
        } catch (playError) {
          console.warn('Erreur lors de la lecture vidéo:', playError);
          // Réessayer après un court délai
          setTimeout(async () => {
            try {
              if (videoRef.current && videoRef.current.srcObject) {
                await videoRef.current.play();
                scanLoop();
              }
            } catch (retryError) {
              console.error('Impossible de démarrer la vidéo:', retryError);
            }
          }, 100);
        }
      } catch (e) {
        console.error(e);
        let errorMessage = e?.message || t('scanner.camera_error');
        
        setError(errorMessage);
      } finally {
        isLoadingRef.current = false;
      }
    }

    function stop() {
      isLoadingRef.current = false;
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      
      // Nettoyer la vidéo
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    // Démarrer seulement si la modal est visible (mode modal) ou toujours (mode non-modal)
    if (modal ? show : true) {
      start();
    } else {
      stop();
    }

    return stop;
  }, [show, modal, selectedCamera]); // Retiré zoom des dépendances pour éviter les rechargements

  // Fonction pour changer le zoom (zoom numérique CSS)
  const handleZoomChange = (newZoom) => {
    setZoom(newZoom);
  };

  // Fonction pour changer de caméra
  const handleCameraChange = (camera) => {
    setSelectedCamera(camera);
  };

  // Fonction pour obtenir un nom de caméra court
  const getCameraDisplayName = (camera, index) => {
    if (!camera.label) return `Caméra ${index + 1}`;
    
    const label = camera.label.toLowerCase();
    if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
      return 'Arrière';
    } else if (label.includes('front') || label.includes('user') || label.includes('facing')) {
      return 'Avant';
    } else if (label.includes('external')) {
      return 'Externe';
    } else {
      // Prendre les premiers mots du nom de la caméra
      return camera.label.split(' ').slice(0, 2).join(' ').substring(0, 15);
    }
  };

  // Reset des données quand la modal s'ouvre (mode modal uniquement)
  useEffect(() => {
    if (modal && show) {
      resetScannedMedicines();
    }
  }, [show, modal]);

  // Boucle de scan (requestAnimationFrame) avec throttling
  const scanLoop = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const now = performance.now();
    
    // Throttling: ne scanner que si assez de temps s'est écoulé
    if (now - lastScanTimeRef.current < scanIntervalMs) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    
    lastScanTimeRef.current = now;

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

          // Anti-spam très basique (augmenté pour réduire la consommation)
          const sameAsLast = r.text === lastSeenRef.current.text && (now - lastSeenRef.current.t < 2000);
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

    // Programmer le prochain scan
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

  // Fonction pour chercher le médicament associé au GTIN et créer directement une medicine_box
  const searchMedicine = async (gtin) => {
    // Vérifier si le médicament est déjà en cours de recherche ou s'il est dans la liste active
    if (loadingGtin === gtin || (medicines[gtin] && gtins.includes(gtin))) return;
    
    setLoadingGtin(gtin);
    try {
      const results = await fetchMedicaments(gtin);
      if (results && results.length > 0) {
        const medicineData = results[0]; // Prendre le premier résultat
        
        // Créer directement une structure medicine_box
        const dose = parseInt(medicineData.dose?.replace(/\D/g, '') || 0);
        const conditionnement = parseInt(medicineData.conditionnement?.replace(/\D/g, '') || 0);
        
        const medicineBox = {
          gtin,
          name: medicineData.name,
          dose: dose,
          box_capacity: conditionnement,
          stock_quantity: conditionnement,
          stock_alert_threshold: 10,
          conditions: [], // Conditions par défaut vides
          // Garder les données originales pour référence
          original_data: medicineData
        };

        setMedicines(prev => ({ ...prev, [gtin]: medicineBox }));
        
        // Callback optionnel pour notifier le parent
        if (onMedicineFound) {
          onMedicineFound(medicineBox);
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

  // Fonction pour supprimer un médicament scanné
  const removeMedicine = (gtinToRemove) => {
    setGtins(prev => prev.filter(gtin => gtin !== gtinToRemove));
    setMedicines(prev => {
      const newMedicines = { ...prev };
      delete newMedicines[gtinToRemove];
      return newMedicines;
    });
    // S'assurer que le GTIN n'est plus en cours de chargement
    if (loadingGtin === gtinToRemove) {
      setLoadingGtin(null);
    }
  };

  // Gérer l'ajout de tous les médicaments avec reset
  const handleAddAll = async () => {
    if (onAddAll) {
      try {
        // Récupérer les medicine_boxes valides (non null)
        const medicineBoxes = Object.values(medicines).filter(med => med !== null);
        
        const result = await onAddAll(medicineBoxes);
        // Reset seulement si l'ajout a réussi
        if (result && result.success) {
          resetScannedMedicines(); // Remettre à zéro après ajout réussi
        }
      } catch (error) {
        console.error("Erreur lors de l'ajout des médicaments:", error);
        // Ne pas reset en cas d'erreur pour permettre de réessayer
      }
    }
  };

  // Gérer la fermeture avec reset
  const handleClose = () => {
    resetScannedMedicines(); // Remettre à zéro à la fermeture
    if (onClose) {
      onClose();
    }
  };

  // Extraction GTIN (AI 01) : 14 chiffres
  // Gère plusieurs formats courants : "(01)12345678901234", "0112345678901234",
  // ou avec séparateurs FNC1 (\x1D) présents.
  function extractGTIN01(text) {
    if (!text) return null;

    // Normaliser les séparateurs GS1
    const GS1_SEPARATOR = "\u001D"; // Caractère de séparation GS1 (Group Separator)
    const cleaned = text.replace(new RegExp(GS1_SEPARATOR, "g"), ""); // retire le GS (FNC1) si présent

    // 1) Format standard parenthésé "(01) 14chiffres"
    let m = cleaned.match(/\(01\)\s*([0-9]{14})/);
    if (m) return m[1];

    // 2) Format sans parenthèses mais AI concaténé "01" + 14 chiffres
    m = cleaned.match(/(?:^|[^0-9])01([0-9]{14})(?:[^0-9]|$)/);
    if (m) return m[1];

    return null;
  }

  return (
    <>
      {modal ? (
        // Mode Modal Bootstrap
        <>
          <div 
            className={`modal fade ${show ? 'show' : ''}`} 
            style={{ display: show ? 'block' : 'none' }} 
            tabIndex="-1"
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-qr-code-scan me-2"></i>
                    {t('scanner.title')}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleClose}
                    aria-label={t('scanner.close')}
                  ></button>
                </div>
                <div className="modal-body">
                  {renderScannerContent()}
                </div>
                <div className="modal-footer">
                  {renderFooterButtons()}
                </div>
              </div>
            </div>
          </div>
          {/* Overlay pour modal Bootstrap */}
          {show && <div className="modal-backdrop fade show"></div>}
        </>
      ) : (
        // Mode Non-modal (intégré directement)
        <div>
          {renderScannerContent()}
          {renderFooterButtons()}
        </div>
      )}
    </>
  );

  // Fonction pour rendre le contenu du scanner
  function renderScannerContent() {
    return (
      <div>
        {/* Aperçu caméra avec contrôles */}
        <div 
          className="position-relative mb-3 mx-auto" 
          style={{ 
            borderRadius: 8, 
            overflow: "hidden", 
            aspectRatio: "16/10", 
            maxWidth: "400px",
            width: "100%"
          }}
          onMouseEnter={showControlsTemporary}
          onMouseLeave={() => {
            if (hideControlsTimeoutRef.current) {
              clearTimeout(hideControlsTimeoutRef.current);
            }
            setShowControls(false);
          }}
          onTouchStart={showControlsTemporary}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-100 h-100 bg-dark"
            style={{ 
              objectFit: "cover",
              transform: `scale(${zoom})`,
              transformOrigin: "center center"
            }}
          />
          <canvas
            ref={canvasRef}
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{ 
              objectFit: "cover",
              transform: `scale(${zoom})`,
              transformOrigin: "center center"
            }}
          />
          
          {/* Contrôles discrets */}
          <div 
            className={`scanner-controls position-absolute top-0 end-0 p-2 transition-opacity ${showControls ? 'opacity-100' : 'opacity-25'}`}
            style={{ 
              background: 'rgba(0,0,0,0.7)', 
              borderRadius: '0 8px 0 8px',
              transition: 'opacity 0.3s ease',
              backdropFilter: 'blur(4px)'
            }}
          >
            {/* Contrôle de zoom */}
            <div className="mb-2 text-center">
              <label className="form-label text-white small mb-1 d-block">
                <i className="bi bi-zoom-in me-1"></i>
                Zoom: {zoom}x
              </label>
              <input
                type="range"
                className="form-range"
                min="1"
                max="5"
                step="0.5"
                value={zoom}
                onChange={(e) => {
                  handleZoomChange(parseFloat(e.target.value));
                  autoHideControls(); // Réinitialiser le timer
                }}
              />
            </div>
            
            {/* Sélection de caméra */}
            {availableCameras.length > 1 && (
              <div className="text-center">
                <label className="form-label text-white small mb-1 d-block">
                  <i className="bi bi-camera me-1"></i>
                  Caméra
                </label>
                <select
                  className="form-select form-select-sm"
                  value={selectedCamera?.deviceId || ''}
                  onChange={(e) => {
                    const camera = availableCameras.find(c => c.deviceId === e.target.value);
                    handleCameraChange(camera);
                    autoHideControls(); // Réinitialiser le timer
                  }}
                >
                  {availableCameras.map((camera, index) => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {getCameraDisplayName(camera, index)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* Bouton pour afficher/masquer les contrôles sur mobile */}
          <button
            className="btn btn-sm btn-secondary position-absolute bottom-0 end-0 m-2 d-md-none"
            onClick={() => {
              if (showControls) {
                setShowControls(false);
                if (hideControlsTimeoutRef.current) {
                  clearTimeout(hideControlsTimeoutRef.current);
                }
              } else {
                showControlsTemporary();
              }
            }}
            style={{ opacity: 0.7 }}
          >
            <i className="bi bi-gear"></i>
          </button>
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
            {t('scanner.camera_instruction')}
          </div>
        )}

        {/* Résultats */}
        {gtins.length > 0 && (
          <ul className="list-group">
            {gtins.map((gtin) => {
              const medicine = medicines[gtin];
              const isLoading = loadingGtin === gtin;
              
              return (
                <li key={gtin} className="list-group-item d-flex justify-content-between align-items-center">
                  {isLoading ? (
                    <div className="d-flex align-items-center">
                      <div className="spinner-border spinner-border-sm me-2"></div>
                      {t('scanner.searching')}
                    </div>
                  ) : medicine ? (
                    <div>
                      <h6 className="mb-1 text-primary">
                        {medicine.name}
                        {medicine.dose && ` (${medicine.dose} mg)`}
                      </h6>
                      {medicine.box_capacity && (
                        <small className="text-muted">{t('scanner.quantity', { quantity: medicine.box_capacity })}</small>
                      )}
                    </div>
                  ) : (
                    <div className="text-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {t('scanner.medicine_not_found')}
                    </div>
                  )}
                  
                  {medicine && (
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeMedicine(gtin)}
                      title={t('scanner.remove_from_list')}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  // Fonction pour rendre les boutons du footer
  function renderFooterButtons() {
    const validMedicines = Object.values(medicines).filter(med => med !== null);
    
    return (
      <div className={modal ? "" : "mt-3 d-flex justify-content-end gap-2"}>
        {modal && (
          validMedicines.length > 0 && onAddAll ? (
            <button
              type="button"
              className="btn btn-success w-100"
              onClick={handleAddAll}
            >
              <i className="bi bi-plus-circle me-2"></i>
              {t('scanner.add')}
            </button>
          ) : (
            <button
                type="button"
                className="btn btn-secondary w-100"
                onClick={handleClose}
            >
              <i className="bi bi-x-circle me-2"></i>
              {modal ? t('scanner.cancel') : t('scanner.close')}
            </button>
          )
        )}
      </div>
    );
  }
});

export default QRCodeScanner;
