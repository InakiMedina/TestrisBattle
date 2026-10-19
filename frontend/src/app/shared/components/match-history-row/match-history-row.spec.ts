import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchHistoryRow } from './match-history-row';

describe('MatchHistoryRow', () => {
  let component: MatchHistoryRow;
  let fixture: ComponentFixture<MatchHistoryRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchHistoryRow],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchHistoryRow);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
