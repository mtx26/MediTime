import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ZoomIn, Camera, ArrowLeftRight } from "lucide-react";
import { getCameraDisplayName } from "./scannerUtils";
import type { ScannerControlsProps } from "@meditime/types";

export default function ScannerControls({
  zoom,
  onZoomChange,
  isFrontCamera,
  onToggleFrontCamera,
  availableCameras,
  selectedCamera,
  onCameraChange,
  showControls,
  onAutoHideControls,
  hideControlsTimeoutRef,
}: ScannerControlsProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "scanner-controls absolute top-0 right-0 p-2 min-w-35 rounded-bl-xl transition-all duration-300",
        "bg-black/80 backdrop-blur-md border border-white/10",
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onMouseEnter={() => {
        if (showControls && hideControlsTimeoutRef.current) {
          clearTimeout(hideControlsTimeoutRef.current);
        }
      }}
      onMouseLeave={() => {
        if (showControls) {
          onAutoHideControls();
        }
      }}
    >
      {/* Contrôle de zoom */}
      <div className="mb-2 text-center">
        <Label className="text-white text-xs mb-1 flex items-center justify-center gap-1">
          <ZoomIn className="h-3 w-3" />
          {t('scanner.controls.zoom')}: {zoom}x
        </Label>
        <Slider
          value={[zoom]}
          onValueChange={([value]) => {
            onZoomChange(value);
            onAutoHideControls();
          }}
          min={1}
          max={5}
          step={0.5}
          className="w-30"
        />
      </div>

      {/* Bouton pour inverser manuellement */}
      <div className="mb-2">
        <Button
          type="button"
          variant={isFrontCamera ? "default" : "outline"}
          size="sm"
          className="w-full text-xs py-1 px-2"
          onClick={() => {
            onToggleFrontCamera();
            onAutoHideControls();
          }}
        >
          <ArrowLeftRight className="h-3 w-3 mr-1" />
          {isFrontCamera ? t('scanner.camera_inverted') : t('scanner.camera_normal')}
        </Button>
      </div>

      {/* Sélection de caméra */}
      {availableCameras.length > 1 && (
        <div className="text-center">
          <Label className="text-white text-xs mb-1 flex items-center justify-center gap-1">
            <Camera className="h-3 w-3" />
            {t('scanner.controls.camera')}
          </Label>
          <Select
            value={selectedCamera?.deviceId || ''}
            onValueChange={(deviceId) => {
              const camera = availableCameras.find(c => c.deviceId === deviceId);
              if (camera) onCameraChange(camera);
              onAutoHideControls();
            }}
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableCameras.map((camera, index) => (
                <SelectItem key={camera.deviceId} value={camera.deviceId}>
                  {getCameraDisplayName(camera, index, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
