import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, doc, getDoc, getDocs, updateDoc, arrayRemove } from '@angular/fire/firestore';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { BottomNavComponent } from '../shared/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-tela-de-favoritos',
  standalone: true,
  imports: [CommonModule, RouterModule, TopNavComponent, BottomNavComponent],
  templateUrl: './tela-de-favoritos.component.html',
  styleUrls: ['./tela-de-favoritos.component.css']
})
export class TelaDeFavoritosComponent implements OnInit {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  
  projetosFavoritos: any[] = [];
  carregando = true;
  usuarioLogado = false;

  async ngOnInit() {
    const user = this.auth.currentUser;
    
    if (!user) {
      this.usuarioLogado = false;
      this.carregando = false;
      return;
    }

    this.usuarioLogado = true;
    await this.carregarFavoritos(user.uid);
  }

  async carregarFavoritos(userId: string) {
    try {
      // Buscar favoritos do usuário
      const userDocRef = doc(this.firestore, 'usuarios', userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        this.carregando = false;
        return;
      }

      const favoritos = userDoc.data()['favoritos'] || [];

      if (favoritos.length === 0) {
        this.carregando = false;
        return;
      }

      // Buscar todos os projetos das ONGs
      const ongsRef = collection(this.firestore, 'ongs');
      const snapshot = await getDocs(ongsRef);

      snapshot.forEach((docSnap) => {
        const ongData = docSnap.data();
        const nomeOng = ongData['nome'];
        const contatoOng = ongData['contato'];
        const atividades = ongData['atividades'];

        atividades.forEach((atividade: any, index: number) => {
          const projetoId = `${docSnap.id}_${index}`;
          
          // Verificar se está nos favoritos
          if (favoritos.includes(projetoId)) {
            const projeto = {
              id: projetoId,
              nome: atividade.nome,
              endereco: atividade.local,
              horario: atividade.horario,
              nomeOng: nomeOng,
              contatoOng: contatoOng,
              coordenadas: atividade.coordenadas,
              tipo: atividade.tipo?.toLowerCase() || 'outros'
            };

            this.projetosFavoritos.push(projeto);
          }
        });
      });

      this.carregando = false;
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      this.carregando = false;
    }
  }

  async desfavoritar(projetoId: string) {
    const user = this.auth.currentUser;
    if (!user) return;

    try {
      const userDocRef = doc(this.firestore, 'usuarios', user.uid);
      const { arrayRemove, updateDoc } = await import('@angular/fire/firestore');
      
      await updateDoc(userDocRef, {
        favoritos: arrayRemove(projetoId)
      });

      // Remover da lista local
      this.projetosFavoritos = this.projetosFavoritos.filter(p => p.id !== projetoId);
    } catch (error) {
      console.error('Erro ao desfavoritar:', error);
      alert('Erro ao desfavoritar projeto.');
    }
  }
}
