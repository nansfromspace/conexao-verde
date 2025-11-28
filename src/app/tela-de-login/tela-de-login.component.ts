import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
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
  private firestore: Firestore = inject(Firestore);

  fazerLogin() {
  this.mensagemErro = '';

  if (!this.email || !this.senha) {
    this.mensagemErro = 'Preencha todos os campos, por favor.';
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

  async loginComGoogle() {
    this.mensagemErro = '';
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;

      // Verificar se o usuário já existe no Firestore
      const docRef = doc(this.firestore, 'usuarios', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Usuário não cadastrado, fazer logout e mostrar mensagem
        await this.auth.signOut();
        this.mensagemErro = 'Você ainda não possui cadastro. Por favor, registre-se primeiro!';
        return;
      }

      this.router.navigate(['/home']);
    } catch (error: any) {
      console.error('Erro ao fazer login com Google:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        this.mensagemErro = 'Login cancelado.';
      } else if (error.code === 'auth/popup-blocked') {
        this.mensagemErro = 'Pop-up bloqueado. Permita pop-ups para fazer login.';
      } else {
        this.mensagemErro = 'Erro ao fazer login com Google. Tente novamente.';
      }
    }
  }
}
