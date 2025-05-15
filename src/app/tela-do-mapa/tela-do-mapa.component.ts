import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
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
  projetos: any[] = [];
  todosProjetos: any[] = [];
  private map!: L.Map;

  filtroAberto = false;
  usarEndereco = false;
  filtroTiposSelecionados: string[] = [];
  filtroLocal: 'perto' | 'manual' | null = null;
  enderecoManual: string = '';

  tiposSelecionados = {
    plantar: false,
    limpeza: false,
    outros: false
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

      atividades.forEach((atividade: any) => {
        const projeto = {
          nome: atividade.nome,
          endereco: atividade.local,
          horario: atividade.horario,
          nomeOng: nomeOng,
          contatoOng: contatoOng,
          coordenadas: atividade.coordenadas,
          tipo: atividade.tipo?.toLowerCase() || 'outros'
        };

        this.todosProjetos.push(projeto);
      });
    });

    this.filtrarProjetos();
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

    this.filtroTiposSelecionados = [];
    if (this.tiposSelecionados.plantar) this.filtroTiposSelecionados.push('plantar');
    if (this.tiposSelecionados.limpeza) this.filtroTiposSelecionados.push('limpeza de espaços');
    if (this.tiposSelecionados.outros) this.filtroTiposSelecionados.push('outros');

    if (this.filtroTiposSelecionados.length > 0) {
      filtrados = filtrados.filter(projeto =>
        this.filtroTiposSelecionados.includes(projeto.tipo)
      );
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
    this.filtroLocal = null;
    this.enderecoManual = '';
    this.projetos = [...this.todosProjetos];
    this.redesenharMarcadores();
    this.map.setView([-23.5505, -46.6333], 12);
  }

  abrirDetalhes(projeto: any) {
    this.projetoSelecionado = projeto;
    this.detalhesAbertos = true;
  }

  fecharDetalhes() {
    this.detalhesAbertos = false;
    this.projetoSelecionado = null;
  }

  copiarContato() {
    if (this.projetoSelecionado?.contatoOng) {
      navigator.clipboard.writeText(this.projetoSelecionado.contatoOng)
        .then(() => alert('Contato da ONG copiado com sucesso!'))
        .catch(() => alert('Erro ao copiar o contato.'));
    } else {
      alert('Contato da ONG não disponível.');
    }
  }
}
