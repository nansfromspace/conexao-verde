# 📋 Análise da Estrutura do Projeto Conexão Verde

## 📊 Visão Geral
**Conexão Verde** é um aplicativo Angular 19 que conecta usuários com projetos de sustentabilidade em suas comunidades. Utiliza Firebase para autenticação e dados, com Leaflet para visualização de mapas.

**Stack Tecnológico:**
- **Frontend**: Angular 19 (Standalone Components)
- **Backend**: Firebase (Authentication + Firestore)
- **Mapas**: Leaflet.js (OpenStreetMap)
- **UI**: FontAwesome Icons, CSS customizado

---

## 🗄️ Estrutura de Dados - Firestore

### 1. **Coleção: `ongs`**
Armazena organizações e seus projetos.

```typescript
// Documento: {ongId}
{
  nome: string;              // Nome da ONG
  contato: string;           // Informações de contato
  atividades: [
    {
      nome: string;          // Nome do projeto/atividade
      local: string;         // Endereço do projeto
      horario: string;       // Horário de funcionamento
      tipo: string;          // 'plantar' | 'limpeza de espaços' | 'outros'
      diasSemana: string[];  // ['segunda', 'terca', 'quarta', ...]
      coordenadas: {
        latitude: number;
        longitude: number;
      }
    }
  ]
}
```

**Ejemplo:**
```json
{
  "nome": "ONG Verde Brasil",
  "contato": "(11) 98765-4321",
  "atividades": [
    {
      "nome": "Plantio de Árvores",
      "local": "Av. Paulista, 1000",
      "horario": "09:00 - 17:00",
      "tipo": "plantar",
      "diasSemana": ["sabado", "domingo"],
      "coordenadas": {
        "latitude": -23.5505,
        "longitude": -46.6333
      }
    }
  ]
}
```

---

### 2. **Coleção: `usuarios`**
Armazena dados de usuários registrados no app.

```typescript
// Documento: {uid} (UID do Firebase Auth)
{
  nome: string;              // Nome completo
  apelido: string;           // Apelido/nickname
  email: string;             // (opcional) Email
  favoritos: string[];       // IDs de projetos favoritados
}
```

**Ejemplo:**
```json
{
  "nome": "João Silva",
  "apelido": "João",
  "email": "joao@email.com",
  "favoritos": ["ong1_0", "ong2_1"]
}
```

---

### 3. **Coleção: `depoimentos`**
Armazena avaliações e depoimentos de usuários.

```typescript
// Documento: {docId} (Auto-gerado)
{
  userId: string;            // UID do Firebase Auth
  nome: string;              // Nome do usuário
  texto: string;             // Conteúdo do depoimento
  estrelas: number;          // Avaliação (0-5)
  data: Timestamp;           // serverTimestamp()
}
```

**Ejemplo:**
```json
{
  "userId": "user123",
  "nome": "Maria Silva",
  "texto": "Experiência incrível! A ONG é muito organizada...",
  "estrelas": 5,
  "data": "2025-01-15T10:30:00.000Z"
}
```

---

## 📱 Arquitetura de Componentes

### Estrutura de Pastas
```
src/app/
├── app.routes.ts                    # Rotas da aplicação
├── app.component.ts                 # Componente raiz
├── app.config.ts                    # Configuração da app
│
├── shared/                          # Componentes compartilhados
│   ├── top-nav/                     # Barra de navegação superior
│   └── bottom-nav/                  # Barra de navegação inferior
│
├── tela-inicial/                    # Tela Home
├── tela-de-introducao/              # Onboarding
├── tela-de-login/                   # Login
├── tela-de-registro/                # Registro
├── tela-do-mapa/                    # Tela principal (mapa interativo)
├── tela-de-favoritos/               # Projetos favoritados
├── tela-de-depoimentos/             # Avaliações e reviews
└── splash/                          # Tela inicial animada
```

---

## 🗺️ Componente Principal: `tela-do-mapa`

### Arquivo: [tela-do-mapa.component.ts](src/app/tela-do-mapa/tela-do-mapa.component.ts)

**Responsabilidades:**
- Visualizar projetos em mapa interativo (Leaflet)
- Filtrar por tipo, dia da semana e localização
- Exibir detalhes de projetos
- Gerenciar favoritos do usuário

**Modelo de Dados Interna:**
```typescript
interface Projeto {
  id: string;                        // "{ongId}_{index}"
  nome: string;
  endereco: string;
  horario: string;
  nomeOng: string;
  contatoOng: string;
  coordenadas: {
    latitude: number;
    longitude: number;
  };
  tipo: 'plantar' | 'limpeza de espaços' | 'outros';
  diasSemana: string[];
}
```

**Funcionalidades:**

#### Carregamento de Projetos
```typescript
async carregarProjetosDoFirebase() {
  // 1. Busca todos os documentos da coleção 'ongs'
  const ongsRef = collection(this.firestore, 'ongs');
  const snapshot = await getDocs(ongsRef);

  // 2. Extrai atividades de cada ONG
  // 3. Cria array de projetos com ID composto
  // Formato ID: "{ongId}_{indexAtividade}"
}
```

#### Filtros Disponíveis
1. **Por Tipo**: Plantar, Limpeza de espaços, Outros
2. **Por Localização**:
   - Perto de mim (Geolocalização)
   - Endereço manual (Nominatim OpenStreetMap)
3. **Por Dia da Semana**: Segunda a domingo

#### Sistema de Favoritos
```typescript
async toggleFavorito() {
  // 1. Valida se usuário está autenticado
  // 2. Adiciona/remove ID do projeto em usuarios[uid].favoritos
  // Usa arrayUnion/arrayRemove do Firestore
}
```

#### Mapa Interativo (Leaflet)
- Inicializa com zoom em São Paulo: [-23.5505, -46.6333]
- Marcadores customizados com pin verde
- Baseado em OpenStreetMap (CartoDBPositron)
- Cálculo de distância em km usando fórmula Haversine

---

## 👤 Autenticação e Gerenciamento de Usuários

### [tela-de-registro/](src/app/tela-de-registro/)
**Métodos de Registro:**
1. **Email/Senha**
   - Validação de email (regex)
   - Confirmação de senha
   - Criação de documento em `usuarios/{uid}`

2. **Google OAuth**
   - Verifica se usuário já existe (deve estar registrado)
   - Extrai displayName
   - Salva em `usuarios/{uid}`

### [tela-de-login/](src/app/tela-de-login/)
**Métodos de Login:**
1. **Email/Senha** (Firebase Auth)
2. **Google OAuth**
   - Requer registro prévio em `usuarios/{uid}`

### Modelo de Dados de Usuário
```typescript
interface Usuario {
  uid: string;           // Firebase Auth UID
  nome: string;
  apelido: string;
  email?: string;
  favoritos: string[];   // Array de IDs de projetos
}
```

---

## ⭐ Gerenciamento de Favoritos

### Componente: [tela-de-favoritos/](src/app/tela-de-favoritos/)

**Fluxo:**
1. Obtém lista de favoritos do usuário: `usuarios[uid].favoritos`
2. Itera por todas as ONGs em `ongs`
3. Busca atividades cujo ID está na lista de favoritos
4. Permite desfavoritar (remove do array)

**Estrutura de Dados:**
```typescript
interface ProjetoFavoritado {
  id: string;          // Mesmo formato que no mapa
  nome: string;
  endereco: string;
  horario: string;
  nomeOng: string;
  contatoOng: string;
  coordenadas: {
    latitude: number;
    longitude: number;
  };
  tipo: string;
}
```

---

## 💬 Depoimentos e Avaliações

### Componente: [tela-de-depoimentos/](src/app/tela-de-depoimentos/)

**Funcionalidades:**
- Exibe depoimentos ordenados por data (DESC)
- Permite novo depoimento (usuário autenticado)
- Avaliação por estrelas (1-5)
- Usa `serverTimestamp()` do Firebase

**Modelo:**
```typescript
interface Depoimento {
  id: string;           // Auto-gerado pelo Firestore
  userId: string;       // Firebase Auth UID
  nome: string;         // Nome do usuário (de Auth ou Firestore)
  texto: string;        // Conteúdo do depoimento
  estrelas: number;     // 1-5
  data: Timestamp;      // serverTimestamp()
}
```

**Query Firestore:**
```typescript
const q = query(
  collection(this.firestore, 'depoimentos'),
  orderBy('data', 'desc')
);
```

---

## 🔐 Firebase Configuration

### [src/environments/environment.ts](src/environments/environment.ts)

```typescript
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyBHUuIJaphipOirvQAdm9gFGZZz-KhV_Ao",
    authDomain: "conexao-verde-1fe42.firebaseapp.com",
    projectId: "conexao-verde-1fe42",
    storageBucket: "conexao-verde-1fe42.appspot.com",
    messagingSenderId: "449096737925",
    appId: "1:449096737925:web:04f3c2c5d97f664cccb5ec"
  }
};
```

### [src/main.ts](src/main.ts) - Inicialização
```typescript
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

bootstrapApplication(AppComponent, {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    // ...
  ]
});
```

---

## 📦 Dependências Principais

```json
{
  "@angular/core": "^19.2.0",
  "@angular/fire": "^19.1.0",           // Firebase para Angular
  "firebase": "^11.6.1",                 // SDK Firebase
  "leaflet": "^1.9.4",                   // Mapas interativos
  "@fortawesome/angular-fontawesome": "^1.0.0"  // Ícones
}
```

---

## 🔄 Fluxo de Sincronização com Firebase

### 1. **Ao Abrir o Mapa** (`tela-do-mapa`)
```
1. ngAfterViewInit() inicializa Leaflet
2. carregarProjetosDoFirebase() → getDocs('ongs')
3. carregarFavoritos() → getDoc('usuarios/{uid}')
4. Renderiza marcadores no mapa
```

### 2. **Ao Filtrar**
```
1. Filtra array local (todosProjetos)
2. Se "perto de mim": getUserLocation() → calcularDistancia()
3. Se "endereço manual": Nominatim API → Geocode
4. redesenharMarcadores() atualiza visualização
```

### 3. **Ao Favoritar**
```
1. updateDoc('usuarios/{uid}', { 
     favoritos: arrayUnion(projetoId) 
   })
2. OU para remover:
   updateDoc('usuarios/{uid}', { 
     favoritos: arrayRemove(projetoId)
   })
```

### 4. **Ao Enviar Depoimento**
```
1. addDoc('depoimentos', {
     userId: user.uid,
     nome: user.displayName,
     texto, estrelas,
     data: serverTimestamp()
   })
```

---

## 🎯 Observações Importantes

### ⚠️ Pontos de Melhoria Identificados

1. **Tipagem TypeScript**
   - Código usa `any[]` em vários pontos
   - Recomendação: Criar interfaces reutilizáveis
   
   **Sugestão:**
   ```typescript
   // models/projeto.interface.ts
   export interface Projeto {
     id: string;
     nome: string;
     endereco: string;
     horario: string;
     nomeOng: string;
     contatoOng: string;
     coordenadas: Coordenadas;
     tipo: 'plantar' | 'limpeza de espaços' | 'outros';
     diasSemana: string[];
   }

   export interface Coordenadas {
     latitude: number;
     longitude: number;
   }
   ```

2. **Serviços de Dados**
   - Lógica de Firebase espalhada nos componentes
   - Recomendação: Criar serviços compartilhados
   
   **Sugestão:**
   ```typescript
   // services/projetos.service.ts
   @Injectable()
   export class ProjetosService {
     carregarProjetos() { }
     favoritar(projetoId: string) { }
     desfavoritar(projetoId: string) { }
   }
   ```

3. **ID de Projetos**
   - Usa formato composto: `ongId_index`
   - Frágil se índices mudarem
   - Considerar: IDs únicos no Firestore

4. **Geolocalização**
   - Sem tratamento de permissões negadas em todos os casos
   - Sem cache de localização do usuário

---

## 📄 Resumo de Arquivos Chave

| Arquivo | Responsabilidade |
|---------|-----------------|
| [app.routes.ts](src/app/app.routes.ts) | Definição de rotas |
| [main.ts](src/main.ts) | Inicialização Firebase |
| [environment.ts](src/environments/environment.ts) | Config Firebase |
| [tela-do-mapa/](src/app/tela-do-mapa/) | Mapa principal + filtros |
| [tela-de-favoritos/](src/app/tela-de-favoritos/) | Gerenciamento de favoritos |
| [tela-de-depoimentos/](src/app/tela-de-depoimentos/) | Avaliações/reviews |
| [tela-de-registro/](src/app/tela-de-registro/) | Cadastro de usuários |
| [tela-de-login/](src/app/tela-de-login/) | Autenticação |
| [tela-inicial/](src/app/tela-inicial/) | Tela inicial (home) |

---

## 🚀 Como Está Funcionando a Aplicação

1. **Splash** → Tela de Introdução (onboarding)
2. **Registro/Login** → Autenticação via Firebase
3. **Home** → Tela inicial com informações do usuário
4. **Mapa** → Visualização de projetos com filtros
5. **Favoritos** → Lista de projetos salvos
6. **Depoimentos** → Avaliações da comunidade

---

## 💾 Estrutura de Dados Resumida em Diagrama

```
Firebase Firestore
│
├── ongs/
│   ├── {ongId}
│   │   ├── nome: string
│   │   ├── contato: string
│   │   └── atividades: [
│   │       {
│   │         nome, local, horario, tipo,
│   │         diasSemana[], coordenadas{}
│   │       }
│   │     ]
│   └── {ongId2}
│
├── usuarios/
│   ├── {uid}
│   │   ├── nome: string
│   │   ├── apelido: string
│   │   ├── email?: string
│   │   └── favoritos: [array de IDs]
│   └── {uid2}
│
└── depoimentos/
    ├── {docId}
    │   ├── userId: string
    │   ├── nome: string
    │   ├── texto: string
    │   ├── estrelas: number
    │   └── data: Timestamp
    └── {docId2}
```

---

**Gerado em**: 23/04/2026  
**Projeto**: Conexão Verde (Angular 19 + Firebase)
