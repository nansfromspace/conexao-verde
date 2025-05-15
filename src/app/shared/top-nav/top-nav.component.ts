import { Component } from '@angular/core';
import { getAuth, signOut } from 'firebase/auth';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.css']
})
export class TopNavComponent {
  logout() {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        window.location.href = '/login'; // redirecionar após logout
      })
      .catch((error) => {
        console.error('Erro ao fazer logout:', error);
      });
  }
}
