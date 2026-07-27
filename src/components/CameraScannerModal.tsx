import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, FlipHorizontal } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else if (!isOpen) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions or select another file input.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        setCapturedBlob(blob);
        stopCamera();
      }
    }, 'image/png');
  };

  const handleRetake = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedBlob) {
      const fileName = `scanned_doc_${Date.now()}.png`;
      const file = new File([capturedBlob], fileName, { type: 'image/png' });
      onCapture(file);
      onClose();
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[var(--ol-panel)] border border-[var(--ol-border)] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--ol-border)] flex items-center justify-between bg-[var(--ol-sidebar)]">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[var(--ol-accent)]" />
            <span className="font-head font-bold text-sm text-[var(--ol-brand)]">Document Camera Scanner</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--ol-muted)] hover:text-[var(--ol-brand)] hover:bg-[var(--ol-surface)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <img src={capturedImage} alt="Scanned document preview" className="w-full h-full object-contain" />
          ) : error ? (
            <div className="p-6 text-center text-red-400 text-xs font-body max-w-md">
              <p className="font-bold mb-2 text-sm">Camera Offline</p>
              <p>{error}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Document Alignment Frame Overlay */}
              <div className="absolute inset-8 border-2 border-dashed border-[var(--ol-accent)]/70 rounded-xl pointer-events-none flex flex-col justify-between p-4 shadow-[0_0_15px_rgba(var(--ol-accent-rgb),0.3)]">
                <div className="flex justify-between text-[10px] uppercase font-mono text-[var(--ol-accent)] font-bold tracking-widest bg-black/40 px-2 py-1 rounded w-fit">
                  Align Document within frame
                </div>
                <div className="text-[10px] font-mono text-white/80 bg-black/40 px-2 py-1 rounded w-fit self-center">
                  QelomaLens OCR Auto-Detect
                </div>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls Bar */}
        <div className="p-4 border-t border-[var(--ol-border)] bg-[var(--ol-sidebar)] flex items-center justify-between">
          {!capturedImage ? (
            <>
              <button
                type="button"
                onClick={toggleCameraFacing}
                title="Switch Camera"
                className="p-2.5 rounded-xl border border-[var(--ol-border)] text-[var(--ol-brand)] hover:bg-[var(--ol-surface)] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <FlipHorizontal className="w-4 h-4 text-[var(--ol-accent)]" />
                <span className="hidden sm:inline">Flip Camera</span>
              </button>

              <button
                type="button"
                onClick={handleTakeSnapshot}
                disabled={Boolean(error)}
                className="px-6 py-2.5 rounded-xl bg-[var(--ol-accent)] hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Document</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[var(--ol-border)] text-[var(--ol-muted)] hover:text-[var(--ol-brand)] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl border border-[var(--ol-border)] text-[var(--ol-brand)] hover:bg-[var(--ol-surface)] transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
              >
                <RefreshCw className="w-4 h-4 text-[var(--ol-accent)]" />
                <span>Retake Photo</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Ingest Scanned Document</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
