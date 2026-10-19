import { Component } from '@angular/core';
import { MatchHistoryRow, ResultType } from '../../../../shared/components/match-history-row/match-history-row';

@Component({
  selector: 'app-history',
  imports: [MatchHistoryRow],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class History {
  readonly ResultType = ResultType;
}
