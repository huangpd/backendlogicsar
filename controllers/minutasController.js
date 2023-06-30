import Cliente from "../models/Cliente.js";

import Servicio from "../models/Servicio.js";

import Proveedor from "../models/Proveedor.js";
import Minutas from "../models/Minutas.js";
import Choferes from "../models/Choferes.js";

const nuevaMinuta = async (req, res) => {
  // const { idProveedor } = req.body;
  const { id } = req.params;
  const { tipo } = req.body;

  const minuta = new Minutas(req.body);

  const servicio = await Servicio.findById(id);

  if (tipo === "cliente") {
    const { idEntidad } = req.body;
    const cliente = await Cliente.findById(idEntidad);

    minuta.cliente = cliente._id;
    minuta.nombreCliente = cliente.nombre;
  }

  if (tipo === "proveedor") {
    const { idEntidad } = req.body;
    const proveedor = await Proveedor.findById(idEntidad);
    minuta.proveedor = proveedor._id;
    minuta.nombreProveedor = proveedor.nombre;
  }

  if (tipo === "chofer") {
    const { ididEntidadChofer } = req.body;
    const chofer = await Choferes.findById(idEntidad);
    minuta.chofer = chofer._id;
    minuta.nombreChofer = chofer.nombre;
  }

  try {
    const minutaAlmacenada = await minuta.save();
    servicio.minutas = minutaAlmacenada._id;
    await servicio.save();

    res.json(minutaAlmacenada);
  } catch (error) {
    console.log(error);
  }
};

const obtenerMinutas = async (req, res) => {
  const { id } = req.params;

  try {
    const minutas = await Minutas.find({ servicio: id });
    res.json(minutas);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Ocurrió un error al obtener las minutas." });
  }
};

export { nuevaMinuta, obtenerMinutas };
