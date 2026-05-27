import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import * as L from 'leaflet';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { BottomNavComponent } from '../shared/bottom-nav/bottom-nav.component';

function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

@Component({
  selector: 'app-tela-do-mapa',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavComponent, BottomNavComponent],
  templateUrl: './tela-do-mapa.component.html',
  styleUrls: ['./tela-do-mapa.component.css']
})
export class TelaDoMapaComponent implements OnInit, AfterViewInit {
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  projetos: any[] = [];
  todosProjetos: any[] = [];
  private map!: L.Map;

  filtroAberto = false;
  usarEndereco = false;
  filtroTiposSelecionados: string[] = [];
  filtroLocal: 'perto' | 'manual' | null = null;
  enderecoManual: string = '';

  favoritos: string[] = [];
  projetoFavoritado = false;

  participantes: number = 0;
  usuarioParticipa: boolean = false;
  participacoesMap: { [id: string]: number } = {};

  tiposSelecionados = {
    plantar: false,
    limpeza: false,
    outros: false
  };

  diasSelecionados = {
    segunda: false,
    terca: false,
    quarta: false,
    quinta: false,
    sexta: false,
    sabado: false,
    domingo: false
  };

  detalhesAbertos = false;
  projetoSelecionado: any = null;

  ngOnInit() {}

  async ngAfterViewInit() {
    this.map = L.map('map').setView([-23.5505, -46.6333], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
    }).addTo(this.map);
    setTimeout(() => this.map.invalidateSize(), 0);
    await this.carregarProjetosDoFirebase();
  }

  async carregarProjetosDoFirebase() {
    const ongsRef = collection(this.firestore, 'ongs');
    const snapshot = await getDocs(ongsRef);

    snapshot.forEach((docSnap) => {
      const ongData = docSnap.data();
      const nomeOng = ongData['nome'];
      const contatoOng = ongData['contato'];
      const atividades = ongData['atividades'];

      atividades.forEach((atividade: any, index: number) => {
        const projeto = {
          id: `${docSnap.id}_${index}`,
          nome: atividade.nome,
          endereco: atividade.local,
          horario: atividade.horario,
          nomeOng: nomeOng,
          contatoOng: contatoOng,
          coordenadas: atividade.coordenadas,
          tipo: atividade.tipo?.toLowerCase() || 'outros',
          diasSemana: this.normalizarDias(atividade.diasSemana)
        };

        this.todosProjetos.push(projeto);
      });
    });

    await this.carregarFavoritos();
    await this.carregarTodasParticipacoes();
    this.filtrarProjetos();
  }

  normalizarDias(valor: any): string[] {
    if (!valor) return [];
    if (Array.isArray(valor)) {
      return valor
        .map((d: any) => String(d).trim())
        .filter((d: string) => d.length > 0);
    }
    if (typeof valor === 'string' && valor.trim().length > 0) {
      return valor.split(',').map(d => d.trim()).filter(d => d.length > 0);
    }
    return [];
  }

  async carregarTodasParticipacoes() {
    try {
      const participacoesRef = collection(this.firestore, 'participacoes');
      const snapshot = await getDocs(participacoesRef);

      snapshot.forEach((docSnap) => {
        const dados = docSnap.data();
        const usuarios: string[] = dados['usuarios'] || [];
        this.participacoesMap[docSnap.id] = usuarios.length;
      });
    } catch (error) {
      console.error('Erro ao carregar participações:', error);
    }
  }

  async carregarParticipantesProjeto(projetoId: string) {
    try {
      const docRef = doc(this.firestore, 'participacoes', projetoId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const usuarios: string[] = docSnap.data()['usuarios'] || [];
        this.participantes = usuarios.length;
        const user = this.auth.currentUser;
        this.usuarioParticipa = user ? usuarios.includes(user.uid) : false;
      } else {
        this.participantes = 0;
        this.usuarioParticipa = false;
      }
    } catch (error) {
      console.error('Erro ao carregar participantes do projeto:', error);
      this.participantes = 0;
      this.usuarioParticipa = false;
    }
  }

  async carregarFavoritos() {
    const user = this.auth.currentUser;
    if (!user) return;

    const userDocRef = doc(this.firestore, 'usuarios', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      this.favoritos = userDoc.data()['favoritos'] || [];
    }
  }

  redesenharMarcadores() {
    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });

    const customIcon = L.icon({
      iconUrl: 'assets/images/locationpin.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    this.projetos.forEach(projeto => {
      const geo = projeto.coordenadas;
      if (!geo || geo.latitude == null || geo.longitude == null) return;

      L.marker([geo.latitude, geo.longitude], { icon: customIcon })
        .addTo(this.map)
        .on('click', () => this.abrirDetalhes(projeto));
    });
  }

  filtrarProjetos() {
    let filtrados = this.todosProjetos;

    // Filtro por tipo
    this.filtroTiposSelecionados = [];
    if (this.tiposSelecionados.plantar) this.filtroTiposSelecionados.push('plantar');
    if (this.tiposSelecionados.limpeza) this.filtroTiposSelecionados.push('limpeza de espaços');
    if (this.tiposSelecionados.outros) this.filtroTiposSelecionados.push('outros');

    if (this.filtroTiposSelecionados.length > 0) {
      filtrados = filtrados.filter(projeto =>
        this.filtroTiposSelecionados.includes(projeto.tipo)
      );
    }

    // Filtro por dia da semana
    const diasSelecionadosArray: string[] = [];
      if (this.diasSelecionados.segunda) diasSelecionadosArray.push('segunda');
      if (this.diasSelecionados.terca) diasSelecionadosArray.push('terca');
      if (this.diasSelecionados.quarta) diasSelecionadosArray.push('quarta');
      if (this.diasSelecionados.quinta) diasSelecionadosArray.push('quinta');
      if (this.diasSelecionados.sexta) diasSelecionadosArray.push('sexta');
      if (this.diasSelecionados.sabado) diasSelecionadosArray.push('sabado');
      if (this.diasSelecionados.domingo) diasSelecionadosArray.push('domingo');

      console.log('Dias selecionados:', diasSelecionadosArray);

      if (diasSelecionadosArray.length > 0) {
        filtrados = filtrados.filter(projeto => {
          console.log('Projeto:', projeto.nome, 'Dias:', projeto.diasSemana);
          
          // Verifica se o projeto tem dias da semana definidos
          if (!projeto.diasSemana) {
            return false;
          }
          
          // Converte para array se for string
          const diasProjeto = Array.isArray(projeto.diasSemana) 
            ? projeto.diasSemana 
            : [projeto.diasSemana];
          
          // Normaliza e compara (remove acentos e coloca em minúsculo)
          const diasProjetoNormalizados: string[] = diasProjeto.map((dia: string) => 
            dia.toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
          );
          
          const match = diasSelecionadosArray.some((dia: string) => 
            diasProjetoNormalizados.includes(dia)
          );
          
          console.log('Dias normalizados:', diasProjetoNormalizados, 'Match:', match);
          return match;
        });
    }

    if (this.filtroLocal === 'perto') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const latUser = position.coords.latitude;
            const lonUser = position.coords.longitude;

            this.projetos = filtrados.filter(projeto => {
              const coords = projeto.coordenadas;
              if (!coords || coords.latitude == null || coords.longitude == null) return false;
              const distancia = calcularDistanciaKm(latUser, lonUser, coords.latitude, coords.longitude);
              return distancia <= 5;
            });

            this.redesenharMarcadores();

            if (this.projetos.length > 0) {
              const primeiro = this.projetos[0].coordenadas;
              if (primeiro?.latitude && primeiro?.longitude) {
                this.map.setView([primeiro.latitude, primeiro.longitude], 14);
              }
            }
          },
          (error) => {
            alert('Permissão negada para obter localização.');
            this.projetos = filtrados;
            this.redesenharMarcadores();
          }
        );
        return;
      } else {
        alert('Geolocalização não suportada neste navegador.');
      }
    }

    if (this.filtroLocal === 'manual' && this.enderecoManual.trim() !== '') {
      const query = encodeURIComponent(this.enderecoManual.trim());
      const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          console.log('🔍 Resultado da geocodificação:', data);

          if (!data || data.length === 0) {
            alert('Endereço não encontrado.');
            this.projetos = [];
            this.redesenharMarcadores();
            return;
          }

          const latUser = parseFloat(data[0].lat);
          const lonUser = parseFloat(data[0].lon);

          const customIcon = L.icon({
            iconUrl: 'assets/images/locationpin.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
          });

          L.marker([latUser, lonUser], { icon: customIcon }).addTo(this.map);
          this.map.setView([latUser, lonUser], 14);

          this.projetos = filtrados.filter(projeto => {
            const coords = projeto.coordenadas;
            if (!coords || coords.latitude == null || coords.longitude == null) return false;
            const distancia = calcularDistanciaKm(latUser, lonUser, coords.latitude, coords.longitude);
            return distancia <= 5;
          });

          this.redesenharMarcadores();
        })
        .catch(() => {
          alert('Erro ao buscar o endereço.');
          this.projetos = filtrados;
          this.redesenharMarcadores();
        });

      return;
    }

    this.projetos = filtrados;
    this.redesenharMarcadores();

    if (this.projetos.length > 0) {
      const primeiro = this.projetos[0].coordenadas;
      if (primeiro?.latitude && primeiro?.longitude) {
        this.map.setView([primeiro.latitude, primeiro.longitude], 14);
      }
    }
  }

  abrirFiltro() {
    this.filtroAberto = true;
    this.usarEndereco = false;
  }

  fecharFiltro() {
    this.filtroAberto = false;
  }

  aplicarFiltro() {
    this.filtrarProjetos();
    this.fecharFiltro();
  }

  limparFiltro() {
    this.tiposSelecionados = { plantar: false, limpeza: false, outros: false };
    this.diasSelecionados = { segunda: false, terca: false, quarta: false, quinta: false, sexta: false, sabado: false, domingo: false };
    this.filtroLocal = null;
    this.enderecoManual = '';
    this.projetos = [...this.todosProjetos];
    this.redesenharMarcadores();
    this.map.setView([-23.5505, -46.6333], 12);
  }

  async abrirDetalhes(projeto: any) {
    this.projetoSelecionado = projeto;
    this.detalhesAbertos = true;
    this.projetoFavoritado = this.favoritos.includes(projeto.id);
    await this.carregarParticipantesProjeto(projeto.id);
  }

  fecharDetalhes() {
    this.detalhesAbertos = false;
    this.projetoSelecionado = null;
    this.projetoFavoritado = false;
    this.participantes = 0;
    this.usuarioParticipa = false;
  }

  async toggleParticipacao() {
    const user = this.auth.currentUser;

    if (!user) {
      alert('Faça login para confirmar sua participação!');
      return;
    }

    if (!this.projetoSelecionado?.id) {
      alert('Erro ao confirmar participação.');
      return;
    }

    const projetoId = this.projetoSelecionado.id;
    const docRef = doc(this.firestore, 'participacoes', projetoId);

    try {
      if (this.usuarioParticipa) {
        await updateDoc(docRef, {
          usuarios: arrayRemove(user.uid)
        });
        this.usuarioParticipa = false;
        this.participantes = Math.max(0, this.participantes - 1);
        this.participacoesMap[projetoId] = this.participantes;
      } else {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, {
            usuarios: [user.uid]
          });
        } else {
          await updateDoc(docRef, {
            usuarios: arrayUnion(user.uid)
          });
        }
        this.usuarioParticipa = true;
        this.participantes = this.participantes + 1;
        this.participacoesMap[projetoId] = this.participantes;
      }
    } catch (error: any) {
      console.error('Erro ao confirmar participação:', error);
      if (error?.code === 'permission-denied') {
        alert('Sem permissão no Firestore. Atualize as regras de segurança da coleção "participacoes".');
      } else {
        alert('Erro ao confirmar participação. Tente novamente.');
      }
    }
  }

  async toggleFavorito() {
    const user = this.auth.currentUser;
    
    if (!user) {
      alert('Faça login para favoritar projetos!');
      return;
    }

    if (!this.projetoSelecionado?.id) {
      alert('Erro ao favoritar projeto.');
      return;
    }

    const userDocRef = doc(this.firestore, 'usuarios', user.uid);
    const projetoId = this.projetoSelecionado.id;

    try {
      if (this.projetoFavoritado) {
        // Remover dos favoritos
        await updateDoc(userDocRef, {
          favoritos: arrayRemove(projetoId)
        });
        this.favoritos = this.favoritos.filter(id => id !== projetoId);
        this.projetoFavoritado = false;
      } else {
        // Adicionar aos favoritos
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          // Se não existe, criar o documento
          await setDoc(userDocRef, {
            favoritos: [projetoId]
          }, { merge: true });
        } else {
          await updateDoc(userDocRef, {
            favoritos: arrayUnion(projetoId)
          });
        }
        this.favoritos.push(projetoId);
        this.projetoFavoritado = true;
      }
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      alert('Erro ao favoritar projeto. Tente novamente.');
    }
  }

  copiarContato() {
    if (this.projetoSelecionado?.contatoOng) {
      navigator.clipboard.writeText(String(this.projetoSelecionado.contatoOng))
        .then(() => alert('Contato da ONG copiado com sucesso!'))
        .catch(() => alert('Erro ao copiar o contato.'));
    } else {
      alert('Contato da ONG não disponível.');
    }
  }

  abrirWhatsApp() {
    console.log('Projeto selecionado:', this.projetoSelecionado);
    console.log('Contato ONG:', this.projetoSelecionado?.contatoOng);
    
    if (!this.projetoSelecionado?.contatoOng) {
      alert('Contato da ONG não disponível.');
      return;
    }

    // Converter para string e remover caracteres não numéricos do telefone
    const telefone = String(this.projetoSelecionado.contatoOng).replace(/\D/g, '');
    console.log('Telefone limpo:', telefone);
    
    if (!telefone) {
      alert('Número de telefone inválido.');
      return;
    }
    
    // Mensagem padrão
    const mensagem = `Olá! Vim pelo Conexão Verde e gostaria de participar do projeto "${this.projetoSelecionado.nome}". Poderia me dar mais informações?`;
    
    // Codificar a mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem);
    
    // Criar URL do WhatsApp
    const urlWhatsApp = `https://wa.me/${telefone}?text=${mensagemCodificada}`;
    console.log('URL WhatsApp:', urlWhatsApp);
    
    // Abrir em nova aba
    window.open(urlWhatsApp, '_blank');
  }
}
