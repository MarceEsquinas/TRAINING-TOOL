import express from 'express';
import atletasRoute from './routes/crud/atletasRoute.js';
import objetivoRoute from './routes/crud/objetivoRoute.js';
import semanaEntrenamientoRoute from './routes/crud/semanaEntrenamientoRoute.js';
import sesionEntrenamientoRoute from './routes/crud/sesionEntrenamientoRoute.js';
import usuarioRoute from './routes/crud/usuarioRoute.js';
import feedbackRoute from './routes/crud/feedbackRoute.js';
import dashboardRoute from './routes/negocio/dashboardRoute.js';
import notificacionRoute from './routes/negocio/notificacionRoute.js';
import planificacionRoute from './routes/negocio/planificacionRoute.js';

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
app.use('/', feedbackRoute);

// Rutas de negocio: responden a pantallas/casos de uso de la aplicación.
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
