import { useState } from "react";
import CameraCapture from "../components/CameraCapture";
import { api } from "../services/api";
import type { RecognitionResult } from "../types/facial";

export default function Reconocimiento() {
const [resultado, setResultado] =
useState<RecognitionResult | null>(null);

const [cargando, setCargando] = useState(false);
const [umbral, setUmbral] = useState(0.75);

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

  formData.append(
    "umbral",
    umbral.toString()
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

return ( <div className="page"> <section className="page-heading"> <div> <span className="eyebrow">
INTELIGENCIA ARTIFICIAL </span>

      <h1>Reconocimiento Facial</h1>

      <p>
        Identificación facial en tiempo real.
      </p>
    </div>

    <div className="system-badge">
      <span />
      Cámara activa
    </div>
  </section>

  <div className="recognition-layout">
    <div className="dashboard-card camera-card">
      <div className="card-header">
        <div>
          <span className="eyebrow">
            CÁMARA
          </span>

          <h2>Captura en tiempo real</h2>
        </div>

        {cargando && (
          <span className="processing-badge">
            Analizando...
          </span>
        )}
      </div>

      <div className="camera-container">
        <CameraCapture onCapture={reconocer} />
      </div>

      <div className="threshold-field">
        <label>
          Umbral de aceptación
          <strong>{umbral.toFixed(2)}</strong>
        </label>
        <input
          type="range"
          min={0.4}
          max={0.95}
          step={0.01}
          value={umbral}
          onChange={(e) => setUmbral(Number(e.target.value))}
        />
      </div>
    </div>

    <div className="dashboard-card result-card">
      <span className="eyebrow">
        RESULTADO
      </span>

      {!resultado && !cargando && (
        <div className="empty-result">
          <div className="empty-icon">
            ◎
          </div>

          <h2>Esperando rostro</h2>

          <p>
            Colócate frente a la cámara para
            comenzar el reconocimiento.
          </p>
        </div>
      )}

      {cargando && (
        <div className="empty-result">
          <div className="loading-spinner" />

          <h2>Analizando rostro</h2>

          <p>
            InsightFace está procesando la captura.
          </p>
        </div>
      )}

      {resultado && !cargando && (
        <div
          className={
            resultado.coincide
              ? "recognition-result recognized"
              : "recognition-result unknown"
          }
        >
          <div className="result-icon">
            {resultado.coincide ? "✓" : "?"}
          </div>

          <span className="result-label">
            {resultado.coincide
              ? "PERSONA RECONOCIDA"
              : "SIN COINCIDENCIA"}
          </span>

          {resultado.coincide && (
            <h2>{resultado.nombre}</h2>
          )}

          <div className="result-metrics">
            <div>
              <span>Similitud</span>

              <strong>
                {resultado.similitud !== null
                  ? `${(
                      resultado.similitud * 100
                    ).toFixed(2)}%`
                  : "-"}
              </strong>
            </div>

            <div>
              <span>Umbral</span>

              <strong>
                {(
                  resultado.umbral * 100
                ).toFixed(2)}%
              </strong>
            </div>

            <div>
              <span>Probabilidad calibrada</span>

              <strong>
                {resultado.probabilidad_calibrada !== null
                  ? `${(
                      resultado.probabilidad_calibrada * 100
                    ).toFixed(1)}%`
                  : "-"}
              </strong>
            </div>

            <div>
              <span>Confianza</span>

              <strong>
                {resultado.confianza ?? "-"}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
</div>


);
}
