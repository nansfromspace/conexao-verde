import { Component, OnInit } from '@angular/core';
import { getApps } from 'firebase/app';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-firebase-teste',
  standalone: true,
  imports: [CommonModule],
  template: `<p>{{ status }}</p>`
})
export class FirebaseTesteComponent implements OnInit {
  status = 'Verificando Firebase...';

  ngOnInit() {
    const apps = getApps();
    this.status = apps.length > 0
      ? 'Firebase conectado. uhuuul!'
      : 'Firebase NÃO conectado, poxa. :(';
  }
}
