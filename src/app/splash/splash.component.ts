import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.css']
})
export class SplashComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.router.navigate(['/introducao']); // ou /login, se preferir
    }, 3000); // tempo de exibição da splash (3 segundos)
  }
}
