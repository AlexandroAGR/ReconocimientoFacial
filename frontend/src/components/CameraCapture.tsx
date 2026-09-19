import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import Webcam from "react-webcam";

interface CameraCaptureProps {
  onCapture: (image: string) => Promise<void>;
  autoCapture?: boolean;
  intervalMs?: number;
}

export default function CameraCapture({
  onCapture,
  autoCapture = true,
  intervalMs = 2000,
}: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);

  const isProcessingRef = useRef(false);

  const capturar = useCallback(async () => {
    if (isProcessingRef.current) {
      return;
    }

    const image =
      webcamRef.current?.getScreenshot();

    if (!image) {
      return;
    }

    try {
      isProcessingRef.current = true;

      await onCapture(image);
    } finally {
      isProcessingRef.current = false;
    }
  }, [onCapture]);

  useEffect(() => {
    if (!autoCapture) {
      return;
    }

    const intervalo = setInterval(() => {
      void capturar();
    }, intervalMs);

    return () => {
      clearInterval(intervalo);
    };
  }, [
    autoCapture,
    intervalMs,
    capturar,
  ]);

  return (
    <div>
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          facingMode: "user",
          width: 640,
          height: 480,
        }}
      />

      {!autoCapture && (
        <button
          onClick={() => void capturar()}
        >
          Capturar rostro
        </button>
      )}
    </div>
  );
}

