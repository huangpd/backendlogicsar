import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "archivosSubidos"));
  },
  filename: async function (req, file, cb) {
    const { id } = req.params;
    const viaje = await Documentacion.findById(id);
    const nuevoNombre =
      String(viaje.numeroViaje).replace("/", "-") +
      path.extname(file.originalname);
    cb(null, nuevoNombre);
  },
});

const upload = multer({ storage: storage }).single("archivo");

import {
  obtenerServicio,
  obtenerServiciosCliente,
  asignarProveedor,
  obtenerServiciosProveedor,
  aceptarServicio,
  obtenerServicios,
  obtenerServiciosHoy,
  obtenerServiciosManana,
  obtenerTodosLosServicios,
  nuevaTerminal,
  nuevoServicioImportacion,
  nuevoServicioExportacion,
  nuevoTransito,
  nuevoServicioNacional,
  obtenerViajesServicio,
  obtenerViaje,
  asignarEquipo,
  aprobarEquipo,
  viajesHoy,
  viajesAyerSinCerrar,
  viajesFuturosSinCerrar,
  nuevoEstadoServicio,
  nuevoEstadoViaje,
  obtenerEstadosServicio,
  actualizarEstadoServicio,
  obtenerEstadosViaje,
  reasignarProveedor,
  nuevoLugarDevolucion,
  actualizarEstadoViaje,
  editarViaje,
  obtenerSinNotificar,
  notificarViaje,
  notificarAceptacion,
  obtenerActualizaciones,
  busqueda,
  actualizarObservacionesServicio,
  eliminarViaje,
  eliminarServicio,
  terminarViaje,
  buscarTodosLosViajes,
  filtrarViajes,
  notificarAlChofer,
  obtenerDocumentacion,
  editarDocumento,
  obtenerConceptos,
  nuevoServicioDevolucionVacios,
  completarDevolucion,
  editarConcepto,
  agregarConcepto,
  agregarViajes,
  obtenerViajesValorizarCliente,
  nuevaRoundTripExpo,
  nuevoEmptyPickUp,
  obtenerTodosLosViajesPorValorizarPorCliente,
  actualizarPrecioViajesDesdeClientes,
  actualizarAdicionalCliente,
  obtenerTodosLosServiciosAFacturar,
  actualizarNumeroFacturaDesdeClientes,
  completarDevolucionListado,
  eliminarEquipos,
  eliminarProveedor,
  infoWhatsappLogicsar,
  infoWhatsappChofer,
  notificarChofer,
  obtenerDocumentacionPendiente,
  subirDocumento,
} from "../controllers/servicioController.js";

import { consultarAutenticacion } from "../whatsappbot.js";

import checkAuth from "../middleware/checkAuth.js";
import Documentacion from "../models/Documentacion.js";

router.get("/consultar-autenticacion", checkAuth, consultarAutenticacion);

router.get("/", checkAuth, obtenerServicios);
router.get("/hoy", checkAuth, obtenerServiciosHoy);
router.get("/manana", checkAuth, obtenerServiciosManana);
router.get("/todos-servicios", checkAuth, obtenerTodosLosServiciosAFacturar);

router.get("/todos-servicios-en-curso", checkAuth, obtenerTodosLosServicios);

router.get(
  "/obtener-todos-los-viajes-por-valorizar-por-clientes",
  checkAuth,
  obtenerTodosLosViajesPorValorizarPorCliente
);

router.get("/obtener-viajes/:id", checkAuth, obtenerViajesServicio);

router.get("/obtener-viaje/:id", checkAuth, obtenerViaje);

router.get("/obtener-documentacion/:id", checkAuth, obtenerDocumentacion);

router.get("/obtener-viajes-sin-notificar", checkAuth, obtenerSinNotificar);

router.get("/obtener-actualizaciones", checkAuth, obtenerActualizaciones);
router.post("/obtener-viajes-filtrados", checkAuth, filtrarViajes);

router.get("/obtener-viajes-hoy/", checkAuth, viajesHoy);
router.get("/obtener-viajes-ayer/", checkAuth, viajesAyerSinCerrar);
router.get("/obtener-viajes-futuro/", checkAuth, viajesFuturosSinCerrar);

router.get(
  "/obtener-viajes-liquidacion-clientes/:id",
  checkAuth,
  obtenerViajesValorizarCliente
);

router.get("/obtener-estados-servicio", checkAuth, obtenerEstadosServicio);
router.get("/obtener-estados-viaje", checkAuth, obtenerEstadosViaje);

router.get("/obtener-todos-viajes", checkAuth, buscarTodosLosViajes);

router.get(
  "/obtener-documentacion-pendiente",
  checkAuth,
  obtenerDocumentacionPendiente
);

router.post("/buscar", checkAuth, busqueda);

router.get("/:id", checkAuth, obtenerServicio);
router.get(
  "/obtener-servicios-proveedor/:id",
  checkAuth,
  obtenerServiciosProveedor
);

router.get("/servicios-cliente/:id", checkAuth, obtenerServiciosCliente);

router.get("/conceptos-a-facturar/:id", checkAuth, obtenerConceptos);

router.post("/asignar-proveedor/:id", checkAuth, asignarProveedor);
router.post("/aceptar-servicio/:id", checkAuth, aceptarServicio);

router.post("/reasignar-proveedor/:id", checkAuth, reasignarProveedor);

router.post(
  "/cambiar-precio-viaje-cliente/:id",
  checkAuth,
  actualizarPrecioViajesDesdeClientes
);

router.post(
  "/cambiar-numero-factura-viaje/:id",
  checkAuth,
  actualizarNumeroFacturaDesdeClientes
);

router.post(
  "/cambiar-precio-adicional-cliente/:id",
  checkAuth,
  actualizarAdicionalCliente
);

router.post(
  "/cambiar-estado-servicio/:id",
  checkAuth,
  actualizarEstadoServicio
);

router.post("/cambiar-estado-viaje/:id", checkAuth, actualizarEstadoViaje);

router.post("/agregar-viaje/:id", checkAuth, agregarViajes);

router.post("/notificar-viajes/:id", checkAuth, notificarViaje);
// router.post("/notificar-chofer/:id", checkAuth, notificarAlChofer);

router.post("/notificar-aceptacion/:id", checkAuth, notificarAceptacion);

router.post("/asignar-equipo/:id", checkAuth, asignarEquipo);
router.post("/aprobar/:id", checkAuth, aprobarEquipo);

router.post("/editar-viaje/:id", checkAuth, editarViaje);
router.post("/editar-concepto/:id", checkAuth, editarConcepto);

router.post("/completar-devolucion/:id", checkAuth, completarDevolucion);

router.post(
  "/completar-devolucion-listado/:id",
  checkAuth,
  completarDevolucionListado
);

router.post("/editar-documento/:id", checkAuth, editarDocumento);

router.post("/eliminar-viaje/:id", checkAuth, eliminarViaje);

router.post("/eliminar-servicio/:id", checkAuth, eliminarServicio);

router.post("/terminar-viaje/:id", checkAuth, terminarViaje);

router.post(
  "/editar-observacion/:id",
  checkAuth,
  actualizarObservacionesServicio
);

router.post("/estado-servicio", checkAuth, nuevoEstadoServicio);
router.post("/estado-viajes", checkAuth, nuevoEstadoViaje);

router.post("/importacion", checkAuth, nuevoServicioImportacion);
router.post("/exportacion", checkAuth, nuevoServicioExportacion);
router.post("/round-trip", checkAuth, nuevaRoundTripExpo);

router.post("/vacios", checkAuth, nuevoServicioDevolucionVacios);

router.post("/empty-pick", checkAuth, nuevoEmptyPickUp);

router.post("/transito", checkAuth, nuevoTransito);
router.post("/nacional", checkAuth, nuevoServicioNacional);

router.post("/nueva-terminal", checkAuth, nuevaTerminal);

router.post("/agregar-concepto", checkAuth, agregarConcepto);

router.post("/nueva-direccion-devolucion", checkAuth, nuevoLugarDevolucion);

router.post("/eliminar-equipo/:id", checkAuth, eliminarEquipos);

router.post("/eliminar-proveedor/:id", checkAuth, eliminarProveedor);
router.post("/notificar-logicsar/:id", checkAuth, infoWhatsappLogicsar);
router.post("/notificar-chofer/:id", checkAuth, infoWhatsappChofer);

router.post("/notificar-chofer-mail/:id", checkAuth, notificarChofer);

router.post("/cargar-documento/:id", checkAuth, upload, editarDocumento);

export default router;
