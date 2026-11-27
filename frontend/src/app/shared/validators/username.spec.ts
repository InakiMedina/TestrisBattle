import { getUsernameError } from './username';

describe('reglas del nombre de usuario', () => {
  it.each(['ab', 'jugador_1', 'pro-gamer', 'José_Ñandú', 'Ünïcödé', 'a'.repeat(20)])(
    'acepta "%s"',
    (name) => {
      expect(getUsernameError(name)).toBeNull();
    },
  );

  it('exige el campo', () => {
    expect(getUsernameError('')).toBe('Este campo es requerido');
  });

  it('exige al menos 2 caracteres', () => {
    expect(getUsernameError('a')).toContain('mínimo de 2');
  });

  it('permite como máximo 20 caracteres', () => {
    expect(getUsernameError('a'.repeat(21))).toContain('máxima de 20');
  });

  it.each(['con espacio', ' inicio', 'hola!', 'user@mail', 'punto.final', 'emoji😀'])(
    'rechaza espacios y símbolos: "%s"',
    (name) => {
      expect(getUsernameError(name)).toContain('Solo se permiten letras, números');
    },
  );
});
