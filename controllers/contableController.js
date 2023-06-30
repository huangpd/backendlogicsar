import Cliente from "../models/Cliente.js";
import Proveedor from "../models/Proveedor.js";
import Movimientos from "../models/Movimientos.js";

const obtenerMovimientos = async (req, res) => {
  const movimientos = await Movimientos.find();

  res.json(movimientos);
};

const nuevoMovimiento = async (req, res) => {
  const movimiento = new Movimientos(req.body);

  if (req.body.hasOwnProperty("cliente")) {
    const { cliente } = req.body;
    const clienteBase = await Cliente.findById(cliente);
    movimiento.cliente = clienteBase._id;
    movimiento.nombreCliente = clienteBase.nombre;
  } else {
    const { proveedor } = req.body;
    const proveedorBase = await Proveedor.findById(proveedor);
    movimiento.proveedor = proveedorBase._id;
    movimiento.nombreProveedor = proveedorBase.nombre;
  }

  movimiento.creador = req.usuario._id;

  try {
    const movimientoAlmacenado = await movimiento.save();

    await movimientoAlmacenado.save();

    res.json(movimientoAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const obtenerMovimiento = async (req, res) => {
  const { id } = req.params;

  const movimiento = await Movimientos.findById(id);

  if (!movimiento) {
    const error = new Error("Movimiento no encontrado");
    return res.status(404).json({ msg: error.message });
  }

  res.json({
    movimiento,
  });
};

const editarMovimiento = async (req, res) => {
  const { id } = req.params;
  const { tipo } = req.body;

  const movimiento = await Movimientos.findById(id);

  if (!movimiento) {
    const error = new Error("No encontrado");
    return res.status(404).json({ msg: error.message });
  }

  movimiento.entidad = req.body.entidad || movimiento.entidad;
  movimiento.precioBruto = req.body.precioBruto || movimiento.precioBruto;
  movimiento.iva = req.body.iva || movimiento.iva;
  movimiento.precioNeto = req.body.precioNeto || movimiento.precioNeto;
  movimiento.tipo = req.body.tipo || movimiento.tipo;
  movimiento.nombre = req.body.nombre || movimiento.nombre;
  movimiento.mailFactura =
    req.body.mailFactura ||
    movimiento.fechaVencimiento ||
    req.body.fechaVencimiento ||
    movimiento.fechaVencimiento;

  if (tipo === "Ingreso") {
    const { cliente } = req.body;
    const clienteBase = await Cliente.findById(cliente);
    movimiento.cliente = clienteBase._id;
    movimiento.nombreCliente = clienteBase.nombre;
    if (!movimiento.proveedor == "") {
      movimiento.proveedor = undefined;
      movimiento.nombreProveedor = undefined;
    }
  } else {
    const { proveedor } = req.body;

    const proveedorBase = await Proveedor.findById(proveedor);
    movimiento.proveedor = proveedorBase._id;
    movimiento.nombreProveedor = proveedorBase.nombre;
    if (!movimiento.cliente == "") {
      movimiento.cliente = undefined;
      movimiento.nombreCliente = undefined;
    }
  }

  try {
    const movimientoAlmacenado = await movimiento.save();

    res.json(movimientoAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const eliminarMovimiento = async (req, res) => {
  const { id } = req.params;
  const movimiento = await Movimientos.findById(id);

  if (!movimiento) {
    const error = new Error("Movimiento no encontrado");
    return res.status(404).json({ msg: error.message });
  }

  movimiento.pull([id]);

  await movimiento.save();

  res.json({ msg: "Movimiento eliminado correctamente" });
};

export {
  obtenerMovimientos,
  nuevoMovimiento,
  obtenerMovimiento,
  editarMovimiento,
  eliminarMovimiento,
};
