import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameData } from './game-data';

describe('GameData', () => {
  let fixture: ComponentFixture<GameData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameData],
    }).compileComponents();

    fixture = TestBed.createComponent(GameData);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('disables the roll button until 1000 unspent points are available', () => {
    fixture.componentRef.setInput('stats', { score: 999, level: 0, lines: 0 });
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const button = root.querySelector<HTMLButtonElement>('.dice-button');
    expect(button?.disabled).toBe(true);
    expect(root.querySelector('.next-power-value')?.textContent?.trim()).toBe('1');

    fixture.componentRef.setInput('stats', { score: 1000, level: 0, lines: 0 });
    fixture.detectChanges();
    expect(button?.disabled).toBe(false);
  });

  it('resets power points on roll without changing the game score', () => {
    fixture.componentRef.setInput('stats', { score: 1250, level: 0, lines: 0 });
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const button = root.querySelector<HTMLButtonElement>('.dice-button');
    expect(root.querySelector('.unknown-power')?.textContent?.trim()).toBe('?');
    button?.click();
    fixture.detectChanges();

    expect(root.querySelector('.next-power-value')?.textContent?.trim()).toBe('1000');
    expect(root.querySelector('.score-value')?.textContent?.trim()).toBe('1250');
    expect(button?.disabled).toBe(true);
    expect(root.querySelector('.unknown-power')?.textContent?.trim()).toBe('?');
  });
});
