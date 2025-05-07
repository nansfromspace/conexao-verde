import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import * as L from 'leaflet';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { BottomNavComponent } from '../shared/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-tela-do-mapa',
  standalone: true,
  imports: [CommonModule, TopNavComponent, BottomNavComponent],
  templateUrl: './tela-do-mapa.component.html',
  styleUrls: ['./tela-do-mapa.component.css']
})
export class TelaDoMapaComponent implements OnInit, AfterViewInit {
  private firestore: Firestore = inject(Firestore);
  projetos: any[] = [];
  private map!: L.Map;

  ngOnInit() {}

  async ngAfterViewInit() {
    this.map = L.map('map').setView([-23.5505, -46.6333], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
    }).addTo(this.map);
    

    setTimeout(() => this.map.invalidateSize(), 0);

    // ✅ Buscar dados após inicializar o mapa
    await this.carregarProjetosDoFirebase();
  }

  async carregarProjetosDoFirebase() {
    const customIcon = L.icon({
      iconUrl: 'assets/images/locationpin.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    const ongsRef = collection(this.firestore, 'ongs');
    const snapshot = await getDocs(ongsRef);

    snapshot.forEach((docSnap) => {
      const ongData = docSnap.data();
      const nomeOng = ongData['nome'];
      const atividades = ongData['atividades'];

      atividades.forEach((atividade: any) => {
        const projeto = {
          nome: atividade.nome,
          endereco: atividade.local,
          horario: atividade.horario,
          nomeOng: nomeOng,
          coordenadas: atividade.coordenadas
        };

        this.projetos.push(projeto);
        console.log('Atividade carregada:', projeto);

        const geo = atividade.coordenadas;
        if (geo && geo.latitude !== undefined && geo.longitude !== undefined) {
          L.marker([geo.latitude, geo.longitude], { icon: customIcon })
            .addTo(this.map)
            .bindPopup(`<strong>${atividade.nome}</strong><br>${atividade.local}`);
        }
      });
    });
  }
}
