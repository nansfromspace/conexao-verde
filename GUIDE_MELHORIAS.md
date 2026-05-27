# 🚀 Guia de Melhorias - Conexão Verde

## 📋 Sumário de Recomendações

1. **Tipagem TypeScript** - Criar interfaces reutilizáveis
2. **Camada de Serviços** - Separar lógica de Firebase dos componentes
3. **Tratamento de Erros** - Melhorar tratamento e feedback ao usuário
4. **Real-time Listeners** - Implementar sincronização em tempo real
5. **Otimizações de Performance** - Componentes lazy, cache, paginação
6. **Segurança** - Validações no frontend e regras Firestore
7. **Testes** - Unit e E2E com Jasmine/Karma

---

## 1️⃣ Criação de Interfaces TypeScript

### 📁 Estrutura Recomendada

```
src/app/
├── models/
│   ├── projeto.interface.ts
│   ├── usuario.interface.ts
│   ├── depoimento.interface.ts
│   ├── ong.interface.ts
│   └── index.ts (barrel export)
├── services/
│   ├── projetos.service.ts
│   ├── usuarios.service.ts
│   ├── depoimentos.service.ts
│   ├── favoritos.service.ts
│   └── auth.service.ts
└── ...
```

### 📄 `models/projeto.interface.ts`

```typescript
export interface Coordenadas {
  latitude: number;
  longitude: number;
}

export interface Projeto {
  id: string;                              // "{ongId}_{index}"
  nome: string;
  endereco: string;
  horario: string;
  nomeOng: string;
  contatoOng: string;
  coordenadas: Coordenadas;
  tipo: TipoProjeto;
  diasSemana: DiaSemana[];
}

export interface Atividade {
  nome: string;
  local: string;
  horario: string;
  tipo: TipoProjeto;
  diasSemana: DiaSemana[];
  coordenadas: Coordenadas;
}

export interface ONG {
  id: string;
  nome: string;
  contato: string;
  atividades: Atividade[];
}

export enum TipoProjeto {
  PLANTAR = 'plantar',
  LIMPEZA = 'limpeza de espaços',
  OUTROS = 'outros'
}

export enum DiaSemana {
  SEGUNDA = 'segunda',
  TERCA = 'terca',
  QUARTA = 'quarta',
  QUINTA = 'quinta',
  SEXTA = 'sexta',
  SABADO = 'sabado',
  DOMINGO = 'domingo'
}

export interface FiltrosProjeto {
  tipos: TipoProjeto[];
  diasSemana: DiaSemana[];
  localizacao: {
    tipo: 'nenhum' | 'perto' | 'manual';
    endereco?: string;
    distanciaKm?: number;
  };
}
```

### 📄 `models/usuario.interface.ts`

```typescript
export interface Usuario {
  uid: string;
  nome: string;
  apelido: string;
  email?: string;
  favoritos: string[];
  dataCriacao?: Date;
  ultimaAtualizacao?: Date;
}

export interface DadosRegistro {
  nome: string;
  apelido: string;
  email: string;
  senha: string;
}

export interface UsuarioAuth {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}
```

### 📄 `models/depoimento.interface.ts`

```typescript
export interface Depoimento {
  id: string;
  userId: string;
  nome: string;
  texto: string;
  estrelas: number;  // 1-5
  data: Date;
}

export interface NovoDepoimento {
  texto: string;
  estrelas: number;
}

export interface DepoimentoDTO {
  userId: string;
  nome: string;
  texto: string;
  estrelas: number;
  data: Timestamp;  // Firebase serverTimestamp()
}
```

### 📄 `models/index.ts` (Barrel Export)

```typescript
export * from './projeto.interface';
export * from './usuario.interface';
export * from './depoimento.interface';
```

---

## 2️⃣ Serviços para Separação de Responsabilidades

### 📄 `services/projetos.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, query, where, QueryConstraint } from '@angular/fire/firestore';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Projeto, ONG, TipoProjeto, DiaSemana } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProjetosService {
  private firestore = inject(Firestore);
  
  private projetosSubject = new BehaviorSubject<Projeto[]>([]);
  public projetos$ = this.projetosSubject.asObservable();

  /**
   * Carrega todos os projetos de todas as ONGs
   */
  async carregarProjetos(): Promise<Projeto[]> {
    try {
      const ongsRef = collection(this.firestore, 'ongs');
      const snapshot = await getDocs(ongsRef);

      const projetos: Projeto[] = [];

      snapshot.forEach((docSnap) => {
        const ongData = docSnap.data() as ONG;
        const nomeOng = ongData['nome'];
        const contatoOng = ongData['contato'];
        const atividades = ongData['atividades'] || [];

        atividades.forEach((atividade: any, index: number) => {
          const projeto: Projeto = {
            id: `${docSnap.id}_${index}`,
            nome: atividade.nome,
            endereco: atividade.local,
            horario: atividade.horario,
            nomeOng,
            contatoOng,
            coordenadas: atividade.coordenadas,
            tipo: this.normalizarTipo(atividade.tipo),
            diasSemana: atividade.diasSemana || []
          };

          projetos.push(projeto);
        });
      });

      this.projetosSubject.next(projetos);
      return projetos;
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      throw error;
    }
  }

  /**
   * Filtra projetos com múltiplos critérios
   */
  filtrarProjetos(
    tipos?: TipoProjeto[],
    diasSemana?: DiaSemana[],
    longitude?: number,
    latitude?: number,
    distanciaKm?: number
  ): Promise<Projeto[]> {
    let projetos = this.projetosSubject.value;

    // Filtro por tipo
    if (tipos && tipos.length > 0) {
      projetos = projetos.filter(p => tipos.includes(p.tipo));
    }

    // Filtro por dia da semana
    if (diasSemana && diasSemana.length > 0) {
      projetos = projetos.filter(p =>
        p.diasSemana.some(dia => diasSemana.includes(dia as DiaSemana))
      );
    }

    // Filtro por distância
    if (longitude && latitude && distanciaKm) {
      projetos = projetos.filter(p => {
        const distancia = this.calcularDistancia(
          latitude, longitude,
          p.coordenadas.latitude, p.coordenadas.longitude
        );
        return distancia <= distanciaKm;
      });
    }

    return Promise.resolve(projetos);
  }

  /**
   * Busca projeto por ID
   */
  async obterProjetoPorId(projetoId: string): Promise<Projeto | undefined> {
    return this.projetosSubject.value.find(p => p.id === projetoId);
  }

  /**
   * Calcula distância entre dois pontos (Haversine)
   */
  private calcularDistancia(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Normaliza tipo de projeto
   */
  private normalizarTipo(tipo: string): TipoProjeto {
    const tipo_lower = tipo?.toLowerCase() || '';
    
    if (tipo_lower === 'plantar') return TipoProjeto.PLANTAR;
    if (tipo_lower === 'limpeza de espaços') return TipoProjeto.LIMPEZA;
    
    return TipoProjeto.OUTROS;
  }
}
```

### 📄 `services/favoritos.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoritosService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private favoritosSubject = new BehaviorSubject<string[]>([]);
  public favoritos$ = this.favoritosSubject.asObservable();

  /**
   * Carrega favoritos do usuário logado
   */
  async carregarFavoritos(): Promise<string[]> {
    const user = this.auth.currentUser;
    
    if (!user) {
      this.favoritosSubject.next([]);
      return [];
    }

    try {
      const userDocRef = doc(this.firestore, 'usuarios', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        this.favoritosSubject.next([]);
        return [];
      }

      const favoritos = userDoc.data()['favoritos'] || [];
      this.favoritosSubject.next(favoritos);
      return favoritos;
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      throw error;
    }
  }

  /**
   * Adiciona projeto aos favoritos
   */
  async adicionarFavorito(projetoId: string): Promise<void> {
    const user = this.auth.currentUser;
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const userDocRef = doc(this.firestore, 'usuarios', user.uid);

    try {
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Criar documento se não existir
        await setDoc(userDocRef, {
          favoritos: [projetoId]
        }, { merge: true });
      } else {
        // Adicionar ao array existente
        await updateDoc(userDocRef, {
          favoritos: arrayUnion(projetoId)
        });
      }

      // Atualizar BehaviorSubject
      const atuais = this.favoritosSubject.value;
      if (!atuais.includes(projetoId)) {
        this.favoritosSubject.next([...atuais, projetoId]);
      }
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      throw error;
    }
  }

  /**
   * Remove projeto dos favoritos
   */
  async removerFavorito(projetoId: string): Promise<void> {
    const user = this.auth.currentUser;
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const userDocRef = doc(this.firestore, 'usuarios', user.uid);

    try {
      await updateDoc(userDocRef, {
        favoritos: arrayRemove(projetoId)
      });

      // Atualizar BehaviorSubject
      const atuais = this.favoritosSubject.value.filter(id => id !== projetoId);
      this.favoritosSubject.next(atuais);
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      throw error;
    }
  }

  /**
   * Verifica se um projeto é favorito
   */
  ehFavorito(projetoId: string): boolean {
    return this.favoritosSubject.value.includes(projetoId);
  }
}
```

### 📄 `services/depoimentos.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
import { Depoimento, NovoDepoimento } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DepoimentosService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private depoimentosSubject = new BehaviorSubject<Depoimento[]>([]);
  public depoimentos$ = this.depoimentosSubject.asObservable();

  /**
   * Carrega todos os depoimentos ordenados por data (DESC)
   */
  async carregarDepoimentos(): Promise<Depoimento[]> {
    try {
      const depoimentosRef = collection(this.firestore, 'depoimentos');
      const q = query(depoimentosRef, orderBy('data', 'desc'));
      const snapshot = await getDocs(q);

      const depoimentos: Depoimento[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data['userId'],
          nome: data['nome'],
          texto: data['texto'],
          estrelas: data['estrelas'],
          data: data['data']?.toDate() || new Date()
        };
      });

      this.depoimentosSubject.next(depoimentos);
      return depoimentos;
    } catch (error) {
      console.error('Erro ao carregar depoimentos:', error);
      throw error;
    }
  }

  /**
   * Adiciona novo depoimento
   */
  async adicionarDepoimento(novo: NovoDepoimento): Promise<string> {
    const user = this.auth.currentUser;

    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    if (!novo.texto.trim()) {
      throw new Error('Texto do depoimento é obrigatório');
    }

    if (novo.estrelas < 1 || novo.estrelas > 5) {
      throw new Error('Avaliação deve estar entre 1 e 5 estrelas');
    }

    try {
      const depoimentosRef = collection(this.firestore, 'depoimentos');

      const docRef = await addDoc(depoimentosRef, {
        userId: user.uid,
        nome: user.displayName || 'Usuário',
        texto: novo.texto,
        estrelas: novo.estrelas,
        data: serverTimestamp()
      });

      // Recarregar depoimentos para atualizar lista
      await this.carregarDepoimentos();

      return docRef.id;
    } catch (error) {
      console.error('Erro ao adicionar depoimento:', error);
      throw error;
    }
  }

  /**
   * Filtra depoimentos por avaliação mínima
   */
  filtrarPorAvaliacao(minEstrelas: number): Depoimento[] {
    return this.depoimentosSubject.value.filter(d => d.estrelas >= minEstrelas);
  }
}
```

---

## 3️⃣ Uso dos Serviços nos Componentes

### Antes (Com `any[]` e lógica espalhada)

```typescript
export class TelaDoMapaComponent implements OnInit, AfterViewInit {
  projetos: any[] = [];
  todosProjetos: any[] = [];

  async carregarProjetosDoFirebase() {
    // ... lógica de carregamento aqui
  }
}
```

### Depois (Com Serviços e Tipagem)

```typescript
import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { ProjetosService } from '../services/projetos.service';
import { FavoritosService } from '../services/favoritos.service';
import { Projeto } from '../models';

@Component({
  selector: 'app-tela-do-mapa',
  templateUrl: './tela-do-mapa.component.html',
  styleUrls: ['./tela-do-mapa.component.css']
})
export class TelaDoMapaComponent implements OnInit, AfterViewInit {
  private projetosService = inject(ProjetosService);
  private favoritosService = inject(FavoritosService);

  projetos$ = this.projetosService.projetos$;
  favoritos$ = this.favoritosService.favoritos$;

  async ngOnInit() {
    await this.projetosService.carregarProjetos();
    await this.favoritosService.carregarFavoritos();
  }

  async filtrar(tipos?: TipoProjeto[], dias?: DiaSemana[]) {
    const resultado = await this.projetosService.filtrarProjetos(tipos, dias);
    // ...
  }
}
```

---

## 4️⃣ Real-time Listeners (Sincronização em Tempo Real)

### 📄 `services/favoritos-realtime.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  onSnapshot,
  Unsubscribe
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoritosRealtimeService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private favoritosSubject = new BehaviorSubject<string[]>([]);
  public favoritos$ = this.favoritosSubject.asObservable();

  private unsubscribe: Unsubscribe | null = null;

  /**
   * Inicia listener real-time para favoritos do usuário
   */
  iniciarListenerFavoritos(): void {
    const user = this.auth.currentUser;

    if (!user) {
      console.warn('Usuário não autenticado');
      return;
    }

    // Limpar listener anterior se existir
    this.pararListenerFavoritos();

    // Configurar novo listener
    const userDocRef = doc(this.firestore, 'usuarios', user.uid);

    this.unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const favoritos = docSnap.data()['favoritos'] || [];
          this.favoritosSubject.next(favoritos);
        } else {
          this.favoritosSubject.next([]);
        }
      },
      (error) => {
        console.error('Erro ao ouvir favoritos:', error);
      }
    );
  }

  /**
   * Para o listener real-time
   */
  pararListenerFavoritos(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Cleanup ao destruir serviço
   */
  ngOnDestroy(): void {
    this.pararListenerFavoritos();
  }
}
```

**Uso em Componente:**

```typescript
export class TelaDoMapaComponent implements OnInit, OnDestroy {
  private favoritosRealtime = inject(FavoritosRealtimeService);
  favoritos$ = this.favoritosRealtime.favoritos$;

  ngOnInit() {
    this.favoritosRealtime.iniciarListenerFavoritos();
  }

  ngOnDestroy() {
    this.favoritosRealtime.prarListenerFavoritos();
  }
}
```

---

## 5️⃣ Validações e Tratamento de Erros

### 📄 `models/erros.ts`

```typescript
export class ErroCustomizado extends Error {
  constructor(
    public codigo: string,
    public mensagem: string,
    public detalhes?: any
  ) {
    super(mensagem);
  }
}

export enum CodigoErro {
  USUARIO_NAO_AUTENTICADO = 'USUARIO_NAO_AUTENTICADO',
  DOCUMENTO_NAO_EXISTE = 'DOCUMENTO_NAO_EXISTE',
  OPERACAO_FALHOU = 'OPERACAO_FALHOU',
  EMAIL_INVALIDO = 'EMAIL_INVALIDO',
  SENHA_FRACA = 'SENHA_FRACA',
  EMAIL_JA_EXISTE = 'EMAIL_JA_EXISTE',
}
```

### 📄 `services/validacao.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { ErroCustomizado, CodigoErro } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ValidacaoService {
  
  validarEmail(email: string): void {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!regex.test(email)) {
      throw new ErroCustomizado(
        CodigoErro.EMAIL_INVALIDO,
        'Email inválido. Verifique o formato.',
        { email }
      );
    }
  }

  validarSenha(senha: string): void {
    if (senha.length < 6) {
      throw new ErroCustomizado(
        CodigoErro.SENHA_FRACA,
        'Senha deve ter no mínimo 6 caracteres.',
        { tamanho: senha.length }
      );
    }
  }

  validarDepoimento(texto: string, estrelas: number): void {
    if (!texto.trim()) {
      throw new ErroCustomizado(
        CodigoErro.OPERACAO_FALHOU,
        'O depoimento não pode estar vazio.',
      );
    }

    if (estrelas < 1 || estrelas > 5) {
      throw new ErroCustomizado(
        CodigoErro.OPERACAO_FALHOU,
        'A avaliação deve estar entre 1 e 5 estrelas.',
        { estrelas }
      );
    }
  }
}
```

---

## 6️⃣ Exemplo Completo: Refatoração do Componente `tela-do-mapa`

### Antes

```typescript
export class TelaDoMapaComponent implements OnInit, AfterViewInit {
  projetos: any[] = [];
  todosProjetos: any[] = [];
  
  async ngAfterViewInit() {
    // Todo o código aqui...
  }

  async carregarProjetosDoFirebase() {
    // Lógica complexa espalhada
  }
  
  async carregarFavoritos() {
    // Mais lógica aqui
  }
  
  filtrarProjetos() {
    // Mais lógica aqui
  }
}
```

### Depois

```typescript
import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { BottomNavComponent } from '../shared/bottom-nav/bottom-nav.component';
import { ProjetosService } from '../services/projetos.service';
import { FavoritosRealtimeService } from '../services/favoritos-realtime.service';
import { Projeto, TipoProjeto, DiaSemana } from '../models';
import * as L from 'leaflet';

@Component({
  selector: 'app-tela-do-mapa',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavComponent, BottomNavComponent],
  templateUrl: './tela-do-mapa.component.html',
  styleUrls: ['./tela-do-mapa.component.css']
})
export class TelaDoMapaComponent implements OnInit, AfterViewInit, OnDestroy {
  private projetosService = inject(ProjetosService);
  private favoritosService = inject(FavoritosRealtimeService);

  // Observables do template
  projetos$ = this.projetosService.projetos$;
  favoritos$ = this.favoritosService.favoritos$;

  // Estado do componente
  filtroAberto = false;
  projetoSelecionado: Projeto | null = null;
  detalhesAbertos = false;

  // Filtros
  tiposSelecionados: Record<TipoProjeto, boolean> = {
    [TipoProjeto.PLANTAR]: false,
    [TipoProjeto.LIMPEZA]: false,
    [TipoProjeto.OUTROS]: false
  };

  diasSelecionados: Record<DiaSemana, boolean> = {
    [DiaSemana.SEGUNDA]: false,
    [DiaSemana.TERCA]: false,
    [DiaSemana.QUARTA]: false,
    [DiaSemana.QUINTA]: false,
    [DiaSemana.SEXTA]: false,
    [DiaSemana.SABADO]: false,
    [DiaSemana.DOMINGO]: false
  };

  private map!: L.Map;

  async ngOnInit() {
    // Carregar dados
    await this.projetosService.carregarProjetos();
    this.favoritosService.iniciarListenerFavoritos();
  }

  async ngAfterViewInit() {
    this.inicializarMapa();
  }

  ngOnDestroy() {
    this.favoritosService.pararListenerFavoritos();
  }

  private inicializarMapa(): void {
    this.map = L.map('map').setView([-23.5505, -46.6333], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO'
    }).addTo(this.map);

    setTimeout(() => this.map.invalidateSize(), 0);
  }

  async aplicarFiltros(): Promise<void> {
    const tipos = Object.entries(this.tiposSelecionados)
      .filter(([_, selecionado]) => selecionado)
      .map(([tipo]) => tipo as TipoProjeto);

    const dias = Object.entries(this.diasSelecionados)
      .filter(([_, selecionado]) => selecionado)
      .map(([dia]) => dia as DiaSemana);

    await this.projetosService.filtrarProjetos(
      tipos.length > 0 ? tipos : undefined,
      dias.length > 0 ? dias : undefined
    );

    this.fecharFiltro();
  }

  abrirFiltro(): void {
    this.filtroAberto = true;
  }

  fecharFiltro(): void {
    this.filtroAberto = false;
  }

  abrirDetalhes(projeto: Projeto): void {
    this.projetoSelecionado = projeto;
    this.detalhesAbertos = true;
  }

  fecharDetalhes(): void {
    this.detalhesAbertos = false;
    this.projetoSelecionado = null;
  }
}
```

---

## 7️⃣ Testes Unitários

### 📄 `services/favoritos.service.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { FavoritosService } from './favoritos.service';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

describe('FavoritosService', () => {
  let service: FavoritosService;
  let mockFirestore: jasmine.SpyObj<Firestore>;
  let mockAuth: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    mockFirestore = jasmine.createSpyObj('Firestore', ['collection']);
    mockAuth = jasmine.createSpyObj('Auth', ['currentUser']);

    TestBed.configureTestingModule({
      providers: [
        FavoritosService,
        { provide: Firestore, useValue: mockFirestore },
        { provide: Auth, useValue: mockAuth }
      ]
    });

    service = TestBed.inject(FavoritosService);
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('deve verificar se um projeto é favorito', () => {
    service['favoritosSubject'].next(['proj1', 'proj2']);
    
    expect(service.ehFavorito('proj1')).toBeTruthy();
    expect(service.ehFavorito('proj3')).toBeFalsy();
  });
});
```

---

## 📝 Checklist de Implementação

- [ ] Criar pasta `models/` e interfaces
- [ ] Criar pasta `services/` com serviços
- [ ] Refatorar componentes para usar serviços
- [ ] Implementar real-time listeners (`onSnapshot`)
- [ ] Adicionar validações com `ValidacaoService`
- [ ] Criar testes unitários
- [ ] Configurar Firestore Security Rules
- [ ] Implementar tratamento centralizado de erros
- [ ] Adicionar loader/spinner nos componentes
- [ ] Melhorar UX com feedback visual

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---|---|---|
| **Tipagem** | `any[]` | Interfaces específicas |
| **Lógica** | Espalhada em componentes | Centralizada em serviços |
| **Reutilização** | Baixa (código duplicado) | Alta (serviços injetáveis) |
| **Testes** | Difícil (lógica acoplada) | Fácil (serviços isolados) |
| **Manutenção** | Complexa | Simples |
| **Performance** | Sem caching | Com BehaviorSubject |
| **Real-time** | getDocs() pontuais | onSnapshot() contínuo |
| **Erros** | alert() genéricos | Tratamento estruturado |

---

**Próximos Passos:**
1. Iniciar refatoração com interfaces TypeScript
2. Criar serviços base (projetos, usuários, favoritos)
3. Refatorar componentes um por um
4. Adicionar testes unitários
5. Implementar real-time listeners
6. Fazer deploy com melhorias

---

**Documento gerado em**: 23/04/2026
