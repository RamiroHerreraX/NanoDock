import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Juego } from './components/juego/juego';

export const routes: Routes = [
    {path: '', component:Home},
    {path: 'juego', component: Juego},
    {path: '**', redirectTo: ''}
];
