import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RankGameButton } from './rank-game-button';

describe('RankGameButton', () => {
  let component: RankGameButton;
  let fixture: ComponentFixture<RankGameButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RankGameButton],
    }).compileComponents();

    fixture = TestBed.createComponent(RankGameButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
