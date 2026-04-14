import { useEffect, forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import { useAlert } from "../../contexts/AlertContext";
import { useCameraScanner } from "@/hooks/scanner/useCameraScanner";
import { useScannedMedicines } from "@/hooks/scanner/useScannedMedicines";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import type { QRCodeScannerProps, QRCodeScannerHandle } from "@meditime/types";
import { injectScannerStyles } from "./scannerUtils";
import ScannerControls from "./ScannerControls";
import ScannerResultsList from "./ScannerResultsList";

// Injecter les styles
injectScannerStyles();

const QRCodeScanner = forwardRef<QRCodeScannerHandle, QRCodeScannerProps>(({
  onMedicineFound = null,
  singleScan = false,
  onClose = null,
  onAddAll = null,
  show = false,
  modal = true,
  onStateChange = null,
}, ref) => {
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  const {
    gtins, medicines, loadingGtin,
    addGtin, removeMedicine, resetScannedMedicines, handleAddAll,
  } = useScannedMedicines({ onMedicineFound, onAddAll, singleScan, showAlert, t, onStateChange });

  const {
    videoRef, canvasRef, error,
    zoom, handleZoomChange,
    availableCameras, selectedCamera, handleCameraChange,
    isFrontCamera, setIsFrontCamera,
    showControls, setShowControls,
    autoHideControls, hideControlsTimeoutRef,
  } = useCameraScanner({ show, modal, onGtinDetected: addGtin, t });

  useImperativeHandle(ref, () => ({
    handleAddAll
  }));

  // Reset des données quand la modal s'ouvre (mode modal uniquement)
  useEffect(() => {
    if (modal && show) {
      resetScannedMedicines();
    }
  }, [show, modal, resetScannedMedicines]);

  // Gérer la fermeture avec reset
  const handleClose = () => {
    resetScannedMedicines();
    if (onClose) onClose();
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
