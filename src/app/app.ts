import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Nabvar } from './components/nabvar/nabvar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Nabvar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'NanoDock-Front';
}
