import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import { readBarcodes } from "zxing-wasm/reader";
import { fetchMedicaments } from "../../utils/api/scanner";
import { useAlert } from "../../contexts/AlertContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { 
  QrCode, 
  Camera, 
  Settings, 
  X, 
  PlusCircle, 
  Pencil, 
  XCircle, 
  AlertTriangle
} from "lucide-react";
import type { QRCodeScannerProps, QRCodeScannerHandle, QRScannedMedicine } from "@meditime/types";
import { readerOptions, injectScannerStyles, getCameraType, drawDetection, extractGTIN01 } from "./scannerUtils";
import ScannerControls from "./ScannerControls";
import ScannerResultsList from "./ScannerResultsList";

// Injecter les styles
injectScannerStyles();

const QRCodeScanner = forwardRef<QRCodeScannerHandle, QRCodeScannerProps>(({
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState("");
  const [gtins, setGtins] = useState<string[]>([]); // liste des GTIN uniques (01)
  const [medicines, setMedicines] = useState<Record<string, QRScannedMedicine | null>>(() => Object.create(null)); // cache des médicaments trouvés par GTIN - contient directement les medicine_boxes
  const [loadingGtin, setLoadingGtin] = useState<string | null>(null); // GTIN en cours de recherche
  
  // Nouveaux états pour les contrôles de caméra
  const [zoom, setZoom] = useState(1); // Zoom par défaut à 1
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<MediaDeviceInfo | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false); // Pour détecter si c'est une caméra frontale
  const [showControls, setShowControls] = useState(false);
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
    async function getCameras(_stream: MediaStream) {
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
        let errorMessage = (e instanceof Error ? e.message : null) || t('scanner.camera_error');
        
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
  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  // Fonction pour changer de caméra
  const handleCameraChange = (camera: MediaDeviceInfo) => {
    setSelectedCamera(camera);
    
    // Utiliser la fonction helper simplifiée
    const cameraType = getCameraType(camera);
    const isFront = cameraType === 'front';
    setIsFrontCamera(isFront);
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
        if (!tempCtx) {
          rafRef.current = requestAnimationFrame(scanLoop);
          return;
        }
        
        // Dessiner sur le canvas temporaire CACHÉ (pas visible = pas de lag)
        tempCtx.drawImage(video, 0, 0, w, h);

        // ✅ ÉTAPE 7: Gestion détections
        const imageData = tempCtx.getImageData(0, 0, w, h);
        const results = await readBarcodes(imageData, readerOptions);

        // Canvas visible pour overlay seulement
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          rafRef.current = requestAnimationFrame(scanLoop);
          return;
        }
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

  // Fonction pour chercher le médicament associé au GTIN et créer directement une medicine_box
  const searchMedicine = async (gtin: string) => {
    // Vérifier si le médicament est déjà en cours de recherche ou s'il est dans la liste active
    if (loadingGtin === gtin || (Object.prototype.hasOwnProperty.call(medicines, gtin) && gtins.includes(gtin))) return;
    
    setLoadingGtin(gtin);
    const setMedicineEntry = (key: string, value: unknown) => {
      setMedicines(prev => {
        const updated = Object.assign(Object.create(null), prev);
        Object.defineProperty(updated, key, { value, enumerable: true, configurable: true, writable: true });
        return updated;
      });
    };
    try {
      const results = await fetchMedicaments(gtin);
      if (results && results.length > 0) {
        const medicineData = results[0] as Record<string, string | undefined>;
        
        // Créer directement une structure medicine_box
        const dose = parseInt(medicineData.dose?.replace(/\D/g, '') || '0');
        const conditionnement = parseInt(medicineData.conditionnement?.replace(/\D/g, '') || '0');
        
        const medicineBox = {
          gtin,
          name: medicineData.name || 'Unknown',
          dose: dose,
          box_capacity: conditionnement,
          stock_quantity: conditionnement,
          stock_alert_threshold: 10,
          conditions: [], // Conditions par défaut vides
          // Garder les données originales pour référence
          original_data: medicineData
        };

        setMedicineEntry(gtin, medicineBox);
        
        // Callback optionnel pour notifier le parent
        if (onMedicineFound) {
          onMedicineFound(medicineBox);
        }
      } else {
        setMedicineEntry(gtin, null); // Aucun résultat trouvé
      }
    } catch (error) {
      console.error("Erreur lors de la recherche du médicament:", error);
      setMedicineEntry(gtin, null);
    } finally {
      setLoadingGtin(null);
    }
  };

  // Fonction pour supprimer un médicament scanné
  const removeMedicine = (gtinToRemove: string) => {
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

  return (
    <>
      {modal ? (
        <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                {t('scanner.title')}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t('scanner.camera_instruction')}
              </DialogDescription>
            </DialogHeader>
            {renderScannerContent()}
            <DialogFooter>
              {renderFooterButtons()}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
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
          className="relative mb-3 mx-auto rounded-lg overflow-hidden w-full max-w-md"
          style={{ aspectRatio: "16/10" }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full bg-black object-cover"
            style={{ 
              transform: `scale(${zoom}) ${isFrontCamera ? 'scaleX(-1)' : ''}`,
              transformOrigin: "center center"
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full object-cover"
            style={{ 
              transform: `scale(${zoom}) ${isFrontCamera ? 'scaleX(-1)' : ''}`,
              transformOrigin: "center center"
            }}
          />
          
          {/* Contrôles discrets */}
          <ScannerControls
            zoom={zoom}
            onZoomChange={handleZoomChange}
            isFrontCamera={isFrontCamera}
            onToggleFrontCamera={() => setIsFrontCamera(!isFrontCamera)}
            availableCameras={availableCameras}
            selectedCamera={selectedCamera}
            onCameraChange={handleCameraChange}
            showControls={showControls}
            onAutoHideControls={autoHideControls}
            hideControlsTimeoutRef={hideControlsTimeoutRef}
          />
          
          {/* Bouton discret pour ouvrir/fermer les contrôles */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 left-2 h-9 w-9 rounded-full bg-black/70 hover:bg-black/85 text-white border border-white/30 hover:border-white/50 backdrop-blur-sm transition-all z-1000"
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
          >
            {showControls ? <X className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
          </Button>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        {gtins.length === 0 && !error && (
          <div className="text-center text-muted-foreground mb-3 flex items-center justify-center gap-2">
            <Camera className="h-4 w-4" />
            {t('scanner.camera_instruction')}
          </div>
        )}

        {/* Résultats */}
        <ScannerResultsList
          gtins={gtins}
          medicines={medicines}
          loadingGtin={loadingGtin}
          onRemoveMedicine={removeMedicine}
        />
      </div>
    );
  }

  // Fonction pour rendre les boutons du footer
  function renderFooterButtons() {
    const validMedicines = Object.values(medicines).filter(med => med !== null);
    
    return (
      <div className={modal ? "w-full" : "mt-3 flex justify-end gap-2"}>
        {modal && (
          validMedicines.length > 0 && onAddAll ? (
            <Button
              type="button"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleAddAll}
            >
              {singleScan ? <Pencil className="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
              {singleScan ? t('modify') : t('scanner.add')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleClose}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {modal ? t('scanner.cancel') : t('scanner.close')}
            </Button>
          )
        )}
      </div>
    );
  }
});

export default QRCodeScanner;
