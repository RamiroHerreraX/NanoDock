import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JuegoService, ResultadoJuego, OpcionJuego, EstadisticasGenerales, DetallePartida, } from '../../services/JuegoService/juego.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-juego',
    standalone: true,  // asegúrate si es standalone o no
  imports: [CommonModule, FormsModule, HttpClientModule],
    templateUrl: './juego.html',
  styleUrl: './juego.css'
})
export class Juego implements OnInit {

  resultadoActual: ResultadoJuego | null = null;
  puntuacionJugador = 0;
  puntuacionCPU = 0;
  rondasJugadas = 0;
  partidaTerminada = false;
  ganadorPartida: 'jugador' | 'cpu' | null = null;

  estadisticasGenerales: EstadisticasGenerales | null = null;
  historialReciente: DetallePartida[] = [];

  modalidades = [
    { id: 'mejor2de3', nombre: 'Mejor 2 de 3', rondasParaGanar: 2, descripcion: 'El primero en ganar 2 rondas gana' },
    { id: 'mejor3de5', nombre: 'Mejor 3 de 5', rondasParaGanar: 3, descripcion: 'El primero en ganar 3 rondas gana' },
    { id: 'mejor4de7', nombre: 'Mejor 4 de 7', rondasParaGanar: 4, descripcion: 'El primero en ganar 4 rondas gana' },
    { id: 'mejor5de9', nombre: 'Mejor 5 de 9', rondasParaGanar: 5, descripcion: 'El primero en ganar 5 rondas gana' }
  ];
  modalidadSeleccionada = this.modalidades[0];

  opcionesJuego: { nombre: OpcionJuego; emoji: string; icono: string }[] = [];

  constructor(private readonly juegoService: JuegoService) {}

  ngOnInit(): void {
    // Cargar opciones desde backend
    this.juegoService.obtenerOpciones().subscribe({
      next: opcionesBackend => {
        // Mapear nombres a minúsculas para consistencia con frontend
        this.opcionesJuego = opcionesBackend.map(o => {
          const nombreMinuscula = o.nombre.toLowerCase() as OpcionJuego;
          let emoji = '';
          let icono = '';
          switch (nombreMinuscula) {
            case 'piedra': emoji = '🪨'; icono = '✊'; break;
            case 'papel': emoji = '📄'; icono = '✋'; break;
            case 'tijera': emoji = '✂️'; icono = '✌️'; break;
          }
          return { nombre: nombreMinuscula, emoji, icono };
        });
      },
      error: err => console.error('Error al cargar opciones:', err)
    });

    this.actualizarEstadisticas();
  }

  actualizarEstadisticas(): void {
    // Obtener todas las partidas desde backend
    this.juegoService.obtenerPartidas().subscribe({
      next: partidasBackend => {
        this.historialReciente = partidasBackend
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          .slice(0, 3);

        // Aquí puedes calcular estadísticas generales desde backend o localmente
        this.estadisticasGenerales = this.calcularEstadisticasDesdeHistorial(this.historialReciente);
      },
      error: err => console.error('Error al obtener partidas:', err)
    });
  }

  private calcularEstadisticasDesdeHistorial(partidas: DetallePartida[]): EstadisticasGenerales {
    let victoriasJugador = 0;
    let victoriasCPU = 0;
    const contadorModalidades: Record<string, number> = {};

    partidas.forEach(p => {
      if (p.ganador === 'jugador') victoriasJugador++;
      else if (p.ganador === 'cpu') victoriasCPU++;

      contadorModalidades[p.modalidad] = (contadorModalidades[p.modalidad] || 0) + 1;
    });

    let modalidadFavorita = '';
    let maxPartidas = 0;
    Object.entries(contadorModalidades).forEach(([mod, count]) => {
      if (count > maxPartidas) {
        maxPartidas = count;
        modalidadFavorita = mod;
      }
    });

    const totalPartidas = partidas.length;
    const porcentajeExito = totalPartidas ? (victoriasJugador / totalPartidas) * 100 : 0;

    return {
      totalPartidas,
      victoriasJugador,
      victoriasCPU,
      porcentajeExito,
      modalidadFavorita: modalidadFavorita || 'Ninguna',
      ultimasPartidas: partidas
    };
  }

  cambiarModalidad(modalidadId: string): void {
    const modalidad = this.modalidades.find(m => m.id === modalidadId);
    if (modalidad) {
      this.modalidadSeleccionada = modalidad;
      this.reiniciarJuego();
      this.juegoService.iniciarPartida();
    }
  }

 seleccionarOpcion(eleccionJugador: string): void {
  if (this.partidaTerminada) return;

  if (!this.juegoService.esOpcionValida(eleccionJugador)) {
    console.error('Opción no válida:', eleccionJugador);
    return;
  }

  const eleccionCPU = this.juegoService.generarEleccionCPU();
  const id_opcion_usuario = this.getIdOpcion(eleccionJugador);
  const id_opcion_cpu = this.getIdOpcion(eleccionCPU);

  if (!id_opcion_usuario || !id_opcion_cpu) {
    console.error('No se encontró ID para opciones seleccionadas');
    return;
  }

  this.juegoService.calcularResultado(id_opcion_usuario, id_opcion_cpu).subscribe({
    next: (res) => {
      const resultadoStr = this.mapResultadoIdAString(res.id);
      this.resultadoActual = {
        jugador: eleccionJugador,
        cpu: eleccionCPU,
        ganador: resultadoStr
      };

      this.juegoService.crearPartida({
        id_opcion_usuario,
        id_opcion_cpu,
        id_resultado: res.id
      }).subscribe({
        next: () => {
          this.actualizarPuntuacion();
          this.rondasJugadas++;
          this.verificarFinPartida();
        },
        error: err => console.error('Error al crear partida:', err)
      });
    },
    error: err => console.error('Error al calcular resultado:', err)
  });
}


  private getIdOpcion(nombre: OpcionJuego): number | undefined {
    const opcion = this.opcionesJuego.find(o => o.nombre === nombre);
    // Asumiendo que tu backend tiene IDs: 1 para piedra, 2 para papel, 3 para tijera
    // Puedes guardar esos IDs en el arreglo opcionesJuego si quieres
    switch (nombre) {
      case 'piedra': return 1;
      case 'papel': return 2;
      case 'tijera': return 3;
    }
  }

  private mapResultadoIdAString(id_resultado: number): 'jugador' | 'cpu' | 'empate' {
    // Asumiendo resultados: 1=Victoria (usuario), 2=Derrota, 3=Empate
    switch (id_resultado) {
      case 1: return 'jugador';
      case 2: return 'cpu';
      case 3: return 'empate';
      default: return 'empate';
    }
  }

  private actualizarPuntuacion(): void {
    if (!this.resultadoActual) return;
    switch (this.resultadoActual.ganador) {
      case 'jugador': this.puntuacionJugador++; break;
      case 'cpu': this.puntuacionCPU++; break;
    }
  }

  private verificarFinPartida(): void {
    const rondasNecesarias = this.modalidadSeleccionada.rondasParaGanar;
    if (this.puntuacionJugador >= rondasNecesarias) {
      this.partidaTerminada = true;
      this.ganadorPartida = 'jugador';
      this.registrarResultadoPartida();
    } else if (this.puntuacionCPU >= rondasNecesarias) {
      this.partidaTerminada = true;
      this.ganadorPartida = 'cpu';
      this.registrarResultadoPartida();
    }
  }

  private registrarResultadoPartida(): void {
    if (!this.ganadorPartida) return;
    const puntuacionFinal = `${this.puntuacionJugador}-${this.puntuacionCPU}`;
    this.juegoService.registrarResultadoPartida(
      this.modalidadSeleccionada.nombre,
      this.ganadorPartida,
      puntuacionFinal,
      this.rondasJugadas
    );

    setTimeout(() => this.actualizarEstadisticas(), 500);
  }

  reiniciarJuego(): void {
    this.resultadoActual = null;
    this.puntuacionJugador = 0;
    this.puntuacionCPU = 0;
    this.rondasJugadas = 0;
    this.partidaTerminada = false;
    this.ganadorPartida = null;
    this.juegoService.iniciarPartida();
  }

  obtenerDatosOpcion(nombreOpcion: string) {
    return this.opcionesJuego.find(opcion => opcion.nombre === nombreOpcion);
  }

  obtenerMensajeResultado(): string {
    if (!this.resultadoActual) return '';
    if (this.partidaTerminada) {
      return this.ganadorPartida === 'jugador' ? '¡VICTORIA! Has ganado la partida 🏆' : '¡DERROTA! La CPU ha ganado la partida 🤖';
    }
    const mensajes = {
      'jugador': ['¡Felicidades! ¡Ganaste esta ronda!', '¡Excelente jugada!', '¡Bien hecho!'],
      'cpu': ['La CPU gana esta ronda', 'Mejor suerte la próxima vez', '¡Inténtalo de nuevo!'],
      'empate': ['¡Es un empate!', '¡Misma elección!', '¡Empate técnico!']
    };
    const arrayMensajes = mensajes[this.resultadoActual.ganador];
    const indiceAleatorio = Math.floor(Math.random() * arrayMensajes.length);
    return arrayMensajes[indiceAleatorio];
  }

  calcularPorcentajeVictorias(): string {
    if (this.rondasJugadas === 0) return '0';
    return ((this.puntuacionJugador / this.rondasJugadas) * 100).toFixed(1);
  }

  obtenerProgresoPartida(): string {
    return `${this.puntuacionJugador} - ${this.puntuacionCPU}`;
  }

  obtenerRondasRestantes(): number {
    const rondasNecesarias = this.modalidadSeleccionada.rondasParaGanar;
    const rondasRestantesJugador = rondasNecesarias - this.puntuacionJugador;
    const rondasRestantesCPU = rondasNecesarias - this.puntuacionCPU;
    return Math.min(rondasRestantesJugador, rondasRestantesCPU);
  }

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
