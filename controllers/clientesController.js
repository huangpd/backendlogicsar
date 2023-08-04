import Cliente from "../models/Cliente.js";
import Factura from "../models/Facturas.js";
import Usuario from "../models/Usuario.js";
import schedule from "node-schedule";
import fs from "fs";
import Adicionales from "../models/Adicionales.js";
import Domicilios from "../models/Domicilios.js";
import Terminales from "../models/Terminales.js";
import Devoluciones from "../models/DevolucionContenedores.js";
import Actualizaciones from "../models/UltimasActualizaciones.js";

const obtenerClientes = async (req, res) => {
  const clientes = await Cliente.find();
  res.json(clientes);
};

const obtenerUsuario = async (req, res) => {
  const { id } = req.params;

  const usuario = await Usuario.findById(id);

  if (!usuario) {
    const error = new Error("No existe el usuario");
    return res.status(403).json({ msg: error.message });
  }
  res.json(usuario);
};

const obtenerUsuariosProfile = async (req, res) => {
  const { id } = req.params;
  const usuarios = await Usuario.find({
    $or: [{ cliente: { $in: id } }],
  });

  res.json(usuarios);
};

const obtenerUsuariosProfile2 = async (req, res) => {
  const { id } = req.params;
  const usuarios = await Usuario.findById(id);

  res.json(usuarios);
};

const comprobarCliente = async (req, res) => {
  const { cuit } = req.body;

  const existeCliente = await Cliente.findOne({ cuit });

  if (existeCliente) {
    const error = new Error("Cliente ya registrado");
    return res.status(400).json({ msg: error.message });
  }

  res.json({ msg: "ok" });
};

const nuevoCliente = async (req, res) => {
  const cliente = new Cliente(req.body);
  const actualizacion = new Actualizaciones();
  try {
    const clienteAlmacenado = await cliente.save();
    actualizacion.icon = "PencilSquareIcon";
    actualizacion.description = Date.now();
    actualizacion.color = "text-green-300";
    actualizacion.title = `Se creo el cliente ${cliente.nombre}`;

    await actualizacion.save();
    res.json(clienteAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const nuevoDomicilio = async (req, res) => {
  const { id } = req.params;

  const domicilio = new Domicilios(req.body);
  const cliente = await Cliente.findById(id);

  domicilio.cliente = cliente._id;

  try {
    const domicilioAlmacenado = await domicilio.save();

    cliente.domiciliosEntrega = domicilioAlmacenado._id;

    const clienteModificado = await cliente.save();

    res.json(domicilioAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const editarDomicilio = async (req, res) => {
  const { id } = req.params;

  const domicilio = await Domicilios.findById(id);

  domicilio.fantasia = req.body.fantasia || domicilio.fantasia;
  domicilio.direccion = req.body.direccion || domicilio.direccion;
  domicilio.localidad = req.body.localidad || domicilio.localidad;
  domicilio.provincia = req.body.provincia || domicilio.provincia;

  try {
    const domicilioAlmacenado = await domicilio.save();

    res.json(domicilioAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const obtenerDomicilios = async (req, res) => {
  const { id } = req.params;

  const domicilios = await Domicilios.find({
    $or: [{ cliente: { $in: id } }],
  });

  res.json(domicilios);
};

const adicional = async (req, res) => {
  const adicional = new Adicionales(req.body);

  adicional.creador = req.usuario._id;

  try {
    const adicionalalmacenado = await adicional.save();
    await adicionalalmacenado.save();
    res.json(adicionalalmacenado);
  } catch (error) {
    console.log(error);
  }
};

const obtenerAdicionales = async (req, res) => {
  const { id } = req.params;

  const adicionales = await Adicionales.find({
    $or: [{ cliente: { $in: id } }],
  });

  res.json({
    adicionales,
  });
};

const obtenerCliente = async (req, res) => {
  const { id } = req.params;

  const cliente = await Cliente.findById(id);

  if (!cliente) {
    const error = new Error("Cliente no encontrado");
    return res.status(404).json({ msg: error.message });
  }

  // res.json({ cliente });

  //obtener las facturas del cliente
  // const facturas = await Factura.find().where("cliente").equals(cliente._id);

  res.json({
    cliente,
  });
};

const desactivarCliente = async (req, res) => {
  const { id } = req.params;
  const { isActivo } = req.body;

  const cliente = await Cliente.findById(id);
  const usuarios = await Usuario.find({
    $or: [{ cliente: { $in: id } }],
  });

  if (!cliente) {
    const error = new Error("Cliente No encontrado");
    return res.status(404).json({ msg: error.message });
  }

  if (isActivo === true) {
    cliente.isActivo = false;
  } else {
    cliente.isActivo = true;
  }

  try {
    const clienteAlmacenado = await cliente.save();

    // Actualizar isActivo en cada objeto de usuario
    usuarios.forEach(async (usuario) => {
      if (isActivo === true) {
        usuario.isActivo = false;
      } else {
        usuario.isActivo = true;
      }
      await usuario.save();
    });

    res.json(clienteAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const editarCliente = async (req, res) => {
  const { id } = req.params;

  const cliente = await Cliente.findById(id);

  if (!cliente) {
    const error = new Error("No encontrado");
    return res.status(404).json({ msg: error.message });
  }

  cliente.tipo = req.body.tipo || cliente.tipo;
  cliente.nombre = req.body.nombre || cliente.nombre;
  cliente.cuit = req.body.cuit || cliente.cuit;
  cliente.domicilio = req.body.domicilio || cliente.domicilio;
  cliente.localidad = req.body.localidad || cliente.localidad;
  cliente.provincia = req.body.provincia || cliente.provincia;
  cliente.mailFactura = req.body.mailFactura || cliente.mailFactura;
  cliente.telefono = req.body.telefono || cliente.telefono;

  try {
    const clienteActualizado = await cliente.save();
    res.json(clienteActualizado);
  } catch (error) {
    console.log(error);
  }
};
const obtenerDireccionTerminales = async (req, res) => {
  const terminales = await Terminales.find();

  res.json(terminales);
};
const obtenerDireccionDevoluciones = async (req, res) => {
  const devolucion = await Devoluciones.find();
  res.json(devolucion);
};

export {
  obtenerDireccionTerminales,
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
  obtenerDireccionDevoluciones,
  editarDomicilio,
};
