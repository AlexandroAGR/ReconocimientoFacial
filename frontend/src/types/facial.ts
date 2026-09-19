export interface RecognitionResult {
  success: boolean;
  persona_id: number | null;
  nombre: string | null;
  similitud: number | null;
  distancia: number | null;
  umbral: number;
  coincide: boolean;
  det_score: number;
}