import { Component } from '@angular/core';

@Component({
  selector: 'app-rank-game-button',
  imports: [],
  template: ` 
    <button 
      type="button" 
      class="queue-btn" 
      [class.searching]="isSearching" 
      (click)="toggleQueue()">
      @if (isSearching) {
        <span class="pulse-indicator"></span>
        Waiting for match...
      } @else {
        Ranked Game
      }
    </button>
  `,
  styleUrl: './rank-game-button.scss',
})
export class RankGameButton {
  isSearching = false;

  toggleQueue(): void {
    this.isSearching = !this.isSearching;
  }
}
