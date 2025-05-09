import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome, faMap, faSeedling } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.css'],
  imports: [CommonModule, RouterModule, FontAwesomeModule]
})
export class BottomNavComponent {
  constructor(library: FaIconLibrary) {
    library.addIcons(faHome, faMap, faSeedling);
}
}