import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface ResultadoJuego {
  jugador: string;
  cpu: string;
  ganador: 'jugador' | 'cpu' | 'empate';
}

// Definir un tipo para las opciones válidas
export type OpcionJuego = 'piedra' | 'papel' | 'tijera';

// Interface para las estadísticas del juego
export interface EstadisticasJuego {
  victoriasJugador: number;
  victoriasCPU: number;
  empates: number;
  rondasTotales: number;
  porcentajeVictorias: number;
}

// Interface para los detalles de una partida
export interface DetallePartida {
  id: string;
  modalidad: string;
  ganador: 'jugador' | 'cpu';
  puntuacionFinal: string;
  rondasJugadas: number;
  fecha: Date;
  duracion?: number; // en segundos
}

// Interface para las estadísticas generales
export interface EstadisticasGenerales {
  totalPartidas: number;
  victoriasJugador: number;
  victoriasCPU: number;
  porcentajeExito: number;
  modalidadFavorita: string;
  ultimasPartidas: DetallePartida[];
}

@Injectable({
  providedIn: 'root'
})
export class JuegoService {

  private apiUrl = 'http://localhost:3000/api'; // Cambia esta URL si usas otro host/puerto

  // Inyectar HttpClient para hacer peticiones HTTP

  /*** Endpoints backend ***/

  obtenerOpciones(): Observable<{ id: number; nombre: string }[]> {
    return this.http.get<{ id: number; nombre: string }[]>(`${this.apiUrl}/opciones/all`);
  }

  // Resultados
  obtenerResultados(): Observable<{ id: number; nombre: string }[]> {
    return this.http.get<{ id: number; nombre: string }[]>(`${this.apiUrl}/resultados/all`);
  }

  crearResultado(nombre: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resultados/`, { nombre });
  }

  // Partidas
  obtenerPartidas(): Observable<DetallePartida[]> {
    return this.http.get<DetallePartida[]>(`${this.apiUrl}/partidas/all`);
  }

  obtenerPartidaPorId(id: string): Observable<DetallePartida> {
    return this.http.get<DetallePartida>(`${this.apiUrl}/partidas/part/${id}`);
  }

  crearPartida(data: { id_opcion_usuario: number; id_opcion_cpu: number, id_resultado: number; }): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/`, data);
  }

  actualizarPartida(id: string, data: { id_opcion_usuario: number; id_opcion_cpu: number; id_resultado: number }): Observable<any> {
    return this.http.put(`${this.apiUrl}/partidas/up/${id}`, data);
  }

  eliminarPartida(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/partidas/del/${id}`);
  }

  calcularResultado(idUsuario: number, idCpu: number): Observable<{ id: number }> {
    const body = { idUsuario, idCpu };
    return this.http.post<{ id: number }>(`${this.apiUrl}/partidas/calcular`, body);
  }

  // Opciones disponibles del juego (con tipado fuerte)
  private readonly opciones: OpcionJuego[] = ['piedra', 'papel', 'tijera'];

  // Historial de partidas
  private readonly historialPartidas: DetallePartida[] = [];

  // Tiempo de inicio de la partida actual
  private tiempoInicioPartida: number | null = null;

  /**
   * Inicia el temporizador para una nueva partida
   */
  iniciarPartida(): void {
    this.tiempoInicioPartida = Date.now();
  }

  /**
   * Genera una elección aleatoria para la CPU
   * @returns OpcionJuego - La elección de la CPU (piedra, papel o tijera)
   */
  generarEleccionCPU(): OpcionJuego {
    const indiceAleatorio = Math.floor(Math.random() * this.opciones.length);
    return this.opciones[indiceAleatorio];
  }

  /**
   * Determina el ganador de la ronda
   * @param eleccionJugador - La elección del jugador
   * @param eleccionCPU - La elección de la CPU
   * @returns string - El ganador ('jugador', 'cpu' o 'empate')
   */
  determinarGanador(eleccionJugador: OpcionJuego, eleccionCPU: OpcionJuego): 'jugador' | 'cpu' | 'empate' {
    // Si ambas elecciones son iguales, es empate
    if (eleccionJugador === eleccionCPU) {
      return 'empate';
    }

    // Condiciones de victoria para el jugador (tipado fuerte)
    const condicionesVictoria: Record<OpcionJuego, OpcionJuego> = {
      'piedra': 'tijera',    // Piedra vence a tijera
      'papel': 'piedra',     // Papel vence a piedra
      'tijera': 'papel'      // Tijera vence a papel
    };

    // Verificar si el jugador gana (ahora TypeScript sabe que es seguro)
    if (condicionesVictoria[eleccionJugador] === eleccionCPU) {
      return 'jugador';
    } else {
      return 'cpu';
    }
  }

  /**
   * Juega una ronda completa
   * @param eleccionJugador - La elección del jugador
   * @returns ResultadoJuego - El resultado completo de la ronda
   */
  jugarRonda(eleccionJugador: OpcionJuego): ResultadoJuego {
    // Iniciar el temporizador si es la primera ronda
    if (this.tiempoInicioPartida === null) {
      this.iniciarPartida();
    }

    const eleccionCPU = this.generarEleccionCPU();
    const ganador = this.determinarGanador(eleccionJugador, eleccionCPU);

    return {
      jugador: eleccionJugador,
      cpu: eleccionCPU,
      ganador: ganador
    };
  }

  /**
   * Valida si una opción es válida
   * @param opcion - La opción a validar
   * @returns boolean - True si la opción es válida
   */
  esOpcionValida(opcion: string): opcion is OpcionJuego {
    return this.opciones.includes(opcion as OpcionJuego);
  }

  /**
   * Obtiene las opciones disponibles del juego
   * @returns OpcionJuego[] - Array con las opciones (piedra, papel, tijera)
   */

  /**
   * Registra el resultado de una partida completa en el historial
   * @param modalidad - La modalidad de juego (ej: "Mejor 2 de 3")
   * @param ganador - El ganador de la partida ('jugador' o 'cpu')
   * @param puntuacionFinal - Resultado final (ej: "2-1")
   * @param rondasJugadas - Número total de rondas jugadas
   */
  registrarResultadoPartida(modalidad: string, ganador: 'jugador' | 'cpu', puntuacionFinal: string, rondasJugadas: number): void {
    // Calcular la duración de la partida
    const duracion = this.tiempoInicioPartida
      ? Math.floor((Date.now() - this.tiempoInicioPartida) / 1000)
      : 0;

    // Crear un identificador único para la partida
    const id = `partida_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Crear el objeto de detalle de partida
    const detallePartida: DetallePartida = {
      id,
      modalidad,
      ganador,
      puntuacionFinal,
      rondasJugadas,
      fecha: new Date(),
      duracion
    };

    // Guardar en el historial
    this.historialPartidas.push(detallePartida);

    // Guardar en localStorage (persistencia)
    this.guardarHistorialEnLocalStorage();

    // Reiniciar el temporizador
    this.tiempoInicioPartida = null;

    // Para simplificar, solo guardamos las últimas 20 partidas
    if (this.historialPartidas.length > 20) {
      this.historialPartidas.shift();
    }

    console.log(`Partida registrada: ${ganador} ganó en modalidad ${modalidad} con resultado ${puntuacionFinal}`);
  }

  /**
   * Guarda el historial en localStorage para persistencia
   */
  private guardarHistorialEnLocalStorage(): void {
    try {
      localStorage.setItem('nanodock_historial_partidas', JSON.stringify(this.historialPartidas));
    } catch (error) {
      console.error('Error al guardar historial en localStorage:', error);
    }
  }

  /**
   * Carga el historial desde localStorage al iniciar el servicio
   */
  private cargarHistorialDesdeLocalStorage(): void {
    try {
      const historialGuardado = localStorage.getItem('nanodock_historial_partidas');
      if (historialGuardado) {
        // Convertir las fechas de string a Date
        const partidas = JSON.parse(historialGuardado) as DetallePartida[];
        partidas.forEach(partida => {
          partida.fecha = new Date(partida.fecha);
          this.historialPartidas.push(partida);
        });
      }
    } catch (error) {
      console.error('Error al cargar historial desde localStorage:', error);
    }
  }

  /**
   * Obtiene el historial completo de partidas
   * @returns Array con el historial de partidas
   */
  obtenerHistorialPartidas(): DetallePartida[] {
    return [...this.historialPartidas];
  }

  /**
   * Obtiene las últimas partidas jugadas
   * @param cantidad - Cantidad de partidas a obtener
   * @returns Array con las últimas partidas
   */
  obtenerUltimasPartidas(cantidad: number = 5): DetallePartida[] {
    return this.historialPartidas
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, cantidad);
  }

  /**
   * Obtiene estadísticas generales sobre todas las partidas jugadas
   * @returns Objeto con estadísticas generales
   */
  obtenerEstadisticasGenerales(): EstadisticasGenerales {
    // Inicializar contadores
    let victoriasJugador = 0;
    let victoriasCPU = 0;
    const contadorModalidades: Record<string, number> = {};

    // Analizar historial
    this.historialPartidas.forEach(partida => {
      // Contar victorias
      if (partida.ganador === 'jugador') {
        victoriasJugador++;
      } else {
        victoriasCPU++;
      }

      // Contar modalidades
      contadorModalidades[partida.modalidad] = (contadorModalidades[partida.modalidad] || 0) + 1;
    });

    // Encontrar modalidad más jugada
    let modalidadFavorita = '';
    let maxPartidas = 0;
    Object.entries(contadorModalidades).forEach(([modalidad, cantidad]) => {
      if (cantidad > maxPartidas) {
        maxPartidas = cantidad;
        modalidadFavorita = modalidad;
      }
    });

    // Calcular porcentaje de éxito
    const totalPartidas = this.historialPartidas.length;
    const porcentajeExito = totalPartidas > 0
      ? (victoriasJugador / totalPartidas) * 100
      : 0;

    // Devolver estadísticas
    return {
      totalPartidas,
      victoriasJugador,
      victoriasCPU,
      porcentajeExito,
      modalidadFavorita: modalidadFavorita || 'Ninguna',
      ultimasPartidas: this.obtenerUltimasPartidas()
    };
  }

  /**
   * Constructor del servicio - cargar datos guardados al iniciar
   */
  constructor(private http: HttpClient) {
    this.cargarHistorialDesdeLocalStorage();
  }
}
