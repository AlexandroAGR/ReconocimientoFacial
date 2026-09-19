import { useRef } from "react";
import Webcam from "react-webcam";

interface CameraCaptureProps {
  onCapture: (image: string) => void;
}

export default function CameraCapture({
  onCapture,
}: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);

  const capturar = () => {
    const image = webcamRef.current?.getScreenshot();

    if (!image) {
      return;
    }

    onCapture(image);
  };

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

      <button onClick={capturar}>
        Capturar rostro
      </button>
    </div>
  );
}