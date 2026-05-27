# 🔄 Fluxos de Sincronização Firebase - Conexão Verde

## 📊 Diagrama de Fluxo - Carregamento da Aplicação

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SPLASH SCREEN                                   │
│                   (tela-splash)                                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  TELA DE INTRODUÇÃO                                 │
│            (tela-de-introducao) - Onboarding                        │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│             DECISÃO DE AUTENTICAÇÃO                                 │
└────┬────────────────────────────────────┬──────────────────────────┘
     │                                    │
     ▼                                    ▼
┌─────────────────┐            ┌──────────────────┐
│ NOVO USUÁRIO    │            │ USUÁRIO EXISTENTE│
│  (Registro)     │            │   (Login)        │
└────────┬────────┘            └────────┬─────────┘
         │                              │
         ▼                              ▼
    ┌─────────────────┐      ┌──────────────────┐
    │ Email/Senha     │      │ Email/Senha      │
    │ ou Google       │      │ ou Google        │
    │ OAuth           │      │ OAuth            │
    └────────┬────────┘      └────────┬─────────┘
             │                        │
             ▼                        ▼
    ┌─────────────────────────────────────────────┐
    │ Auth: createUserWithEmailAndPassword()      │
    │       signInWithPopup(GoogleAuthProvider)   │
    └────────┬────────────────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────────────────┐
    │ Firestore: setDoc('usuarios/{uid}', data)  │
    │ Fields: nome, apelido, email               │
    └────────┬────────────────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────────────────┐
    │  TELA INICIAL (HOME)                        │
    │  Exibe: nome do usuário                     │
    │  Query: getDoc('usuarios/{uid}')            │
    └────────┬────────────────────────────────────┘
             │
             ▼ (Navegação via Bottom Nav)
    ┌─────────────────────────────────────────────┐
    │  OUTRAS TELAS:                              │
    │  - Mapa (tela-do-mapa)                      │
    │  - Favoritos (tela-de-favoritos)            │
    │  - Depoimentos (tela-de-depoimentos)        │
    └─────────────────────────────────────────────┘
```

---

## 🗺️ Fluxo Detalhado: Mapa e Filtros

### 1️⃣ Carregamento Inicial do Mapa

```
┌──────────────────────────────────────────────────────────────────┐
│ TelaDoMapaComponent.ngAfterViewInit()                           │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ├─► L.map('map').setView([-23.5505, -46.6333], 12)
         │   (Inicializar Leaflet)
         │
         ├─► L.tileLayer() - OpenStreetMap CartoDBPositron
         │   (Adicionar camada de mapa)
         │
         └─► carregarProjetosDoFirebase()
             │
             ├─► getDocs(collection(firestore, 'ongs'))
             │   ↓
             │   Itera cada ONG:
             │   ├── ongData: { nome, contato, atividades[] }
             │   └── Para cada atividade (index):
             │       ├── id = `${ongId}_${index}`
             │       ├── nome = atividade.nome
             │       ├── endereco = atividade.local
             │       ├── horario = atividade.horario
             │       ├── tipo = atividade.tipo (lowercase)
             │       ├── diasSemana = atividade.diasSemana[]
             │       └── coordenadas = atividade.coordenadas
             │
             ├─► todosProjetos.push(projeto)
             │   (Array com TODOS os projetos)
             │
             ├─► carregarFavoritos()
             │   │
             │   ├─► auth.currentUser?.uid
             │   └─► getDoc('usuarios/{uid}')
             │       → this.favoritos = favoritos[]
             │
             └─► filtrarProjetos()
                 (Aplicar filtros padrão)
```

### Exemplo de Transformação de Dados

**Documento Firestore (ongs/{ongId}):**
```json
{
  "nome": "ONG Plantando Vidas",
  "contato": "(11) 99999-8888",
  "atividades": [
    {
      "nome": "Plantio na Avenida Paulista",
      "local": "Av. Paulista, 1000",
      "horario": "09:00 - 17:00",
      "tipo": "Plantar",
      "diasSemana": ["Sábado", "Domingo"],
      "coordenadas": {
        "latitude": -23.5505,
        "longitude": -46.6333
      }
    },
    {
      "nome": "Limpeza Parque Ibirapuera",
      "local": "Parque Ibirapuera",
      "horario": "08:00 - 12:00",
      "tipo": "Limpeza de Espaços",
      "diasSemana": ["Quinta", "Sábado"],
      "coordenadas": {
        "latitude": -23.5906,
        "longitude": -46.6581
      }
    }
  ]
}
```

**Projetos Carregados em Memória:**
```javascript
todosProjetos = [
  {
    id: "ongId_0",
    nome: "Plantio na Avenida Paulista",
    endereco: "Av. Paulista, 1000",
    horario: "09:00 - 17:00",
    nomeOng: "ONG Plantando Vidas",
    contatoOng: "(11) 99999-8888",
    tipo: "plantar",
    diasSemana: ["sábado", "domingo"],
    coordenadas: { latitude: -23.5505, longitude: -46.6333 }
  },
  {
    id: "ongId_1",
    nome: "Limpeza Parque Ibirapuera",
    endereco: "Parque Ibirapuera",
    horario: "08:00 - 12:00",
    nomeOng: "ONG Plantando Vidas",
    contatoOng: "(11) 99999-8888",
    tipo: "limpeza de espaços",
    diasSemana: ["quinta", "sábado"],
    coordenadas: { latitude: -23.5906, longitude: -46.6581 }
  }
]
```

---

### 2️⃣ Sistema de Filtros

```
┌──────────────────────────────────────────────────────────────────┐
│ Usuario clica em botão "Filtro"                                 │
│ → abrirFiltro() / filtroAberto = true                           │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│        BOTTOM SHEET - FILTROS                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ☑ Plantar           ☐ Limpeza        ☐ Outros          │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ◉ Perto de mim      ◯ Endereço manual                   │   │
│  │ [input de endereço]                                      │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ☑Segunda ☑Terça ☑Quarta ☑Quinta ☑Sexta ☑Sab ☑Dom     │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
         │
         │ Usuario confirma/ muda filtro
         └──► filtrarProjetos()
              │
              ├─ Filtro de Tipo:
              │  filtrados = todosProjetos.filter(p =>
              │    filtroTiposSelecionados.includes(p.tipo)
              │  )
              │
              ├─ Filtro de Dia da Semana:
              │  filtrados = filtrados.filter(p =>
              │    diasSelecionadosArray.some(dia =>
              │      p.diasSemana.includes(dia)
              │    )
              │  )
              │
              └─ Filtro de Localização: [3 casos]
                 │
                 ├─ CASO 1: Sem filtro (filtroLocal = null)
                 │  └─ projetos = filtrados
                 │     └─ redesenharMarcadores()
                 │
                 ├─ CASO 2: "Perto de mim" (filtroLocal = 'perto')
                 │  │
                 │  ├─ navigator.geolocation.getCurrentPosition()
                 │  │  {latitude: userLat, longitude: userLon}
                 │  │
                 │  └─ Para cada projeto:
                 │     ├─ distancia = calcularDistanciaKm(
                 │     │    userLat, userLon,
                 │     │    projeto.lat, projeto.lon
                 │     │  )
                 │     └─ Se distancia <= 5km → incluir
                 │
                 └─ CASO 3: "Endereço manual" (filtroLocal = 'manual')
                    │
                    ├─ enderecoManual = window.location
                    │
                    ├─ fetch('nominatim.openstreetmap.org/search')
                    │  └─ query = {
                    │      q: "${endereco}",
                    │      format: 'json',
                    │      limit: 1
                    │    }
                    │
                    ├─ Response: [{lat, lon, ...}]
                    │  └─ latUser = parseFloat(data[0].lat)
                    │     lonUser = parseFloat(data[0].lon)
                    │
                    ├─ Marca localização do usuário no mapa
                    │
                    └─ Filtra projetos dentro de 5km
                       └─ disancia <= 5km

┌──────────────────────────────────────────────────────────────────┐
│            RESULTADO EXIBIDO NO MAPA                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                    [🔍 Filtro]          │   │
│  │              🌐 OpenStreetMap                            │   │
│  │              📍 📍 📍                                    │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Carrossel de Cards (scroll horizontal):                       │
│  ┌────────────────────┬────────────────────┬─────────────────┐ │
│  │ 🌱 Plantio         │ 🧹 Limpeza         │ 🔄 Outros       │ │
│  │ Av. Paulista       │ Parque Ibirapuera  │ ...             │ │
│  │ Sab • Dom          │ Qui • Sab          │                 │ │
│  │ [VER MAIS]         │ [VER MAIS]         │ [VER MAIS]      │ │
│  └────────────────────┴────────────────────┴─────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## ⭐ Fluxo de Favoritos

```
┌────────────────────────────────────────────────────────┐
│ Usuario clica "Favoritar" em um projeto               │
└─────────────────┬──────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ toggleFavorito()   │
         └────────┬───────────┘
                  │
                  ├─ Valida: auth.currentUser existe
                  │
                  ├─ projetoId = projetoSelecionado.id
                  │
                  └─ Verifica: projetoFavoritado?
                     │
                     ├─ SIM (já favoritado)
                     │  │
                     │  └─ updateDoc('usuarios/{uid}', {
                     │       favoritos: arrayRemove(projetoId)
                     │     })
                     │     └─ favoritos.filter(id => id !== projetoId)
                     │
                     └─ NÃO (novo favorito)
                        │
                        ├─ Verificar se doc user existe
                        │
                        ├─ SIM: updateDoc('usuarios/{uid}', {
                        │        favoritos: arrayUnion(projetoId)
                        │      })
                        │
                        └─ NÃO: setDoc('usuarios/{uid}', {
                                 favoritos: [projetoId]
                               }, { merge: true })
```

### Firestore: Antes e Depois

**Antes:**
```json
{
  "uid": "user123",
  "nome": "João Silva",
  "apelido": "João",
  "favoritos": ["ong1_0", "ong3_2"]
}
```

**Depois (adicionar favorito):**
```json
{
  "uid": "user123",
  "nome": "João Silva",
  "apelido": "João",
  "favoritos": ["ong1_0", "ong3_2", "ong2_1"]  // arrayUnion
}
```

**Depois (remover favorito):**
```json
{
  "uid": "user123",
  "nome": "João Silva",
  "apelido": "João",
  "favoritos": ["ong1_0"]  // arrayRemove ong3_2
}
```

---

## 💬 Fluxo de Depoimentos

```
┌────────────────────────────────────────────────────────────────┐
│             TELA DE DEPOIMENTOS                                │
│                                                                │
│  Ao Carregar (ngOnInit):                                       │
│  └─► carregarDepoimentos()                                     │
│      │                                                          │
│      ├─► query(                                                │
│      │     collection(firestore, 'depoimentos'),              │
│      │     orderBy('data', 'desc')                            │
│      │   )                                                      │
│      │                                                          │
│      └─► getDocs(q)                                            │
│          └─► snapshot.docs.map(doc => ({                      │
│                id: doc.id,                                     │
│                ...doc.data()                                   │
│              }))                                               │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ⭐⭐⭐⭐⭐ João Silva                      15/01/2025  │ │
│  │ "Experiência incrível! Muito organizado..."              │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ ⭐⭐⭐⭐  Maria Silva                      10/01/2025  │ │
│  │ "Gostei muito! Voltarei em breve..."                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Ao Enviar Novo Depoimento:                                   │
└────────┬────────────────────────────────────────────────────────┘
         │
         ├─ Valida: auth.currentUser existe
         ├─ Valida: texto não está vazio
         ├─ Valida: estrelas > 0
         │
         └─ addDoc(collection(firestore, 'depoimentos'), {
              userId: user.uid,
              nome: user.displayName || 'Usuário',
              texto: this.novoDepoimento.texto,
              estrelas: this.novoDepoimento.estrelas,
              data: serverTimestamp()
            })
            │
            └─ Sucesso:
               ├─ alert('Depoimento enviado com sucesso! 🌱')
               ├─ fecharModal()
               └─ carregarDepoimentos() [refresh]
```

### Documento no Firestore

```json
{
  "id": "docId123",
  "userId": "user456",
  "nome": "João Silva",
  "texto": "Que experiência incrível! A ONG é muito bem organizada...",
  "estrelas": 5,
  "data": "2025-01-15T14:30:00.000Z"
}
```

---

## 🔐 Fluxo de Autenticação - Login vs Registro

### REGISTRO COM EMAIL/SENHA

```
┌────────────────────────────────────────────────────────────┐
│ Tela de Registro                                           │
│ Inputs: nome, apelido, email, senha, confirmarSenha      │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ registrar()        │
         └────────┬───────────┘
                  │
                  ├─ Validações:
                  │  ├─ Campos não vazios
                  │  ├─ Email válido (regex)
                  │  └─ senha === confirmarSenha
                  │
                  └─ createUserWithEmailAndPassword(
                       auth, email, senha
                     )
                     │
                     ├─ ✅ Sucesso:
                     │  │
                     │  └─ setDoc('usuarios/{uid}', {
                     │       nome: nome,
                     │       apelido: apelido,
                     │       favoritos: []
                     │     })
                     │     │
                     │     └─ Redirecionar para /home
                     │
                     └─ ❌ Erro:
                        └─ Exibir mensagem:
                           - auth/email-already-in-use
                           - Outras validações
```

### REGISTRO COM GOOGLE

```
┌──────────────────────────────────────────────────────────┐
│ Usuario clica "Registrar com Google"                    │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────────────────┐
         │ registrarComGoogle()           │
         └────────┬─────────────────────┘
                  │
                  ├─ provider = new GoogleAuthProvider()
                  ├─ provider.setCustomParameters(...)
                  │
                  └─ signInWithPopup(auth, provider)
                     │
                     └─ result.user:
                        ├─ uid
                        ├─ displayName
                        ├─ email
                        └─ photoURL(?)
                          │
                          ├─ Verificar: docSnap.exists() →
                          │   'usuarios/{uid}'
                          │
                          ├─ SIM (já registrado):
                          │  └─ signOut(auth)
                          │     └─ Erro: "Já está registrado"
                          │
                          └─ NÃO:
                             └─ setDoc('usuarios/{uid}', {
                                  nome: displayName,
                                  apelido: displayName.split(' ')[0],
                                  email: email,
                                  favoritos: []
                                })
                                └─ Redirecionar /home
```

### LOGIN COM EMAIL/SENHA

```
┌────────────────────────────────────────────────────────┐
│ Tela de Login                                          │
│ Inputs: email, senha                                   │
└─────────────────┬──────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ fazerLogin()       │
         └────────┬───────────┘
                  │
                  ├─ Validar: email e senha não vazios
                  │
                  └─ signInWithEmailAndPassword(
                       auth, email, senha
                     )
                     │
                     ├─ ✅ Autenticado:
                     │  └─ Redirecionar /home
                     │
                     └─ ❌ Erro:
                        └─ Tratamentos:
                           ├─ auth/invalid-email
                           ├─ auth/user-not-found
                           ├─ auth/invalid-credential
                           └─ auth/too-many-requests
```

### LOGIN COM GOOGLE

```
┌────────────────────────────────────────────────────────┐
│ Usuario clica "Conectar com Google"                   │
└─────────────────┬──────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────────────────┐
         │ loginComGoogle()               │
         └────────┬─────────────────────┘
                  │
                  ├─ provider = new GoogleAuthProvider()
                  ├─ signInWithPopup(auth, provider)
                  │
                  └─ result.user ← uid de Google
                     │
                     └─ Verificar: docSnap.exists() →
                        'usuarios/{uid}'
                        │
                        ├─ ✅ SIM (registrado):
                        │  └─ Redirecionar /home
                        │
                        └─ ❌ NÃO:
                           └─ signOut(auth)
                              └─ Erro: "Registre-se primeiro"
```

---

## 📱 Tela Inicial - Carregamento de Dados do Usuário

```
┌────────────────────────────────────────────────────────────┐
│ TelaInicialComponent.ngOnInit()                           │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  ├─ auth.currentUser
                  │  │
                  │  ├─ SIM:
                  │  │  └─ getDoc('usuarios/{uid}')
                  │  │     │
                  │  │     ├─ docSnap.exists():
                  │  │     │  └─ nomeUsuario = dados.apelido
                  │  │     │              || dados.nome
                  │  │     │              || '🌱'
                  │  │     │
                  │  │     └─ !docSnap.exists():
                  │  │        └─ console.log('Não encontrado')
                  │  │
                  │  └─ NÃO:
                  │     └─ console.log('Não autenticado')
                  │
                  ▼
         ┌────────────────────┐
         │ Exibir na Tela:    │
         │ "Olá, João! 🌱"    │
         │ [Botões de Nav]    │
         └────────────────────┘
```

---

## 🔄 Ciclo de Vida - Sincronização de Dados

```
Aplicação Aberta
    │
    ├─ onInit/ngAfterViewInit
    │   ├─ Carregar dados: getDocs(), getDoc()
    │   │   └─ Array TODOSPROJ = readOnce
    │   │
    │   └─ Carregar Estado: favoritos[], usuário
    │       └─ Renderizar UI
    │
    ├─ Usuario Interage
    │   ├─ Filtra
    │   │   └─ Modificar array local (EN MEMÓRIA)
    │   │       └─ Sem sync com Firebase
    │   │
    │   ├─ Favorita
    │   │   └─ updateDoc() ← SYNC com Firebase
    │   │
    │   ├─ Deixa depoimento
    │   │   └─ addDoc() ← SYNC com Firebase
    │   │
    │   └─ Login/Logout
    │       └─ Auth mudança → Component se atualiza
    │
    └─ Sair / Navegar
        └─ onDestroy
            └─ Listeners não ativados (sem real-time)
```

**❌ Nota Importante:**
O projeto **NÃO** usa listeners em tempo real (`onSnapshot`). 
Usa apenas operações CRUD pontuais (`getDocs`, `getDoc`, `updateDoc`, `addDoc`).

---

## 📍 Cálculo de Distância - Fórmula Haversine

```typescript
function calcularDistanciaKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  
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

// Uso:
const distancia = calcularDistanciaKm(
  -23.5505, -46.6333,  // São Paulo
  -23.5906, -46.6581   // Parque Ibirapuera
);
// Result: ~5.8 km
```

---

## 🌐 Geocodificação - Nominatim OpenStreetMap

**Quando:** Usuario seleciona "Endereço manual"

```javascript
const endereco = "Av. Paulista, São Paulo";
const query = encodeURIComponent(endereco);
const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    // data = [{
    //   lat: "-23.5505",
    //   lon: "-46.6333",
    //   display_name: "Avenida Paulista, São Paulo...",
    //   ...
    // }]
    
    const latUser = parseFloat(data[0].lat);
    const lonUser = parseFloat(data[0].lon);
    
    // Marcar no mapa e filtrar
    L.marker([latUser, lonUser]).addTo(map);
    map.setView([latUser, lonUser], 14);
  })
  .catch(err => alert('Endereço não encontrado'));
```

---

## 📊 Resumo de Operações Firestore por Funcionalidade

| Funcionalidade | Operação | Coleção | Documento |
|---|---|---|---|
| Carregar mapa | getDocs() | ongs | todos |
| Carregar favoritos | getDoc() | usuarios | {uid} |
| Favoritar | updateDoc() + arrayUnion | usuarios | {uid} |
| Desfavoritar | updateDoc() + arrayRemove | usuarios | {uid} |
| Registrar usuário | setDoc() | usuarios | {uid} |
| Atualizar perfil | updateDoc() | usuarios | {uid} |
| Carregar depoimentos | getDocs() + query | depoimentos | todos |
| Adicionar depoimento | addDoc() | depoimentos | auto-gen |
| Verificar existe | getDoc() | usuarios | {uid} |

---

## ⚙️ Configuração de Segurança Firestore

**Recomendadas para produção:**

```javascript
// Firestore Rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Coleção: ongs (Pública - apenas leitura)
    match /ongs/{document=**} {
      allow read: if true;
      allow write: if false;  // Apenas admin
    }
    
    // Coleção: usuarios (Protegida)
    match /usuarios/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
    
    // Coleção: depoimentos (Protegida para escrita)
    match /depoimentos/{document=**} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
  }
}
```

---

**Documento gerado em**: 23/04/2026
