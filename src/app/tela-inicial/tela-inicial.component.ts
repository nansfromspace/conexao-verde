import { Component, inject, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { BottomNavComponent } from '../shared/bottom-nav/bottom-nav.component';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tela-inicial',
  standalone: true,
  templateUrl: './tela-inicial.component.html',
  styleUrls: ['./tela-inicial.component.css'],
  imports: [
    FontAwesomeModule,
    TopNavComponent,
    BottomNavComponent,
    RouterModule
  ]
})
export class TelaInicialComponent implements OnInit {
  title = 'conexao-verde';
  nomeUsuario: string = '';

  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);

  async ngOnInit() {
    const usuarioAtual = this.auth.currentUser;

    if (usuarioAtual) {
      const docRef = doc(this.firestore, 'usuarios', usuarioAtual.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const dados = docSnap.data();
        this.nomeUsuario = dados['apelido'] || dados['nome'] || '🌱';
      } else {
        console.log('Documento do usuário não encontrado.');
      }
    } else {
      console.log('Nenhum usuário autenticado.');
    }
  }
}
