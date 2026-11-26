// Fondo subido por el usuario y almacenado en S3.
export interface FondoPersonalizado {
  id: string;
  nombre: string;
  // Valor que se guarda en `background`: 'custom:<id>'
  ruta: string;
  // URL local (blob:) de la imagen descargada; null mientras se carga.
  url: string | null;
}
