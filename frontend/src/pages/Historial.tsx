import { useEffect, useState } from "react";
import { api } from "../services/api";

interface RecognitionHistory {
  id: number;
  persona_id: number | null;
  persona_nombre: string | null;
  similitud: number;
  distancia: number | null;
  umbral: number;
  coincide: boolean;
  probabilidad_calibrada: number | null;
  created_at: string;
}

export default function Historial() {
  const [historial, setHistorial] =
    useState<RecognitionHistory[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        setCargando(true);
        setError(null);

        const response =
          await api.get<RecognitionHistory[]>(
            "/historial"
          );

        setHistorial(response.data);
      } catch (error) {
        console.error(error);

        setError(
          "No se pudo cargar el historial."
        );
      } finally {
        setCargando(false);
      }
    };

    void cargarHistorial();
  }, []);

  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            AUDITORÍA
          </span>

          <h1>Historial</h1>

          <p>
            Registro de reconocimientos realizados
            por el sistema.
          </p>
        </div>
      </section>

      <div className="dashboard-card">
        {cargando && (
          <p>
            Cargando historial...
          </p>
        )}

        {error && (
          <p>
            {error}
          </p>
        )}

        {!cargando &&
          !error &&
          historial.length === 0 && (
            <p>
              No existen reconocimientos registrados.
            </p>
          )}

        {!cargando &&
          !error &&
          historial.length > 0 && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Persona</th>
                    <th>Resultado</th>
                    <th>Similitud</th>
                    <th>Umbral</th>
                  </tr>
                </thead>

                <tbody>
                  {historial.map((registro) => (
                    <tr key={registro.id}>
                      <td>
                        {new Date(
                          registro.created_at
                        ).toLocaleString()}
                      </td>

                      <td>
                        {registro.persona_nombre ??
                          "No identificada"}
                      </td>

                      <td>
                        {registro.coincide
                          ? "Coincidencia"
                          : "Sin coincidencia"}
                      </td>

                      <td>
                        {registro.similitud.toFixed(4)}
                      </td>

                      <td>
                        {registro.umbral.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

