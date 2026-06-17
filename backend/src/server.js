import express from 'express';
import { query } from './config/db.js';
import testRoute from './routes/testRoute.js';
import atletasRoute from './routes/atletasRoute.js';
import objetivoRoute from './routes/objetivoRoute.js';
import semanaEntrenamientoRoute from './routes/semanaEntrenamientoRoute.js';
import sesionEntrenamientoRoute from './routes/sesionEntrenamientoRoute.js';
import usuarioRoute from './routes/usuarioRoute.js';
import feedbackRoute from './routes/feedbackRoute.js';
import dashboardRoute from './routes/dashboardRoute.js';
import notificacionRoute from './routes/notificacionRoute.js';

const app = express();
const PORT = 3000;

// Middleware para parsear JSON en el cuerpo de las peticiones.
app.use(express.json());

// Monta las rutas definidas en src/routes.
// La ruta de prueba quedará accesible en GET /api/test.
app.use('/api', testRoute);

// Monta la ruta de atletas para que se acceda en /atletas.
app.use('/', atletasRoute);

// Monta la ruta de objetivos para que se acceda en /objetivos.
app.use('/', objetivoRoute);

// Monta la ruta de usuarios para que se acceda en /usuarios.
app.use('/', usuarioRoute);

// Monta la ruta de semanas de entrenamiento para que se acceda en /semanasEntrenamiento.
app.use('/', semanaEntrenamientoRoute);

// Monta la ruta de sesiones de entrenamiento para que se acceda en /sesionesEntrenamiento.
app.use('/', sesionEntrenamientoRoute);

// Monta la ruta de feedback para que se acceda en /feedback.
app.use('/', feedbackRoute);
// Dashboard
app.use('/', dashboardRoute);
app.use('/', notificacionRoute);

// Ruta básica existente
app.get('/', (req, res) => {
  res.send('la cosa va bien');
});

// Ruta para probar la conexión a PostgreSQL
app.get('/test-db', async (req, res) => {
  try {
    // Ejecuta una consulta simple para comprobar la conexión
    const result = await query('SELECT NOW() AS now');

    // Envía el resultado al cliente
    res.json({ success: true, databaseTime: result.rows[0].now });
  } catch (error) {
    console.error('Error al consultar PostgreSQL:', error);
    res.status(500).json({ success: false, message: 'Error de conexión a la base de datos' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
