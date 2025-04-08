import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TopNavComponent } from './shared/top-nav/top-nav.component';
import { BottomNavComponent } from './shared/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    FontAwesomeModule,
    TopNavComponent,
    BottomNavComponent
  ]
})
export class AppComponent {
  title = 'conexao-verde';
}
