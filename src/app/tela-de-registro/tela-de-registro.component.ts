import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-tela-de-registro',
  standalone: true,
  templateUrl: './tela-de-registro.component.html',
  styleUrls: ['./tela-de-registro.component.css'],
  imports: [CommonModule, FormsModule]
})
export class TelaDeRegistroComponent {
  nome = '';
  apelido = '';
  email = '';
  senha = '';
  confirmarSenha = '';
  erroSenha = '';
  erroCampos = '';
  erroEmail = '';
  mensagemSucesso = '';

  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);
  private firestore: Firestore = inject(Firestore);

  registrar() {
    this.erroSenha = '';
    this.erroCampos = '';
    this.erroEmail = '';
    this.mensagemSucesso = '';

    if (!this.nome || !this.apelido || !this.email || !this.senha || !this.confirmarSenha) {
      this.erroCampos = 'Preencha todos os campos, por favor.';
      return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValido.test(this.email)) {
      this.erroEmail = 'E-mail inválido. Poderia reescrevê-lo?';
      return;
    }

    if (this.senha !== this.confirmarSenha) {
      this.erroSenha = 'Ops! As senhas não são iguais. Poderia verificar?';
      return;
    }

    createUserWithEmailAndPassword(this.auth, this.email, this.senha)
      .then(async (userCredential) => {
        const user = userCredential.user;
        console.log('Usuário registrado:', user);

        await setDoc(doc(this.firestore, 'usuarios', user.uid), {
          nome: this.nome,
          apelido: this.apelido
        });

        this.mensagemSucesso = 'Registro efetuado com sucesso!';
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1500);
      })
      .catch((error) => {
        console.error('Erro ao registrar:', error);

        if (error.code === 'auth/email-already-in-use') {
          this.erroEmail = 'Este e-mail já está registrado. Faça o login. :) ';
        } else if (error.code === 'auth/weak-password') {
          this.erroSenha = 'A senha deve ter no mínimo 6 caracteres. Que tal criar uma senha mais forte?';
        } else {
          this.erroCampos = 'Ops! Ocorreu um erro. Tente novamente.';
        }
      });
  }
}
