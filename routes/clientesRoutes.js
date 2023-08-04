import express from "express";

const router = express.Router();

import {
  obtenerClientes,
  nuevoCliente,
  obtenerCliente,
  editarCliente,
  comprobarCliente,
  obtenerUsuario,
  desactivarCliente,
  obtenerUsuariosProfile,
  adicional,
  obtenerAdicionales,
  nuevoDomicilio,
  obtenerUsuariosProfile2,
  obtenerDomicilios,
  obtenerDireccionTerminales,
  obtenerDireccionDevoluciones,
  editarDomicilio,
} from "../controllers/clientesController.js";

import checkAuth from "../middleware/checkAuth.js";

router.route("/").get(checkAuth, obtenerClientes).post(checkAuth, nuevoCliente);
router.route("/:id").put(checkAuth, editarCliente);

router.get("/obtener/:id", checkAuth, obtenerCliente);
router.get("/buscar/:id", checkAuth, obtenerUsuario);

router.get("/buscar-prueba/:id", checkAuth, obtenerUsuariosProfile);
router.get("/buscar-prueba2/:id", checkAuth, obtenerUsuariosProfile2);

//Agregar los planes a los clientes

router.post("/nuevoDomicilio/:id", checkAuth, nuevoDomicilio);

router.post("/editar-domicilio/:id", checkAuth, editarDomicilio);

router.post("/adicional", checkAuth, adicional);

router.get("/obtener-adicionales/:id", checkAuth, obtenerAdicionales);

router.get("/obtener-domicilios/:id", checkAuth, obtenerDomicilios);

router.get("/obtener-terminales", checkAuth, obtenerDireccionTerminales);

router.put("/desactivar-activar/:id", checkAuth, desactivarCliente);

router.post("/comprobar", checkAuth, comprobarCliente);

router.get("/direccion-devoluciones/", checkAuth, obtenerDireccionDevoluciones);

//TODO: Agregar facturas a los clientes

//TODO: Agregar Recibos a los clientes

//TODO: Agregar Adicionales a los clientes

//TODO: Agregar Usuarios a los clientes

export default router;
