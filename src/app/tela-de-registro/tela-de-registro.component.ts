import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';

@Component({
  selector: 'app-tela-de-registro',
  standalone: true,
  templateUrl: './tela-de-registro.component.html',
  styleUrls: ['./tela-de-registro.component.css'],
  imports: [CommonModule, FormsModule]
})
export class TelaDeRegistroComponent {
  nome = '';
  email = '';
  senha = '';
  confirmarSenha = '';
  erroSenha = '';
  erroCampos = '';
  erroEmail = '';
  mensagemSucesso = '';


  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);

  registrar() {
    this.erroSenha = '';
    this.erroCampos = '';
    this.erroEmail = '';
    this.mensagemSucesso = '';

    // Aqui faz a validação dos campos obrigatórios
    if (!this.nome || !this.email || !this.senha || !this.confirmarSenha) {
      this.erroCampos = 'Preencha todos os campos, por favor.';
      return;
    }

    // Aqui faz a validação do formato de email
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValido.test(this.email)) {
      this.erroEmail = 'E-mail inválido. Poderia reescrevê-lo?';
      return;
    }

    // Aqui faz a validação se a senhas iguais
    if (this.senha !== this.confirmarSenha) {
      this.erroSenha = 'Ops! As senhas não são iguais. Poderia verificar?';
      return;
    }

    // Aqui faz o registro com o firebase auth
    createUserWithEmailAndPassword(this.auth, this.email, this.senha)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('Usuário registrado:', user);
        this.mensagemSucesso = '🎉 Registro efetuado com sucesso!';

        // nessa parte redireciona para a home depois de 1.5 segundos
        // para dar tempo de ler a mensagem de sucesso
        // também tem alguns erros tratados e o não tratado abaixo. :)
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