import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Partida } from '../../interfaces/partida';

@Injectable({
  providedIn: 'root'
})
export class PartidaService {
  private apiUrl = 'http://localhost:3000/api/partidas/all';

  constructor(private http: HttpClient) {}

  getPartidas(): Observable<Partida[]> {
    return this.http.get<Partida[]>(this.apiUrl);
  }
}
