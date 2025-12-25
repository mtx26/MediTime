import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import { readBarcodes } from "zxing-wasm/reader";
import { fetchMedicaments } from "../../utils/api/scanner";
import { useAlert } from "../../contexts/AlertContext";

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
  const { showAlert } = useAlert();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [error, setError] = useState("");
  const [gtins, setGtins] = useState([]); // liste des GTIN uniques (01)
  const [medicines, setMedicines] = useState(() => Object.create(null)); // cache des médicaments trouvés par GTIN - contient directement les medicine_boxes
  const [loadingGtin, setLoadingGtin] = useState(null); // GTIN en cours de recherche
  
  // Nouveaux états pour les contrôles de caméra
  const [zoom, setZoom] = useState(1); // Zoom par défaut à 1
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false); // Pour détecter si c'est une caméra frontale
  const [showControls, setShowControls] = useState(false);
  const hideControlsTimeoutRef = useRef(null);
  const streamRef = useRef(null);
  const isLoadingRef = useRef(false);
  const lastScanTimeRef = useRef(0);
  const scanIntervalMs = 100; // Intervalle entre les scans en ms (réduit la consommation)

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

  // Exposer handleAddAll au composant parent via useImperativeHandle
  useImperativeHandle(ref, () => ({
    handleAddAll
  }));

  // Fonction pour réinitialiser la liste des médicaments scannés
  const resetScannedMedicines = () => {
    setGtins([]);
    setMedicines(Object.create(null));
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
    async function getCameras(stream) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        let cameras = devices.filter(device => device.kind === 'videoinput');
        
        // Filtrer pour ne garder QUE la caméra arrière principale sur iPhone
        // Exclure ultra-wide, telephoto, etc.
        const backCameras = cameras.filter(camera => {
          const label = camera.label.toLowerCase();
          const type = getCameraType(camera);
          
          // Si c'est une caméra arrière
          if (type === 'back') {
            // Exclure les caméras spécialisées (ultra-wide, telephoto, etc.)
            const isSpecializedCamera = 
              label.includes('ultra') || 
              label.includes('telephoto') || 
              label.includes('zoom') ||
              label.includes('0.5') ||
              label.includes('2x') ||
              label.includes('3x');
            
            return !isSpecializedCamera; // Garder seulement la principale
          }
          return false;
        });
        
        // Garder les caméras frontales aussi
        const frontCameras = cameras.filter(camera => getCameraType(camera) === 'front');
        
        // Combiner : caméra arrière principale + caméras frontales
        const filteredCameras = [...backCameras, ...frontCameras];
        
        // Si on n'a rien trouvé (cas rare), garder toutes les caméras
        const finalCameras = filteredCameras.length > 0 ? filteredCameras : cameras;
        
        // Trier pour privilégier la caméra arrière
        const sortedCameras = finalCameras.sort((a, b) => {
          const aType = getCameraType(a);
          const bType = getCameraType(b);
          
          if (aType === 'back' && bType !== 'back') return -1;
          if (aType !== 'back' && bType === 'back') return 1;
          return 0;
        });
        
        setAvailableCameras(sortedCameras);
        
        // Sélectionner la première caméra (caméra arrière principale)
        if (sortedCameras.length > 0 && !selectedCamera) {
          const defaultCamera = sortedCameras[0];
          setSelectedCamera(defaultCamera);
          
          const cameraType = getCameraType(defaultCamera);
          const isFront = cameraType === 'front';
          
          console.log('Caméra sélectionnée:', defaultCamera.label, 'type:', cameraType);
          setIsFrontCamera(isFront);
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
        // IMPORTANT: D'abord demander les permissions avec getUserMedia
        // Cela permet d'obtenir les vrais labels de caméras sur iOS
        const initialConstraints = {
          video: {
            deviceId: selectedCamera ? { exact: selectedCamera.deviceId } : undefined,
            facingMode: selectedCamera ? undefined : { ideal: "environment" },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(initialConstraints);
        streamRef.current = stream;
        
        // APRÈS avoir obtenu les permissions, énumérer les caméras
        // Maintenant on aura les vrais labels
        await getCameras(stream);

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

  // Fonction helper pour déterminer le type de caméra
  const getCameraType = (camera) => {
    const label = camera.label.toLowerCase();
    
    // Détecter caméra arrière explicitement
    if (label.includes('back') || label.includes('rear') || 
        label.includes('environment') || label.includes('arriere')) {
      return 'back';
    }
    
    // Détecter caméra frontale explicitement
    if (label.includes('front') || label.includes('user') || 
        label.includes('facing') || label.includes('avant')) {
      return 'front';
    }
    
    // Détecter caméras PC (considérées comme frontales)
    if (label.includes('integrated') || label.includes('webcam') || 
        label.includes('built-in')) {
      return 'front';
    }
    
    // Par défaut, considérer comme frontale
    return 'front';
  };

  // Fonction pour changer le zoom (zoom numérique CSS)
  const handleZoomChange = (newZoom) => {
    setZoom(newZoom);
  };

  // Fonction pour changer de caméra
  const handleCameraChange = (camera) => {
    setSelectedCamera(camera);
    
    // Utiliser la fonction helper simplifiée
    const cameraType = getCameraType(camera);
    const isFront = cameraType === 'front';
    setIsFrontCamera(isFront);
  };

  // Fonction pour obtenir un nom de caméra court
  const getCameraDisplayName = (camera, index) => {
    if (!camera.label) return t('scanner.camera') + ` ${index + 1}`;
    
    const type = getCameraType(camera);
    const label = camera.label.toLowerCase();
    
    // Si le label contient des mots génériques, utiliser notre traduction
    const hasGenericTerms = ['front', 'back', 'rear', 'facing'].some(term => 
      label.includes(term)
    );
    
    if (hasGenericTerms) {
      return type === 'front' ? t('scanner.camera_front') : 
             type === 'back' ? t('scanner.camera_back') : 
             camera.label;
    } else {
      // C'est un vrai nom de caméra, nettoyer le nom (retirer les termes génériques et ce qui suit)
      // Trouver le premier terme générique qui apparaît et couper là
      let cleanName = camera.label;
      const lowerLabel = camera.label.toLowerCase();
      const genericTerms = ['usb', 'camera', 'webcam', 'cam', 'device', 'video'];
      
      let earliestIndex = -1;
      for (const term of genericTerms) {
        const termIndex = lowerLabel.indexOf(term);
        if (termIndex !== -1 && (earliestIndex === -1 || termIndex < earliestIndex)) {
          earliestIndex = termIndex;
        }
      }
      
      if (earliestIndex !== -1) {
        cleanName = camera.label.substring(0, earliestIndex).trim();
      }
      
      return cleanName || camera.label;
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
      // ✅ ÉTAPE 3: Ajouter redimensionnement canvas
      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;

      if (w && h) {
        // Adapter le canvas à la frame vidéo
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;

        // 🚀 SOLUTION: Créer un canvas temporaire caché pour le traitement
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Dessiner sur le canvas temporaire CACHÉ (pas visible = pas de lag)
        tempCtx.drawImage(video, 0, 0, w, h);

        // ✅ ÉTAPE 7: Gestion détections
        const imageData = tempCtx.getImageData(0, 0, w, h);
        const results = await readBarcodes(imageData, readerOptions);

        // Canvas visible pour overlay seulement
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h); // Clear seulement l'overlay

        if (results && results.length) {
          const r = results[0];

          // Dessiner la détection seulement
          drawDetection(ctx, r);

          // Anti-spam
          const sameAsLast = r.text === lastSeenRef.current.text && (now - lastSeenRef.current.t < 2000);
          lastSeenRef.current = { text: r.text, t: now };

          if (!sameAsLast) {
            const gtin = extractGTIN01(r.text);
            if (gtin) {
              setGtins((prev) => {
                if (prev.includes(gtin)) return prev;
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

    if (Array.isArray(r?.position?.points) && r.position.points.length) {
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
      const first = points[0];
      const firstX = Number(first.x);
      const firstY = Number(first.y);
      if (Number.isFinite(firstX) && Number.isFinite(firstY)) {
        ctx.moveTo(firstX, firstY);
        for (let i = 1; i < points.length; i++) {
          const p = Array.isArray(points) ? Array.prototype.at.call(points, i) : undefined;
          if (!p || typeof p !== 'object') continue;
          const x = Number(p.x);
          const y = Number(p.y);
          if (Number.isFinite(x) && Number.isFinite(y)) {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  // Fonction pour chercher le médicament associé au GTIN et créer directement une medicine_box
  const searchMedicine = async (gtin) => {
    // Vérifier si le médicament est déjà en cours de recherche ou s'il est dans la liste active
    if (loadingGtin === gtin || (Object.prototype.hasOwnProperty.call(medicines, gtin) && gtins.includes(gtin))) return;
    
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

    setMedicines(prev => {
      const updated = Object.assign(Object.create(null), prev);
      Object.defineProperty(updated, gtin, { value: medicineBox, enumerable: true, configurable: true, writable: true });
      return updated;
    });
        
        // Callback optionnel pour notifier le parent
        if (onMedicineFound) {
          onMedicineFound(medicineBox);
        }
      } else {
        setMedicines(prev => {
          const updated = Object.assign(Object.create(null), prev);
          Object.defineProperty(updated, gtin, { value: null, enumerable: true, configurable: true, writable: true });
          return updated;
        }); // Aucun résultat trouvé
      }
    } catch (error) {
      console.error("Erreur lors de la recherche du médicament:", error);
      setMedicines(prev => {
        const updated = Object.assign(Object.create(null), prev);
        Object.defineProperty(updated, gtin, { value: null, enumerable: true, configurable: true, writable: true });
        return updated;
      });
    } finally {
      setLoadingGtin(null);
    }
  };

  // Fonction pour supprimer un médicament scanné
  const removeMedicine = (gtinToRemove) => {
    setGtins(prev => prev.filter(gtin => gtin !== gtinToRemove));
    setMedicines(prev => {
      if (!Object.prototype.hasOwnProperty.call(prev, gtinToRemove)) return prev;
      const rest = Object.entries(prev).reduce((acc, [k, v]) => {
        if (k !== gtinToRemove) {
          Object.defineProperty(acc, k, { value: v, enumerable: true, configurable: true, writable: true });
        }
        return acc;
      }, Object.create(null));
      return rest;
    });
    // S'assurer que le GTIN n'est plus en cours de chargement
    if (loadingGtin === gtinToRemove) {
      setLoadingGtin(null);
    }
  };

  // Gérer l'ajout de tous les médicaments avec reset
  const handleAddAll = async () => {
    if (onAddAll) {
      // Récupérer les medicine_boxes valides (non null)
      const medicineBoxes = Object.values(medicines).filter(med => med !== null);
      if (medicineBoxes.length === 0) {
        showAlert('warning', t('boxes.no_medicines_selected'));
        return;
      }
      
      const rep = await onAddAll(medicineBoxes);
      // Reset seulement si l'ajout a réussi
      if (rep.success) {
        resetScannedMedicines(); // Remettre à zéro après ajout réussi
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
    const GS1_SEPARATOR = String.fromCharCode(29); // Caractère de séparation GS1 (Group Separator, code ASCII 29)
    const cleaned = text.replaceAll(GS1_SEPARATOR, ""); // retire le GS (FNC1) si présent

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
            <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '500px' }}>
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
        >
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-100 h-100 bg-dark"
            style={{ 
              objectFit: "cover",
              transform: `scale(${zoom}) ${isFrontCamera ? 'scaleX(-1)' : ''}`, // Inverser horizontalement pour caméra frontale
              transformOrigin: "center center"
            }}
          />
          <canvas
            ref={canvasRef}
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{ 
              objectFit: "cover",
              transform: `scale(${zoom}) ${isFrontCamera ? 'scaleX(-1)' : ''}`, // Inverser horizontalement pour caméra frontale
              transformOrigin: "center center"
            }}
          />
          
          {/* Contrôles discrets */}
          <div 
            className={`scanner-controls position-absolute top-0 end-0 p-2 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}
            style={{ 
              background: 'rgba(0,0,0,0.8)', 
              borderRadius: '0 8px 0 12px',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.1)',
              minWidth: '140px',
              pointerEvents: showControls ? 'auto' : 'none'
            }}
            onMouseEnter={() => {
              if (showControls && hideControlsTimeoutRef.current) {
                clearTimeout(hideControlsTimeoutRef.current);
              }
            }}
            onMouseLeave={() => {
              if (showControls) {
                autoHideControls();
              }
            }}
          >
            {/* Contrôle de zoom */}
            <div className="mb-2 text-center">
              <label className="form-label text-white small mb-1 d-block">
                <i className="bi bi-zoom-in me-1"></i>
                {t('scanner.controls.zoom')}: {zoom}x
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
            
            {/* Bouton pour inverser manuellement */}
            <div className="mb-2 text-center">
              <button
                type="button"
                className={`btn btn-sm w-100 ${isFrontCamera ? 'btn-warning' : 'btn-outline-light'}`}
                onClick={() => {
                  setIsFrontCamera(!isFrontCamera);
                  autoHideControls();
                }}
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                <i className="bi bi-arrow-left-right me-1"></i>
                {isFrontCamera ? t('scanner.camera_inverted') : t('scanner.camera_normal')}
              </button>
            </div>
            
            {/* Sélection de caméra */}
            {availableCameras.length > 1 && (
              <div className="text-center">
                <label className="form-label text-white small mb-1 d-block">
                  <i className="bi bi-camera me-1"></i>
                  {t('scanner.controls.camera')}
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
          
          {/* Bouton discret pour ouvrir/fermer les contrôles */}
          <button
            type="button"
            className="btn position-absolute"
            onClick={(e) => {
              e.stopPropagation();
              if (showControls) {
                setShowControls(false);
                if (hideControlsTimeoutRef.current) {
                  clearTimeout(hideControlsTimeoutRef.current);
                }
              } else {
                setShowControls(true);
                autoHideControls();
              }
            }}
            style={{ 
              top: '8px',
              left: '8px', // Déplacé à gauche pour éviter le conflit avec le menu
              width: '36px',
              height: '36px',
              padding: '0',
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              color: 'white',
              fontSize: '16px',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              zIndex: 1000
            }}
            onMouseDown={(e) => {
              e.target.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.target.style.transform = 'scale(1)';
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(0,0,0,0.85)';
              e.target.style.borderColor = 'rgba(255,255,255,0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(0,0,0,0.7)';
              e.target.style.borderColor = 'rgba(255,255,255,0.3)';
            }}
          >
            <i className={`bi ${showControls ? 'bi-x' : 'bi-gear'}`}></i>
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
              const medicine = Object.getOwnPropertyDescriptor(medicines, gtin)?.value;
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
              <i className={`bi bi-${singleScan ? 'pencil' : 'plus-circle'} me-2`}></i>
              {singleScan ? t('modify') : t('scanner.add')}
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
