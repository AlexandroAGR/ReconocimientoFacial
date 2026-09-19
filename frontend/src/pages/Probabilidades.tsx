import { useEffect, useState } from "react";
import { api } from "../services/api";

interface ProbabilityStats {
  total_reconocimientos: number;
  coincidencias: number;
  no_coincidencias: number;
  tasa_coincidencia: number;
  similitud_promedio: number;
  similitud_maxima: number | null;
  similitud_minima: number | null;
}

export default function Probabilidades() {
  const [stats, setStats] =
    useState<ProbabilityStats | null>(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setCargando(true);
        setError(null);

        const response =
          await api.get<ProbabilityStats>(
            "/probabilidades"
          );

        setStats(response.data);
      } catch (error) {
        console.error(error);

        setError(
          "No se pudieron cargar las estadísticas."
        );
      } finally {
        setCargando(false);
      }
    };

    void cargarEstadisticas();
  }, []);

  if (cargando) {
    return (
      <div className="page">
        <h1>Estadísticas</h1>
        <p>Cargando...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="page">
        <h1>Estadísticas</h1>
        <p>
          {error ?? "No hay información disponible."}
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            ANÁLISIS
          </span>

          <h1>Estadísticas de reconocimiento</h1>

          <p>
            Métricas obtenidas de los reconocimientos
            almacenados.
          </p>
        </div>
      </section>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="eyebrow">
            RECONOCIMIENTOS
          </span>

          <h2>
            {stats.total_reconocimientos}
          </h2>

          <p>
            Total procesado
          </p>
        </div>

        <div className="stat-card">
          <span className="eyebrow">
            COINCIDENCIAS
          </span>

          <h2>
            {stats.coincidencias}
          </h2>

          <p>
            Rostros identificados
          </p>
        </div>

        <div className="stat-card">
          <span className="eyebrow">
            SIN COINCIDENCIA
          </span>

          <h2>
            {stats.no_coincidencias}
          </h2>

          <p>
            Rostros no identificados
          </p>
        </div>

        <div className="stat-card">
          <span className="eyebrow">
            TASA DE COINCIDENCIA
          </span>

          <h2>
            {(stats.tasa_coincidencia * 100).toFixed(1)}%
          </h2>

          <p>
            Sobre los registros actuales
          </p>
        </div>
      </div>

      <div className="dashboard-card">
        <span className="eyebrow">
          SIMILITUD FACIAL
        </span>

        <h2>Estadísticas del modelo</h2>

        <div className="metrics-grid">
          <div>
            <span>Promedio</span>

            <strong>
              {stats.similitud_promedio.toFixed(4)}
            </strong>
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
      </div>
    </div>
  );
}

