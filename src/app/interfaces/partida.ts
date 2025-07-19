export interface Partida {
  id: number;
  fecha: string;
  eleccion_usuario: string;
  eleccion_cpu: string;
  resultado: 'Victoria' | 'Derrota' | 'Empate';
}