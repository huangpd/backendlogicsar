import Proveedor from "../models/Proveedor.js";

import FacturasProveedor from "../models/FacturasProveedor.js";
import Choferes from "../models/Choferes.js";

import Camiones from "../models/Camiones.js";
import Semis from "../models/Semis.js";
import Equipos from "../models/Equipos.js";
import Actualizaciones from "../models/UltimasActualizaciones.js";

const obtenerProveedores = async (req, res) => {
  const proveedor = await Proveedor.find();

  res.json(proveedor);
};

const obtenerFacturasaPagar = async (req, res) => {
  // Obtener la fecha actual
  const fechaActual = new Date();

  // Buscar las facturas con una fecha de pago posterior o igual a la fecha actual y ordenarlas por fecha de pago en orden ascendente
  const facturas = await FacturasProveedor.find({
    fechaPago: { $gte: fechaActual },
    estado: "Pendiente",
  }).sort({ fechaPago: 1 });

  res.json(facturas);
};

const obtenerChoferes = async (req, res) => {
  const { id } = req.params;

  const choferes = await Choferes.find({
    proveedor: id,
  });

  res.json(choferes);
};

const obtenerCamiones = async (req, res) => {
  const { id } = req.params;

  const camiones = await Camiones.find({
    proveedor: id,
  });

  res.json(camiones);
};

const obtenerSemis = async (req, res) => {
  const { id } = req.params;

  const semis = await Semis.find({
    proveedor: id,
  });

  res.json(semis);
};

const obtenerEquipos = async (req, res) => {
  const { id } = req.params;

  const equipos = await Equipos.find({
    proveedor: id,
  });

  res.json(equipos);
};

const pagarFactura = async (req, res) => {
  const { id } = req.params;
  const { idPago } = req.body;

  const facturaAPagar = await FacturasProveedor.findById(id);

  facturaAPagar.estado = "Abonada";
  facturaAPagar.idPago = idPago;

  try {
    await facturaAPagar.save();
  } catch (error) {
    res.json(error);
  }
};

const comprobarProveedor = async (req, res) => {
  const { cuit } = req.body;

  const existeProveedor = await Proveedor.findOne({ cuit });

  if (existeProveedor) {
    const error = new Error("Proveedor ya registrado");
    return res.status(400).json({ msg: error.message });
  }

  res.json({ msg: "ok" });
};

const nuevoChofer = async (req, res) => {
  const { id } = req.params;

  const actualizacion = new Actualizaciones();
  const chofer = new Choferes(req.body);
  const proveedor = await Proveedor.findById(id);

  chofer.creador = req.usuario._id;
  chofer.proveedor = proveedor._id;

  try {
    const choferAlmacenado = await chofer.save();
    proveedor.choferes = choferAlmacenado._id;
    const proveedorAlmacenado = await proveedor.save();

    actualizacion.icon = "UserGroupIcon";
    actualizacion.description = Date.now();
    actualizacion.color = "text-orange-300";
    actualizacion.title = `Se creo el chofer ${chofer.nombre} ${chofer.apellido}`;
    await actualizacion.save();
    res.json(choferAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const nuevoEquipo = async (req, res) => {
  const { id } = req.params;
  const { idChofer } = req.body;
  const { idCamion } = req.body;
  const { idSemi } = req.body;
  const actualizacion = new Actualizaciones();
  const proveedor = await Proveedor.findById(id);
  const chofer = await Choferes.findById(idChofer);
  const camion = await Camiones.findById(idCamion);
  const semi = await Semis.findById(idSemi);
  const equipo = new Equipos(req.body);

  equipo.nombreChofer = chofer.nombre + " " + chofer.apellido;
  equipo.patenteCamion = camion.patente;
  equipo.patenteSemi = semi.patente;
  equipo.chofer = idChofer;
  equipo.camion = idCamion;
  equipo.semis = idSemi;
  equipo.proveedor = id;
  equipo.nombreProveedor = proveedor.nombre;

  equipo.estado = "Activo";

  try {
    actualizacion.icon = "UsersIcon";
    actualizacion.description = Date.now();
    actualizacion.color = "text-orange-300";
    actualizacion.title = `Se creo un equipo en el proveedor ${proveedor.nombre}`;
    const equipoAlmacenado = await equipo.save();
    proveedor.equipos.push(equipoAlmacenado._id);
    await actualizacion.save();
    res.json(equipoAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const nuevoCamion = async (req, res) => {
  const { id } = req.params;

  const camion = new Camiones(req.body);
  const proveedor = await Proveedor.findById(id);

  camion.creador = req.usuario._id;
  camion.proveedor = proveedor._id;

  try {
    const camionAlmacenado = await camion.save();

    proveedor.camiones = camionAlmacenado._id;

    const proveedorAlmacenado = await proveedor.save();

    res.json(camionAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const nuevoSemi = async (req, res) => {
  const { id } = req.params;
  const semis = new Semis(req.body);
  const proveedor = await Proveedor.findById(id);

  semis.creador = req.usuario._id;
  semis.proveedor = proveedor._id;

  try {
    const semiAlmacenado = await semis.save();

    proveedor.semis = semiAlmacenado._id;

    const proveedorAlmacenado = await proveedor.save();

    res.json(semiAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const nuevoProveedor = async (req, res) => {
  const proveedor = new Proveedor(req.body);
  const actualizacion = new Actualizaciones();
  proveedor.creador = req.usuario._id;

  try {
    const proveedorAlmacenado = await proveedor.save();
    actualizacion.icon = "UserPlusIcon";
    actualizacion.description = Date.now();
    actualizacion.color = "text-orange-300";
    actualizacion.title = `Se creo el proveedor ${proveedor.nombre}`;
    await actualizacion.save();
    res.json(proveedorAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const cargarFactura = async (req, res) => {
  const { proveedor } = req.body;
  const proveedorAlmacenado = await Proveedor.findById(proveedor);
  const factura = new FacturasProveedor(req.body);

  factura.creador = req.usuario._id;
  factura.nombreProveedor = proveedorAlmacenado.nombre;

  try {
    const facturaAlmacenada = await factura.save();

    proveedorAlmacenado.facturas.push(facturaAlmacenada._id);
    await proveedorAlmacenado.save();
    res.json(facturaAlmacenada);
  } catch (error) {
    console.log(error);
  }
};

const obtenerProveedor = async (req, res) => {
  const { id } = req.params;

  const proveedor = await Proveedor.findById(id);

  if (!proveedor) {
    const error = new Error("Proveedor no encontrado");
    return res.status(404).json({ msg: error.message });
  }

  // res.json({ cliente });

  //obtener las facturas del cliente
  // const facturas = await Factura.find().where("cliente").equals(cliente._id);

  res.json({
    proveedor,
  });
};

const editarProveedor = async (req, res) => {
  const { id } = req.params;

  const proveedor = await Proveedor.findById(id);

  if (!proveedor) {
    const error = new Error("No encontrado");
    return res.status(404).json({ msg: error.message });
  }

  proveedor.tipo = req.body.tipo || proveedor.tipo;
  proveedor.nombre = req.body.nombre || proveedor.nombre;
  proveedor.email = req.body.email || proveedor.email;

  try {
    const proveedorAlmacenado = await proveedor.save();
    res.json(proveedorAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const editarChofer = async (req, res) => {
  const { id } = req.params;

  const chofer = await Choferes.findById(id);

  if (!chofer) {
    const error = new Error("No encontrado");
    return res.status(404).json({ msg: error.message });
  }

  chofer.nombre = req.body.nombre || chofer.nombre;
  chofer.apellido = req.body.apellido || chofer.apellido;
  chofer.dni = req.body.dni || chofer.dni;
  chofer.email = req.body.email || chofer.email;
  chofer.telefono = req.body.telefono || chofer.telefono;

  try {
    const choferAlmacenado = await chofer.save();
    res.json(choferAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const editarCamion = async (req, res) => {
  const { id } = req.params;

  const camion = await Camiones.findById(id);

  if (!camion) {
    const error = new Error("No encontrado");
    return res.status(404).json({ msg: error.message });
  }

  camion.modelo = req.body.modelo || camion.modelo;
  camion.patente = req.body.patente || camion.patente;
  camion.year = req.body.year || camion.year;

  try {
    const camionAlmacenado = await camion.save();
    res.json(camionAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const editarSemi = async (req, res) => {
  const { id } = req.params;

  const semi = await Semis.findById(id);

  if (!semi) {
    const error = new Error("No encontrado");
    return res.status(404).json({ msg: error.message });
  }

  semi.modelo = req.body.modelo || semi.modelo;
  semi.patente = req.body.patente || semi.patente;
  semi.year = req.body.year || semi.year;

  try {
    const semiAlmacenado = await semi.save();
    res.json(semiAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

export {
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
};
