import express from 'express';
import cors from 'cors';
import atletasRoute from './routes/crud/atletasRoute.js';
import objetivoRoute from './routes/crud/objetivoRoute.js';
import semanaEntrenamientoRoute from './routes/crud/semanaEntrenamientoRoute.js';
import sesionEntrenamientoRoute from './routes/crud/sesionEntrenamientoRoute.js';
import usuarioRoute from './routes/crud/usuarioRoute.js';
import feedbackRoute from './routes/crud/feedbackRoute.js';
import entrenadoresRoute from './routes/crud/entrenadoresRoute.js';
import dashboardRoute from './routes/negocio/dashboardRoute.js';
import planificacionRoute from './routes/negocio/planificacionRoute.js';
import historialAtletaRoute from './routes/negocio/historialAtletaRoute.js';
import administracionRoute from './routes/negocio/administracionRoute.js';

const app = express();
const PORT = 3000;

// Middleware para parsear JSON en el cuerpo de las peticiones.
app.use(cors());
app.use(express.json());

// Rutas CRUD: operaciones básicas sobre las entidades del sistema.
app.use('/', atletasRoute);
app.use('/', objetivoRoute);
app.use('/', usuarioRoute);
app.use('/', semanaEntrenamientoRoute);
app.use('/', sesionEntrenamientoRoute);
app.use('/', feedbackRoute);
app.use('/', entrenadoresRoute);

// Rutas de negocio: responden a pantallas/casos de uso de la aplicación.
app.use('/', dashboardRoute);
app.use('/', planificacionRoute);
app.use('/', historialAtletaRoute);
app.use('/', administracionRoute);

// Ruta básica existente
app.get('/', (req, res) => {
  res.send('la cosa va bien');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
