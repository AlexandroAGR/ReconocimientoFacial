export interface RecognitionResult {
  success: boolean;
  persona_id: number | null;
  nombre: string | null;
  similitud: number | null;
  distancia: number | null;
  umbral: number;
  coincide: boolean;
  probabilidad_calibrada: number | null;
  confianza: string | null;
  det_score: number;
}

export interface ProbabilityStats {
  total_reconocimientos: number;
  coincidencias: number;
  no_coincidencias: number;
  tasa_coincidencia: number;
  similitud_promedio: number;
  similitud_maxima: number | null;
  similitud_minima: number | null;
  probabilidad_calibrada_promedio: number | null;
  umbral_mas_usado: number | null;
}

export interface CalibrationPoint {
  similitud: number;
  probabilidad: number;
}

export interface PredictionRequest {
  similitud: number;
  distancia?: number | null;
  umbral: number;
}

export interface PredictionResponse {
  similitud: number;
  distancia: number | null;
  umbral: number;
  coincide: boolean;
  probabilidad_calibrada: number;
  confianza: string;
}

export type NivelCalidad = "alta" | "media" | "baja";

export interface TrainingRecordInput {
  similitud: number;
  distancia?: number | null;
  calidad_imagen: NivelCalidad;
  iluminacion: NivelCalidad;
  resultado_real: boolean;
}

export interface TrainingRecord extends TrainingRecordInput {
  id: number;
  created_at: string;
}

export interface ConfusionMatrix {
  verdaderos_positivos: number;
  falsos_positivos: number;
  verdaderos_negativos: number;
  falsos_negativos: number;
}

export interface TrainingMetrics {
  entrenado: boolean;
  total_registros: number;
  registros_entrenamiento: number;
  registros_prueba: number;
  precision: number | null;
  recall: number | null;
  f1_score: number | null;
  tasa_falsos_positivos: number | null;
  tasa_falsos_negativos: number | null;
  matriz_confusion: ConfusionMatrix | null;
  trained_at: string | null;
  mensaje: string | null;
}