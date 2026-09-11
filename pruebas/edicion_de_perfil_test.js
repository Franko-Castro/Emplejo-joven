import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50,          // usuarios simultáneos
  iterations: 40,   // total de intentos de edición
  noCookiesReset: true,
};

const baseUrl = (__ENV.BASE_URL || 'http://localhost').replace(/\/$/, '');
const testEmail = __ENV.TEST_EMAIL;
const testPassword = __ENV.TEST_PASSWORD;

if (!testEmail || !testPassword) {
  throw new Error('Define TEST_EMAIL y TEST_PASSWORD antes de ejecutar esta prueba');
}

const credentials = {
  correo: testEmail,
  password: testPassword,
  tipo_usuario: 'persona',
};

let authenticated = false;

export default function () {
  let url = `${baseUrl}/php/perfil_postulante.php`;

  if (!authenticated) {
    const loginResponse = http.post(
      `${baseUrl}/php/login.php`,
      JSON.stringify(credentials),
      { headers: { 'Content-Type': 'application/json' } }
    );

    const loginOk = check(loginResponse, {
      'login para editar exitoso': (response) =>
        response.status === 200 && response.json('success') === true,
    });

    if (!loginOk) {
      return;
    }

    authenticated = true;
  }

  let payload = {
    nombre_completo: 'Frank Martínez',
    correo: credentials.correo,
    telefono: '3001234567',
    cargo_profesion: 'Desarrollador Web',
    id_categoria: '1', // debe existir en tu BD
    cargo_interes: 'Backend Developer',
    descripcion_profesional: 'Experto en PHP y JavaScript',
    experiencia: '5 años en proyectos de software',
    habilidades: 'PHP, JS, SQL',
  };

  let res = http.post(url, payload);

  check(res, {
    'status es 200': (r) => r.status === 200,
    'perfil actualizado': (r) => r.json('success') === true,
    'mensaje correcto': (r) => r.json('message') === 'Tu perfil y hoja de vida se han actualizado exitosamente',
  });

  sleep(1);
}
