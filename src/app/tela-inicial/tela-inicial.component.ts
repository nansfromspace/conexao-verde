import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { BottomNavComponent } from '../shared/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-tela-inicial',
  standalone: true,
  templateUrl: './tela-inicial.component.html',
  styleUrls: ['./tela-inicial.component.css'],
  imports: [
    FontAwesomeModule,
    TopNavComponent,
    BottomNavComponent
  ]
})
export class TelaInicialComponent {
  title = 'conexao-verde';
}
