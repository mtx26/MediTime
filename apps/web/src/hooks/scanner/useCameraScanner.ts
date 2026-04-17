import { useEffect, useRef, useState } from 'react';
import { readBarcodes } from 'zxing-wasm/reader';
import { readerOptions, getCameraType, drawDetection, extractGTIN01 } from '@/components/scanner/scannerUtils';
import type { TFunction } from 'i18next';

interface UseCameraScannerParams {
  show: boolean;
  modal: boolean;
  onGtinDetected: (gtin: string) => void;
  t: TFunction;
}

export function useCameraScanner({ show, modal, onGtinDetected, t }: UseCameraScannerParams) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState('');

  const [zoom, setZoom] = useState(1);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<MediaDeviceInfo | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isLoadingRef = useRef(false);
  const lastScanTimeRef = useRef(0);
  const scanIntervalMs = 100;
  const lastSeenRef = useRef({ text: '', t: 0 });

  // Ref to avoid stale closure in scanLoop RAF
  const onGtinDetectedRef = useRef(onGtinDetected);
  onGtinDetectedRef.current = onGtinDetected;

  const autoHideControls = () => {
    if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    hideControlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const handleZoomChange = (newZoom: number) => setZoom(newZoom);

  const handleCameraChange = (camera: MediaDeviceInfo) => {
    setSelectedCamera(camera);
    const cameraType = getCameraType(camera);
    setIsFrontCamera(cameraType === 'front');
  };

  // Scan loop
  const scanLoop = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const now = performance.now();
    if (now - lastScanTimeRef.current < scanIntervalMs) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    lastScanTimeRef.current = now;

    try {
      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;

      if (w && h) {
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
          rafRef.current = requestAnimationFrame(scanLoop);
          return;
        }
        
        tempCtx.drawImage(video, 0, 0, w, h);
        const imageData = tempCtx.getImageData(0, 0, w, h);
        const results = await readBarcodes(imageData, readerOptions);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          rafRef.current = requestAnimationFrame(scanLoop);
          return;
        }
        ctx.clearRect(0, 0, w, h);

        if (results && results.length) {
          const r = results[0];
          drawDetection(ctx, r);

          const sameAsLast = r.text === lastSeenRef.current.text && (now - lastSeenRef.current.t < 2000);
          lastSeenRef.current = { text: r.text, t: now };

          if (!sameAsLast) {
            const gtin = extractGTIN01(r.text);
            if (gtin) {
              onGtinDetectedRef.current(gtin);
            }
          }
        }
      }
    } catch {
      // Silent catch for camera/permission errors
    }

    rafRef.current = requestAnimationFrame(scanLoop);
  };

  useEffect(() => {
    async function getCameras(_stream: MediaStream) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        
        const backCameras = cameras.filter(camera => {
          const label = camera.label.toLowerCase();
          const type = getCameraType(camera);
          if (type === 'back') {
            const isSpecializedCamera = 
              label.includes('ultra') || 
              label.includes('telephoto') || 
              label.includes('zoom') ||
              label.includes('0.5') ||
              label.includes('2x') ||
              label.includes('3x');
            return !isSpecializedCamera;
          }
          return false;
        });
        
        const frontCameras = cameras.filter(camera => getCameraType(camera) === 'front');
        const filteredCameras = [...backCameras, ...frontCameras];
        const finalCameras = filteredCameras.length > 0 ? filteredCameras : cameras;
        
        const sortedCameras = finalCameras.sort((a, b) => {
          const aType = getCameraType(a);
          const bType = getCameraType(b);
          if (aType === 'back' && bType !== 'back') return -1;
          if (aType !== 'back' && bType === 'back') return 1;
          return 0;
        });
        
        setAvailableCameras(sortedCameras);
        
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
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setError('');
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      try {
        const initialConstraints = {
          video: {
            deviceId: selectedCamera ? { exact: selectedCamera.deviceId } : undefined,
            facingMode: selectedCamera ? undefined : { ideal: 'environment' },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(initialConstraints);
        streamRef.current = stream;
        await getCameras(stream);

        if (!videoRef.current) {
          isLoadingRef.current = false;
          return;
        }

        videoRef.current.srcObject = stream;
        
        try {
          await videoRef.current.play();
          scanLoop();
        } catch (playError) {
          console.warn('Erreur lors de la lecture vidéo:', playError);
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
        const errorMessage = (e instanceof Error ? e.message : null) || t('scanner.camera_error');
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
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    if (modal ? show : true) {
      start();
    } else {
      stop();
    }

    return stop;
  }, [show, modal, selectedCamera]);

  return {
    videoRef,
    canvasRef,
    error,
    zoom,
    handleZoomChange,
    availableCameras,
    selectedCamera,
    handleCameraChange,
    isFrontCamera,
    setIsFrontCamera,
    showControls,
    setShowControls,
    autoHideControls,
    hideControlsTimeoutRef,
  };
}
