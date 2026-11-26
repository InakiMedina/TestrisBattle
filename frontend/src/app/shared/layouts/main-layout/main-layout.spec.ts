import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BackgroundHandler } from '../../../services/background-handler';
import { UserFilesService } from '../../../services/user-files.service';
import { MainLayout } from './main-layout';

describe('MainLayout', () => {
  let component: MainLayout;
  let fixture: ComponentFixture<MainLayout>;
  const backgroundHandler = {
    restoreSavedBackground: vi.fn(() => Promise.resolve()),
    reset: vi.fn(),
  };
  const userFiles = { clearCache: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([]),
        { provide: BackgroundHandler, useValue: backgroundHandler },
        { provide: UserFilesService, useValue: userFiles },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('inicia las vistas con el fondo guardado del usuario', () => {
    expect(backgroundHandler.restoreSavedBackground).toHaveBeenCalled();
  });

  it('quita el fondo y libera las imágenes al salir (cerrar sesión)', () => {
    fixture.destroy();
    expect(backgroundHandler.reset).toHaveBeenCalled();
    expect(userFiles.clearCache).toHaveBeenCalled();
  });
});
