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
import { bot } from "./whatsappbot.js";

const app = express();
app.use(express.json());

dotenv.config();

conectarDB();

// Configurar CORS
app.use(cors());

// Middleware para contar los requests
let requestCount = 0;
app.use((req, res, next) => {
  requestCount++;
  console.log(
    `Request: ${req.method} ${req.originalUrl} req nro: ${requestCount}`
  );
  next();
});

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
  console.log(`Número total de requests realizados hoy: ${requestCount}`);
});

bot();
