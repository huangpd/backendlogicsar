import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import conectarDB from "./config/db.js";
import router from "./routes/usuarioRoutes.js";
import clientesRouter from "./routes/clientesRoutes.js";
import facturasRouter from "./routes/facturasRoutes.js";
import proveedoresRouter from "./routes/proveedorRoutes.js";
import contableRouter from "./routes/contableRoutes.js";
import servicioRouter from "./routes/servicioRoutes.js";
import minutasRouter from "./routes/minutasRoutes.js";

const app = express();
app.use(express.json());

dotenv.config();

conectarDB();

// Configurar CORS
const whitelist = [process.env.FRONTEND_URL];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.includes(origin)) {
      // Puede consultar la API
      callback(null, true);
    } else {
      // No esta permitido su request
      callback(new Error("Error de Cors"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"], // Agrega los métodos utilizados en tu aplicación
  allowedHeaders: ["Content-Type", "Authorization"], // Agrega los encabezados utilizados en tu aplicación
  credentials: true, // Habilitar el manejo de solicitudes con cookies
};

app.use(cors(corsOptions));

// Routing
app.use("/api/usuarios", router);
app.use("/api/clientes", clientesRouter);
app.use("/api/proveedores", proveedoresRouter);
app.use("/api/contable", contableRouter);
app.use("/api/servicio", servicioRouter);
app.use("/api/minutas", minutasRouter);
app.use("/api/facturas", facturasRouter);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
