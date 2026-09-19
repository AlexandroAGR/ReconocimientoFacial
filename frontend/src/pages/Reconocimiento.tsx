import { useState } from "react";
import CameraCapture from "../components/CameraCapture";
import { api } from "../services/api";
import type { RecognitionResult } from "../types/facial";

export default function Reconocimiento() {
  const [resultado, setResultado] =
    useState<RecognitionResult | null>(null);

  const [cargando, setCargando] = useState(false);

  const reconocer = async (image: string) => {
    try {
      setCargando(true);
      setResultado(null);

      const blob = await fetch(image).then((res) =>
        res.blob()
      );

      const formData = new FormData();

      formData.append(
        "file",
        blob,
        "captura.jpg"
      );

      const response = await api.post<RecognitionResult>(
        "/reconocimiento",
        formData
      );

      setResultado(response.data);
    } catch (error) {
      console.error(error);
      alert("No se pudo realizar el reconocimiento");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div>
      <h1>Reconocimiento Facial</h1>

      <CameraCapture onCapture={reconocer} />

      {cargando && (
        <p>Analizando rostro...</p>
      )}

      {resultado && (
        <div>
          <h2>
            {resultado.coincide
              ? "Persona reconocida"
              : "No se encontró coincidencia"}
          </h2>

          {resultado.coincide && (
            <p>
              Persona: {resultado.nombre}
            </p>
          )}

          <p>
            Similitud:{" "}
            {resultado.similitud !== null
              ? resultado.similitud.toFixed(4)
              : "-"}
          </p>

          <p>
            Umbral: {resultado.umbral}
          </p>
        </div>
      )}
    </div>
  );
}