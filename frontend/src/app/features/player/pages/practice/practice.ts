import { Component } from '@angular/core';
import {
  Ban,
  Expand,
  LucideAngularModule,
  Shuffle,
  WavesArrowDown,
  WavesArrowUp,
  Waypoints,
} from 'lucide-angular';

@Component({
  selector: 'app-practice',
  imports: [LucideAngularModule],
  templateUrl: './practice.html',
  styleUrl: './practice.scss',
})
export class Practice {
  readonly ExpandIcon = Expand;
  readonly ShuffleIcon = Shuffle;
  readonly BanIcon = Ban;
  readonly WavesArrowUpIcon = WavesArrowUp;
  readonly WavesArrowDownIcon = WavesArrowDown;
  readonly WaypointsIcon = Waypoints;
}
