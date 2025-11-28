import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, getDocs, addDoc, serverTimestamp, query, orderBy } from '@angular/fire/firestore';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { BottomNavComponent } from '../shared/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-tela-de-depoimentos',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavComponent, BottomNavComponent],
  templateUrl: './tela-de-depoimentos.component.html',
  styleUrls: ['./tela-de-depoimentos.component.css']
})
export class TelaDeDepoimentosComponent implements OnInit {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);

  depoimentos: any[] = [];
  carregando = true;
  modalAberto = false;

  // Formulário
  novoDepoimento = {
    texto: '',
    estrelas: 0
  };

  estrelasHover = 0;

  async ngOnInit() {
    await this.carregarDepoimentos();
  }

  async carregarDepoimentos() {
    try {
      const depoimentosRef = collection(this.firestore, 'depoimentos');
      const q = query(depoimentosRef, orderBy('data', 'desc'));
      const snapshot = await getDocs(q);

      this.depoimentos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      this.carregando = false;
    } catch (error) {
      console.error('Erro ao carregar depoimentos:', error);
      this.carregando = false;
    }
  }

  abrirModal() {
    const user = this.auth.currentUser;
    
    if (!user) {
      alert('Faça login para deixar seu depoimento!');
      return;
    }

    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
    this.novoDepoimento = {
      texto: '',
      estrelas: 0
    };
    this.estrelasHover = 0;
  }

  selecionarEstrela(estrela: number) {
    this.novoDepoimento.estrelas = estrela;
  }

  setHoverEstrela(estrela: number) {
    this.estrelasHover = estrela;
  }

  limparHover() {
    this.estrelasHover = 0;
  }

  async enviarDepoimento() {
    const user = this.auth.currentUser;

    if (!user) {
      alert('Faça login para deixar seu depoimento!');
      return;
    }

    if (!this.novoDepoimento.texto.trim()) {
      alert('Por favor, escreva seu depoimento.');
      return;
    }

    if (this.novoDepoimento.estrelas === 0) {
      alert('Por favor, selecione quantas estrelas você dá!');
      return;
    }

    try {
      const depoimentosRef = collection(this.firestore, 'depoimentos');
      
      const novoDoc = {
        userId: user.uid,
        nome: user.displayName || 'Usuário',
        texto: this.novoDepoimento.texto,
        estrelas: this.novoDepoimento.estrelas,
        data: serverTimestamp()
      };

      await addDoc(depoimentosRef, novoDoc);

      alert('Depoimento enviado com sucesso! 🌱');
      this.fecharModal();
      await this.carregarDepoimentos();
    } catch (error) {
      console.error('Erro ao enviar depoimento:', error);
      alert('Erro ao enviar depoimento. Tente novamente.');
    }
  }

  getArrayEstrelas(numero: number): number[] {
    return Array(numero).fill(0);
  }

  getArrayEstrelasVazias(numero: number): number[] {
    return Array(5 - numero).fill(0);
  }

  formatarData(timestamp: any): string {
    if (!timestamp) return '';
    
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const agora = new Date();
    const diferenca = agora.getTime() - data.getTime();
    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));

    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Ontem';
    if (dias < 7) return `${dias} dias atrás`;
    if (dias < 30) return `${Math.floor(dias / 7)} semanas atrás`;
    if (dias < 365) return `${Math.floor(dias / 30)} meses atrás`;
    return `${Math.floor(dias / 365)} anos atrás`;
  }

  getIconeAleatorio(id: string): string {
    const icones = [
      'fa-solid fa-seedling',
      'fa-solid fa-leaf',
      'fa-solid fa-tree',
      'fa-solid fa-spa',
      'fa-solid fa-clover'
    ];
    
    // Usar o ID para sempre retornar o mesmo ícone para o mesmo depoimento
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % icones.length;
    return icones[index];
  }
}
