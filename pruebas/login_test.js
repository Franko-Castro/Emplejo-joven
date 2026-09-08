import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 100,// número de usuarios virtuales simultáneos
  duration: '30s',// duración total de la prueba
};

export default function () {
  let baseUrl = (__ENV.BASE_URL || 'http://localhost').replace(/\/$/, '');
  let url = `${baseUrl}/php/login.php`;

  let payload = JSON.stringify({
    correo: 'fm3949461@gmail.com',   // debe existir en tu BD
    password: '14101015',            // debe coincidir con el hash
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
