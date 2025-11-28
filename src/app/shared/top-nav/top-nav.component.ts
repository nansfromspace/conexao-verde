import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, signOut } from 'firebase/auth';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.css']
})
export class TopNavComponent {
  private router = inject(Router);

  voltarParaHome() {
    this.router.navigate(['/home']);
  }

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
