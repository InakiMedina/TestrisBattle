import { Component } from '@angular/core';
import { MatchHistoryRow, ResultType } from '../../../../shared/components/match-history-row/match-history-row';

@Component({
  selector: 'app-ranking',
  imports: [MatchHistoryRow],
  templateUrl: './ranking.html',
  styleUrl: './ranking.scss'
})
export class Ranking {
  readonly ResultType = ResultType;
}
