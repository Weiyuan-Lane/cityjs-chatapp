import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroundingLink } from '../../types/message';

@Component({
  selector: 'app-grounding-links',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grounding-links.component.html',
  styleUrl: './grounding-links.component.scss',
})
export class GroundingLinksComponent {
  @Input() links: GroundingLink[] = [];
}
