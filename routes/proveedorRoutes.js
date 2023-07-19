import express from "express";

const router = express.Router();

import {
  editarProveedor,
  obtenerProveedor,
  nuevoProveedor,
  comprobarProveedor,
  obtenerProveedores,
  cargarFactura,
  obtenerFacturasaPagar,
  pagarFactura,
  nuevoChofer,
  nuevoCamion,
  obtenerCamiones,
  obtenerChoferes,
  nuevoSemi,
  obtenerSemis,
  nuevoEquipo,
  obtenerEquipos,
  editarChofer,
  editarCamion,
  editarSemi,
} from "../controllers/proveedoresController.js";

import checkAuth from "../middleware/checkAuth.js";

router
  .route("/")
  .get(checkAuth, obtenerProveedores)
  .post(checkAuth, nuevoProveedor);
router.route("/:id").put(checkAuth, editarProveedor);

router.get("/obtener/:id", checkAuth, obtenerProveedor);
router.get("/obtener-facturas", checkAuth, obtenerFacturasaPagar);
router.get("/obtener-camiones/:id", checkAuth, obtenerCamiones);
router.get("/obtener-choferes/:id", checkAuth, obtenerChoferes);
router.get("/obtener-semis/:id", checkAuth, obtenerSemis);
router.get("/obtener-equipos/:id", checkAuth, obtenerEquipos);

router.post("/cargar-factura", checkAuth, cargarFactura);
router.post("/cambiar-estado/:id", checkAuth, pagarFactura);
router.post("/nuevo-chofer/:id", checkAuth, nuevoChofer);
router.post("/nuevo-camion/:id", checkAuth, nuevoCamion);
router.post("/nuevo-semi/:id", checkAuth, nuevoSemi);
router.post("/nuevo-equipo/:id", checkAuth, nuevoEquipo);

router.post("/comprobar", checkAuth, comprobarProveedor);

router.put("/editar-chofer/:id", checkAuth, editarChofer);
router.put("/editar-camion/:id", checkAuth, editarCamion);
router.put("/editar-semi/:id", checkAuth, editarSemi);

//TODO: Agregar facturas a los clientes

//TODO: Agregar Recibos a los clientes

//TODO: Agregar Adicionales a los clientes

//TODO: Agregar Usuarios a los clientes

export default router;
