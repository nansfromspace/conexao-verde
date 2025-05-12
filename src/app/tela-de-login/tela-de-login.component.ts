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
  mensagemErro = '';

  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);

  fazerLogin() {
  this.mensagemErro = '';

  if (!this.email || !this.senha) {
    this.mensagemErro = 'Preencha todos os campos.';
    return;
  }

  signInWithEmailAndPassword(this.auth, this.email, this.senha)
    .then(() => {
      this.router.navigate(['/home']);
    })
    .catch((error) => {
  console.error('Código de erro Firebase:', error.code);
  switch (error.code) {
    case 'auth/invalid-email':
      this.mensagemErro = 'Formato de e-mail inválido.';
      break;
    case 'auth/user-not-found':
      this.mensagemErro = 'Usuário não encontrado. Que tal se cadastrar?';
      break;
    case 'auth/invalid-credential':
      this.mensagemErro = 'E-mail ou senha incorretos.';
      break;
    case 'auth/too-many-requests':
      this.mensagemErro = 'Muitas tentativas. Tente novamente mais tarde.';
      break;
    default:
      this.mensagemErro = 'Erro ao fazer login. Tente novamente, por favor.';
  }
});
}
}
