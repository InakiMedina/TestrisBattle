import { Component, input } from '@angular/core';

export enum ResultType {
  WON,
  LOST,
}

@Component({
  selector: 'match-row-component',
  imports: [],
  templateUrl: './match-history-row.html',
  styleUrl: './match-history-row.scss'
})
export class MatchHistoryRow {
    readonly Result = ResultType;

    opponent = input.required<string>();
    result = input.required<ResultType>();
    duration = input.required<string>();
    dateTime = input.required<string>();
    score = input.required<number>();
}
