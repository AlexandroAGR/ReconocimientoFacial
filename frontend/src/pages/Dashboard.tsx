import { useEffect, useState } from "react";
import { api } from "../services/api";

interface Persona {
  id: number;
  nombre: string;
  email: string | null;
  activo: boolean;
  created_at: string;
}

interface ProbabilityStats {
  total_reconocimientos: number;
  coincidencias: number;
  no_coincidencias: number;
  tasa_coincidencia: number;
  similitud_promedio: number;
  similitud_maxima: number | null;
  similitud_minima: number | null;
}

export default function Dashboard() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [estadisticas, setEstadisticas] =
    useState<ProbabilityStats | null>(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        setCargando(true);
        setError(null);

        const [personasResponse, estadisticasResponse] =
          await Promise.all([
            api.get<Persona[]>("/personas"),
            api.get<ProbabilityStats>("/probabilidades"),
          ]);

        setPersonas(personasResponse.data);
        setEstadisticas(estadisticasResponse.data);
      } catch (error) {
        console.error(error);

        setError(
          "No se pudieron cargar los datos del dashboard."
        );
      } finally {
        setCargando(false);
      }
    };

    void cargarDashboard();
  }, []);

  if (cargando) {
    return (
      <div className="page">
        <section className="page-heading">
          <div>
            <span className="eyebrow">
              SISTEMA DE RECONOCIMIENTO
            </span>

            <h1>Dashboard</h1>

            <p>
              Cargando información del sistema...
            </p>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <section className="page-heading">
          <div>
            <span className="eyebrow">
              SISTEMA DE RECONOCIMIENTO
            </span>

            <h1>Dashboard</h1>

            <p>{error}</p>
          </div>
        </section>
      </div>
    );
  }

  const personasActivas = personas.filter(
    (persona) => persona.activo
  ).length;

  const totalReconocimientos =
    estadisticas?.total_reconocimientos ?? 0;

  const coincidencias =
    estadisticas?.coincidencias ?? 0;

  const tasaCoincidencia =
    estadisticas?.tasa_coincidencia ?? 0;

  const similitudPromedio =
    estadisticas?.similitud_promedio ?? 0;

  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            SISTEMA DE RECONOCIMIENTO
          </span>

          <h1>Dashboard</h1>

          <p>
            Resumen general del sistema de
            reconocimiento facial.
          </p>
        </div>
      </section>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="eyebrow">
            PERSONAS
          </span>

          <h2>{personas.length}</h2>

          <p>
            {personasActivas} personas activas
          </p>
        </div>

        <div className="stat-card">
          <span className="eyebrow">
            RECONOCIMIENTOS
          </span>

          <h2>{totalReconocimientos}</h2>

          <p>
            Procesamientos registrados
          </p>
        </div>

        <div className="stat-card">
          <span className="eyebrow">
            COINCIDENCIAS
          </span>

          <h2>{coincidencias}</h2>

          <p>
            Reconocimientos identificados
          </p>
        </div>

        <div className="stat-card">
          <span className="eyebrow">
            TASA DE COINCIDENCIA
          </span>

          <h2>
            {(tasaCoincidencia * 100).toFixed(1)}%
          </h2>

          <p>
            Basado en los registros actuales
          </p>
        </div>
      </div>

      <div className="dashboard-card">
        <span className="eyebrow">
          MÉTRICAS DEL MODELO
        </span>

        <h2>Reconocimiento facial</h2>

        <div className="metrics-grid">
          <div>
            <span>Similitud promedio</span>

            <strong>
              {similitudPromedio.toFixed(4)}
            </strong>
          </div>

          <div>
            <span>Similitud máxima</span>

            <strong>
              {estadisticas?.similitud_maxima !== null &&
              estadisticas?.similitud_maxima !== undefined
                ? estadisticas.similitud_maxima.toFixed(4)
                : "-"}
            </strong>
          </div>

          <div>
            <span>Similitud mínima</span>

            <strong>
              {estadisticas?.similitud_minima !== null &&
              estadisticas?.similitud_minima !== undefined
                ? estadisticas.similitud_minima.toFixed(4)
                : "-"}
            </strong>
          </div>

          <div>
            <span>No coincidencias</span>

            <strong>
              {estadisticas?.no_coincidencias ?? 0}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

