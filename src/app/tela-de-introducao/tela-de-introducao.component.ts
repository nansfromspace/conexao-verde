import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tela-de-introducao',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tela-de-introducao.component.html',
  styleUrls: ['./tela-de-introducao.component.css']
})
export class TelaDeIntroducaoComponent {
  constructor(private router: Router) {}

  irParaLogin() {
    this.router.navigate(['/login']);
  }
}
