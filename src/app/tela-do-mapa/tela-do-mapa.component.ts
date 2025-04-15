import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';
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
  projetos = [
    {
      nome: 'Horta comunitária',
      endereco: 'Mooca, SP',
      horario: 'Aos sábados - 12h',
      nomeOng: 'ONG Plantar'
    },
    {
      nome: 'Mutirão de reciclagem',
      endereco: 'Vila Mariana, SP',
      horario: 'Domingos - 10h',
      nomeOng: 'Recicle Já'
    }
  ];

  ngOnInit() {}

  ngAfterViewInit(): void {
    const map = L.map('map').setView([-23.5505, -46.6333], 12); // Centro SP

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CartoDB'
    }).addTo(map);
    

    setTimeout(() => {
      map.invalidateSize();
    }, 0);

    // Exemplo de marcador
    L.marker([-23.5505, -46.6333])
      .addTo(map)
      .bindPopup('Horta comunitária');
  }
}
