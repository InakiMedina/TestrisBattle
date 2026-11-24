// Genera src/environments/environment.ts a partir de las variables de entorno.
//
// Angular no lee archivos .env por sí solo, así que este script se ejecuta
// automáticamente antes de `npm start`, `npm run build` y `npm test`
// (scripts prestart/prebuild/pretest de package.json).
//
// Prioridad de cada valor:
//   1. Variable de entorno del sistema (útil en CI o despliegue)
//   2. Archivo .env
//   3. Archivo .env.example (valores por defecto para desarrollo)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const values = {};
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
    values[key] = value;
  }
  return values;
}

const defaults = parseEnvFile(resolve(root, '.env.example'));
const local = parseEnvFile(resolve(root, '.env'));

function read(key) {
  const value = process.env[key] ?? local[key] ?? defaults[key];
  if (!value) {
    console.error(`[set-env] Falta la variable ${key}. Agrégala a frontend/.env`);
    process.exit(1);
  }
  return value;
}

const environment = {
  apiUrl: read('NG_APP_API_URL'),
  socketUrl: read('NG_APP_SOCKET_URL'),
};

const target = resolve(root, 'src/environments/environment.ts');
const content = `// ARCHIVO GENERADO por scripts/set-env.mjs a partir de .env. No lo edites a mano.
export const environment = ${JSON.stringify(environment, null, 2)};
`;

writeFileSync(target, content);
console.log(`[set-env] environment.ts generado (api: ${environment.apiUrl}, socket: ${environment.socketUrl})`);
