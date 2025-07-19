import { Component, OnInit } from '@angular/core';
import { Partida } from '../../interfaces/partida';
import { PartidaService } from '../../services/partida/partida.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-home',
  standalone: true,  // asegúrate si es standalone o no
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit {
  partidas: Partida[] = [];
  partidasFiltradas: Partida[] = [];
  filtro: string = 'Todos';

  constructor(private partidaService: PartidaService) {}

  ngOnInit(): void {
    this.partidaService.getPartidas().subscribe(data => {
      this.partidas = data;
      this.filtrarPartidas();
    });
  }

  filtrarPartidas(): void {
    if (this.filtro === 'Todos') {
      this.partidasFiltradas = this.partidas;
    } else {
      this.partidasFiltradas = this.partidas.filter(p => p.resultado === this.filtro);
    }
  }
}
