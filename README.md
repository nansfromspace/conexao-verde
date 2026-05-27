# 🌱 Conexão Verde

**Conexão Verde** é um aplicativo voltado à sustentabilidade que conecta pessoas interessadas em causas ambientais com projetos locais, como plantio de árvores, hortas urbanas, limpeza de espaços públicos e ações de reflorestamento.

---

## 👩‍💻 Criadoras

- **Lara Alves de Oliveira**
- **Nathalie Giuliani de Oliveira**

---

## ✨ Funcionalidades

### Autenticação
✅ Login e registro com email/senha  
✅ Login e registro com Google OAuth  
✅ Validação de usuário registrado antes do login  

### Mapa Interativo
✅ Visualização de projetos ambientais no mapa com Leaflet  
✅ Marcadores personalizados por tipo de projeto  
✅ Modal de detalhes completo (tipo, endereço, horário, ONG, dias da semana e contador de participantes)  
✅ Botão de contato via WhatsApp com mensagem predefinida  
✅ Sistema de favoritar/desfavoritar projetos  

### Filtros Avançados
✅ Filtro por tipo de projeto (Plantar, Limpeza, Outros)  
✅ Filtro por localização (Perto de mim ou endereço manual)  
✅ Filtro por dia da semana   

### Favoritos
✅ Página dedicada para projetos favoritados  
✅ Sincronização em tempo real com Firestore  
✅ Desfavoritar com um clique  

### Confirmação de Participação
✅ Botão de "Confirmar participação" em cada projeto  
✅ Contador de pessoas confirmadas exibido no modal e no card  
✅ Permite cancelar a participação a qualquer momento  
✅ Sincronização com Firestore (coleção `participacoes`)  

### Depoimentos
✅ Página de avaliações com sistema de estrelas (1-5)  
✅ Adicionar depoimento com texto e classificação  
✅ Ícones de plantas aleatórios por usuário  
✅ Timestamp automático com serverTimestamp  

### Navegação
✅ Bottom navigation bar com 3 seções (Mapa, Depoimentos, Favoritos)  
✅ Top navigation com logo clicável para voltar à home  
✅ Botão de logout  

---

## 🛠️ Tecnologias Utilizadas

- **Angular 19.2** (Standalone Components)
- **TypeScript 5.7.2** (Strict mode)
- **Firebase** (Firestore + Authentication)
- **Leaflet 1.9.4** (Mapas interativos)
- **Font Awesome 6.7** (Ícones)
- **RxJS 7.8** (Programação reativa)
- **Service Worker** (PWA)
- HTML5 + CSS3
- Git + GitHub

---

## 🚀 Como rodar o projeto localmente

1. **Clone o repositório**
```bash
git clone https://github.com/nansfromspace/conexao-verde.git
cd conexao-verde
```

2. **Instale as dependências**
```bash
npm install
```

3. **Inicie o servidor de desenvolvimento**
```bash
ng serve
```

4. **Acesse o aplicativo**
   - Abra seu navegador em `http://localhost:4200`

---

## 📱 Estrutura do Projeto

```
src/
├── app/
│   ├── shared/
│   │   ├── top-nav/           # Barra de navegação superior
│   │   └── bottom-nav/        # Barra de navegação inferior
│   ├── splash/                # Tela de abertura
│   ├── tela-de-introducao/    # Slides introdutórios
│   ├── tela-de-login/         # Login (Email/Google)
│   ├── tela-de-registro/      # Registro (Email/Google)
│   ├── tela-inicial/          # Home com botão para o mapa
│   ├── tela-do-mapa/          # Mapa interativo + filtros
│   ├── tela-de-favoritos/     # Lista de favoritos
│   └── tela-de-depoimentos/   # Avaliações e depoimentos
├── assets/
│   └── images/                # Logos e ícones
└── environments/              # Configurações de ambiente
```

---

## 🧪 Testes Automatizados

O projeto utiliza **Robot Framework** com **SeleniumLibrary** para testes E2E automatizados.

### Executar os testes

1. **Instale as dependências do Robot Framework**
```bash
pip install -r tests/requirements.txt
```

2. **Certifique-se de que o servidor está rodando**
```bash
ng serve
```

3. **Em outro terminal, execute os testes**
```bash
robot -d results tests/automacao/tests/
```

### Estrutura dos testes

```
tests/
├── automacao/
│   ├── pages/              # Page Objects (elementos das páginas)
│   ├── resources/          # Recursos compartilhados
│   ├── steps/              # Steps reutilizáveis
│   └── tests/
│       ├── componentes/    # Testes de componentes individuais
│       └── E2E/            # Testes de fluxo completo
```

### Cobertura de testes

✅ **Tela de Introdução** - Validação de elementos da interface  
✅ **Fluxo de Login** - Login com credenciais válidas e navegação  

### Relatórios

Após a execução, os relatórios são gerados na pasta `results/`:
- `report.html` - Relatório visual detalhado
- `log.html` - Log completo da execução
- `output.xml` - Saída em XML para integração

---

## 📧 Contato

Para dúvidas ou sugestões, entre em contato com as criadoras através do GitHub
