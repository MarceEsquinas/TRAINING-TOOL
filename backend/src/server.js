import express from 'express';
import atletasRoute from './routes/atletasRoute.js';
import objetivoRoute from './routes/objetivoRoute.js';
import semanaEntrenamientoRoute from './routes/semanaEntrenamientoRoute.js';
import sesionEntrenamientoRoute from './routes/sesionEntrenamientoRoute.js';
import usuarioRoute from './routes/usuarioRoute.js';
import feedbackRoute from './routes/feedbackRoute.js';
import dashboardRoute from './routes/dashboardRoute.js';
import notificacionRoute from './routes/notificacionRoute.js';
import planificacionRoute from './routes/planificacionRoute.js';

const app = express();
const PORT = 3000;

// Middleware para parsear JSON en el cuerpo de las peticiones.
app.use(express.json());

// Rutas CRUD: operaciones básicas sobre las entidades del sistema.
app.use('/', atletasRoute);
app.use('/', objetivoRoute);
app.use('/', usuarioRoute);
app.use('/', semanaEntrenamientoRoute);
app.use('/', sesionEntrenamientoRoute);
// Rutas de negocio: responden a pantallas/casos de uso de la aplicación.
app.use('/', feedbackRoute);
app.use('/', dashboardRoute);
app.use('/', notificacionRoute);
app.use('/', planificacionRoute);

// Ruta básica existente
app.get('/', (req, res) => {
  res.send('la cosa va bien');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
