import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tela-de-login',
  standalone: true,
  templateUrl: './tela-de-login.component.html',
  styleUrls: ['./tela-de-login.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class TelaDeLoginComponent {
  email = '';
  senha = '';
  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);

  fazerLogin() {
    signInWithEmailAndPassword(this.auth, this.email, this.senha)
      .then(() => this.router.navigate(['/home']))
      .catch((error) => alert('Erro ao fazer login: ' + error.message));
  }
}
