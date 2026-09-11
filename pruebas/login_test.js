import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 100,// número de usuarios virtuales simultáneos
  duration: '30s',// duración total de la prueba
};

const testEmail = __ENV.TEST_EMAIL;
const testPassword = __ENV.TEST_PASSWORD;

if (!testEmail || !testPassword) {
  throw new Error('Define TEST_EMAIL y TEST_PASSWORD antes de ejecutar esta prueba');
}

export default function () {
  let baseUrl = (__ENV.BASE_URL || 'https://empleojoven.ct.ws').replace(/\/$/, '');
  let url = `${baseUrl}/php/login.php`;

  let payload = JSON.stringify({
    correo: testEmail,
    password: testPassword,
    tipo_usuario: 'persona'          // o 'empresa'
  });

  let params = {
    headers: { 'Content-Type': 'application/json' },
  };

  let res = http.post(url, payload, params);

  check(res, {
    'status es 200': (r) => r.status === 200,
    'login exitoso': (r) => r.json('success') === true,
    'mensaje correcto': (r) => r.json('message') === 'Sesión iniciada con éxito',
  });

  sleep(1);
}
