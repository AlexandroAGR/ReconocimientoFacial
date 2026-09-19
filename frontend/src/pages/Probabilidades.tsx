import { useEffect, useState } from "react";
import ProbabilityChart from "../components/ProbabilityChart";
import { api } from "../services/api";
import type {
  CalibrationPoint,
  NivelCalidad,
  PredictionResponse,
  ProbabilityStats,
  TrainingMetrics,
  TrainingRecord,
} from "../types/facial";

const CONCEPTOS = [
  {
    titulo: "SIMILITUD",
    texto: "Qué tan parecidos son dos embeddings faciales.",
  },
  {
    titulo: "DISTANCIA",
    texto: "Medida de separación entre dos representaciones (1 - similitud).",
  },
  {
    titulo: "UMBRAL",
    texto: "Valor usado para aceptar o rechazar una coincidencia.",
  },
  {
    titulo: "CONFIANZA",
    texto: "Nivel de seguridad asociado a una decisión del sistema.",
  },
  {
    titulo: "PROB. CALIBRADA",
    texto: "Estimación estadística obtenida mediante un modelo calibrado.",
  },
];

export default function Probabilidades() {
  // --- estadísticas generales ---
  const [stats, setStats] = useState<ProbabilityStats | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- calibración interactiva ---
  const [umbral, setUmbral] = useState(0.75);
  const [curva, setCurva] = useState<CalibrationPoint[]>([]);
  const [simSimilitud, setSimSimilitud] = useState(0.87);
  const [prediccion, setPrediccion] = useState<PredictionResponse | null>(
    null
  );

  // --- módulo de entrenamiento ML ---
  const [registros, setRegistros] = useState<TrainingRecord[]>([]);
  const [metricas, setMetricas] = useState<TrainingMetrics | null>(null);
  const [entrenando, setEntrenando] = useState(false);
  const [guardandoDato, setGuardandoDato] = useState(false);

  const [nuevoDato, setNuevoDato] = useState({
    similitud: 0.85,
    calidad_imagen: "alta" as NivelCalidad,
    iluminacion: "alta" as NivelCalidad,
    resultado_real: true,
  });

  const cargarEstadisticas = async () => {
    try {
      setCargando(true);
      setError(null);

      const response = await api.get<ProbabilityStats>("/probabilidades");
      setStats(response.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las estadísticas.");
    } finally {
      setCargando(false);
    }
  };

  const cargarCurva = async (valorUmbral: number) => {
    try {
      const response = await api.get<CalibrationPoint[]>(
        "/probabilidades/curva",
        { params: { umbral: valorUmbral } }
      );
      setCurva(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const calcularPrediccion = async (
    similitud: number,
    valorUmbral: number
  ) => {
    try {
      const response = await api.post<PredictionResponse>(
        "/probabilidades/prediccion",
        { similitud, umbral: valorUmbral }
      );
      setPrediccion(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarDatosEntrenamiento = async () => {
    try {
      const response = await api.get<TrainingRecord[]>("/modelos/datos");
      setRegistros(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarMetricas = async () => {
    try {
      const response = await api.get<TrainingMetrics>("/modelos/metricas");
      setMetricas(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    void cargarEstadisticas();
    void cargarCurva(0.75);
    void calcularPrediccion(0.87, 0.75);
    void cargarDatosEntrenamiento();
    void cargarMetricas();
  }, []);

  const onCambiarUmbral = (valor: number) => {
    setUmbral(valor);
    void cargarCurva(valor);
    void calcularPrediccion(simSimilitud, valor);
  };

  const onCambiarSimilitud = (valor: number) => {
    setSimSimilitud(valor);
    void calcularPrediccion(valor, umbral);
  };

  const registrarDato = async () => {
    try {
      setGuardandoDato(true);

      await api.post("/modelos/datos", {
        similitud: nuevoDato.similitud,
        distancia: Number((1 - nuevoDato.similitud).toFixed(4)),
        calidad_imagen: nuevoDato.calidad_imagen,
        iluminacion: nuevoDato.iluminacion,
        resultado_real: nuevoDato.resultado_real,
      });

      await cargarDatosEntrenamiento();
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el dato de entrenamiento.");
    } finally {
      setGuardandoDato(false);
    }
  };

  const entrenarModelo = async () => {
    try {
      setEntrenando(true);

      const response = await api.post<TrainingMetrics>("/modelos/entrenar");
      setMetricas(response.data);

      if (response.data.entrenado) {
        await cargarCurva(umbral);
        await calcularPrediccion(simSimilitud, umbral);
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo entrenar el modelo.");
    } finally {
      setEntrenando(false);
    }
  };

  if (cargando) {
    return (
      <div className="page">
        <h1>Probabilidades</h1>
        <p>Cargando...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="page">
        <h1>Probabilidades</h1>
        <p>{error ?? "No hay información disponible."}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">ANÁLISIS</span>
          <h1>Probabilidades</h1>
          <p>
            La similitud no es una probabilidad: aquí se calibra la relación
            entre similitud, umbral y probabilidad estimada de coincidencia.
          </p>
        </div>
      </section>

      {/* ---- estadísticas generales ---- */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="eyebrow">RECONOCIMIENTOS</span>
          <h2>{stats.total_reconocimientos}</h2>
          <p>Total procesado</p>
        </div>

        <div className="stat-card">
          <span className="eyebrow">TASA DE COINCIDENCIA</span>
          <h2>{(stats.tasa_coincidencia * 100).toFixed(1)}%</h2>
          <p>Sobre los registros actuales</p>
        </div>

        <div className="stat-card">
          <span className="eyebrow">PROB. CALIBRADA PROMEDIO</span>
          <h2>
            {stats.probabilidad_calibrada_promedio !== null
              ? `${(stats.probabilidad_calibrada_promedio * 100).toFixed(1)}%`
              : "-"}
          </h2>
          <p>De los reconocimientos registrados</p>
        </div>

        <div className="stat-card">
          <span className="eyebrow">UMBRAL MÁS USADO</span>
          <h2>
            {stats.umbral_mas_usado !== null
              ? stats.umbral_mas_usado.toFixed(2)
              : "-"}
          </h2>
          <p>Configuración habitual</p>
        </div>
      </div>

      <div className="dashboard-card">
        <span className="eyebrow">SIMILITUD FACIAL</span>
        <h2>Estadísticas del modelo</h2>

        <div className="info-grid">
          <div>
            <span>Promedio</span>
            <strong>{stats.similitud_promedio.toFixed(4)}</strong>
          </div>
          <div>
            <span>Máxima</span>
            <strong>
              {stats.similitud_maxima !== null
                ? stats.similitud_maxima.toFixed(4)
                : "-"}
            </strong>
          </div>
          <div>
            <span>Mínima</span>
            <strong>
              {stats.similitud_minima !== null
                ? stats.similitud_minima.toFixed(4)
                : "-"}
            </strong>
          </div>
        </div>

        {/* ---- conceptos (sección 6 del documento técnico) ---- */}
        <div className="concept-grid">
          {CONCEPTOS.map((concepto) => (
            <div className="concept-card" key={concepto.titulo}>
              <span>{concepto.titulo}</span>
              <p>{concepto.texto}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ---- calibración interactiva ---- */}
      <div className="calibration-layout" style={{ marginTop: 18 }}>
        <div className="dashboard-card">
          <span className="eyebrow">CALIBRACIÓN</span>
          <h2>Similitud → probabilidad</h2>

          <ProbabilityChart data={curva} umbral={umbral} />

          <div className="threshold-field">
            <label>
              Umbral de decisión
              <strong>{umbral.toFixed(2)}</strong>
            </label>
            <input
              type="range"
              min={0.4}
              max={0.95}
              step={0.01}
              value={umbral}
              onChange={(e) => onCambiarUmbral(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="dashboard-card">
          <span className="eyebrow">SIMULADOR</span>
          <h2>Probar una similitud</h2>

          <div className="simulator-row">
            <div className="form-group">
              <label>Similitud a evaluar</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={simSimilitud}
                onChange={(e) =>
                  onCambiarSimilitud(Number(e.target.value))
                }
              />
            </div>
          </div>

          {prediccion && (
            <>
              <div className="probability-main">
                <strong className={prediccion.coincide ? "text-success" : ""}>
                  {(prediccion.probabilidad_calibrada * 100).toFixed(1)}%
                </strong>
                <span>probabilidad calibrada</span>
              </div>

              <div className="probability-bar">
                <span
                  style={{
                    width: `${prediccion.probabilidad_calibrada * 100}%`,
                  }}
                />
              </div>

              <div className="probability-details">
                <div>
                  <span>Resultado</span>
                  <strong className={prediccion.coincide ? "text-success" : ""}>
                    {prediccion.coincide ? "Coincide" : "No coincide"}
                  </strong>
                </div>
                <div>
                  <span>Confianza</span>
                  <strong>{prediccion.confianza}</strong>
                </div>
                <div>
                  <span>Umbral usado</span>
                  <strong>{prediccion.umbral.toFixed(2)}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---- Machine Learning aplicado (sección 7 del documento) ---- */}
      <div className="dashboard-card" style={{ marginTop: 18 }}>
        <span className="eyebrow">MACHINE LEARNING</span>
        <h2>Entrenamiento del clasificador</h2>
        <p style={{ color: "var(--text-soft)", fontSize: 13, marginTop: 6 }}>
          Registra comparaciones ya evaluadas (con su resultado real conocido)
          para entrenar una Regresión Logística que estime la probabilidad
          calibrada de coincidencia a partir de la similitud, la distancia, la
          calidad de imagen y la iluminación.
        </p>

        <div className="ml-panel" style={{ marginTop: 8 }}>
          {/* --- carga de datos --- */}
          <div>
            <h2 style={{ fontSize: 14, marginTop: 12 }}>Carga de datos</h2>

            <div className="ml-form-grid">
              <div className="form-group">
                <label>Similitud observada</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={nuevoDato.similitud}
                  onChange={(e) =>
                    setNuevoDato((prev) => ({
                      ...prev,
                      similitud: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Calidad de imagen</label>
                <select
                  value={nuevoDato.calidad_imagen}
                  onChange={(e) =>
                    setNuevoDato((prev) => ({
                      ...prev,
                      calidad_imagen: e.target.value as NivelCalidad,
                    }))
                  }
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>

              <div className="form-group">
                <label>Iluminación</label>
                <select
                  value={nuevoDato.iluminacion}
                  onChange={(e) =>
                    setNuevoDato((prev) => ({
                      ...prev,
                      iluminacion: e.target.value as NivelCalidad,
                    }))
                  }
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>

              <div className="form-group">
                <label>Resultado real</label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={
                      nuevoDato.resultado_real
                        ? "toggle-option active-yes"
                        : "toggle-option"
                    }
                    onClick={() =>
                      setNuevoDato((prev) => ({
                        ...prev,
                        resultado_real: true,
                      }))
                    }
                  >
                    Coincide
                  </button>
                  <button
                    type="button"
                    className={
                      !nuevoDato.resultado_real
                        ? "toggle-option active-no"
                        : "toggle-option"
                    }
                    onClick={() =>
                      setNuevoDato((prev) => ({
                        ...prev,
                        resultado_real: false,
                      }))
                    }
                  >
                    No coincide
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="secondary-button"
              disabled={guardandoDato}
              onClick={() => void registrarDato()}
            >
              {guardandoDato ? "Guardando..." : "Guardar registro"}
            </button>

            <p className="training-count">
              {registros.length} registro(s) de entrenamiento almacenados.
            </p>
          </div>

          {/* --- entrenamiento y métricas --- */}
          <div>
            <h2 style={{ fontSize: 14, marginTop: 12 }}>
              Entrenamiento y métricas
            </h2>

            <button
              type="button"
              className="primary-button"
              disabled={entrenando}
              onClick={() => void entrenarModelo()}
            >
              {entrenando ? "Entrenando..." : "Entrenar modelo"}
            </button>

            {metricas && !metricas.entrenado && (
              <div className="training-status warning">
                {metricas.mensaje ?? "El modelo aún no ha sido entrenado."}
              </div>
            )}

            {metricas && metricas.entrenado && (
              <>
                <div className="metrics-grid">
                  <div className="metric-tile">
                    <span>PRECISIÓN</span>
                    <strong>
                      {metricas.precision !== null
                        ? `${(metricas.precision * 100).toFixed(1)}%`
                        : "-"}
                    </strong>
                  </div>
                  <div className="metric-tile">
                    <span>RECALL</span>
                    <strong>
                      {metricas.recall !== null
                        ? `${(metricas.recall * 100).toFixed(1)}%`
                        : "-"}
                    </strong>
                  </div>
                  <div className="metric-tile">
                    <span>F1-SCORE</span>
                    <strong>
                      {metricas.f1_score !== null
                        ? `${(metricas.f1_score * 100).toFixed(1)}%`
                        : "-"}
                    </strong>
                  </div>
                  <div className="metric-tile">
                    <span>REGISTROS</span>
                    <strong>{metricas.total_registros}</strong>
                  </div>
                </div>

                {metricas.matriz_confusion && (
                  <div className="confusion-grid">
                    <div className="confusion-cell vp">
                      <span>VERDADEROS POSITIVOS</span>
                      <strong>
                        {metricas.matriz_confusion.verdaderos_positivos}
                      </strong>
                    </div>
                    <div className="confusion-cell fp">
                      <span>FALSOS POSITIVOS</span>
                      <strong>
                        {metricas.matriz_confusion.falsos_positivos}
                      </strong>
                    </div>
                    <div className="confusion-cell fn">
                      <span>FALSOS NEGATIVOS</span>
                      <strong>
                        {metricas.matriz_confusion.falsos_negativos}
                      </strong>
                    </div>
                    <div className="confusion-cell vn">
                      <span>VERDADEROS NEGATIVOS</span>
                      <strong>
                        {metricas.matriz_confusion.verdaderos_negativos}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="info-grid" style={{ marginTop: 8 }}>
                  <div>
                    <span>Tasa de falsos positivos</span>
                    <strong>
                      {metricas.tasa_falsos_positivos !== null
                        ? `${(metricas.tasa_falsos_positivos * 100).toFixed(
                            1
                          )}%`
                        : "-"}
                    </strong>
                  </div>
                  <div>
                    <span>Tasa de falsos negativos</span>
                    <strong>
                      {metricas.tasa_falsos_negativos !== null
                        ? `${(metricas.tasa_falsos_negativos * 100).toFixed(
                            1
                          )}%`
                        : "-"}
                    </strong>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
