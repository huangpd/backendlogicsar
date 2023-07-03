import Cliente from "../models/Cliente.js";

import Servicio from "../models/Servicio.js";
import HistoriaServicios from "../models/HistoriaServicios.js";

import { notificarRecepcionViaje, notificarViajes } from "../helpers/emails.js";
import Proveedor from "../models/Proveedor.js";
import Terminales from "../models/Terminales.js";
import Domicilios from "../models/Domicilios.js";
import Viajes from "../models/Viajes.js";
import Choferes from "../models/Choferes.js";
import Camiones from "../models/Camiones.js";
import Semis from "../models/Semis.js";

import EstadosServicio from "../models/EstadosServicios.js";
import EstadosViajes from "../models/EstadosViajes.js";
import Devoluciones from "../models/DevolucionContenedores.js";
import Usuario from "../models/Usuario.js";
import Actualizaciones from "../models/UltimasActualizaciones.js";

const nuevoServicioImportacion = async (req, res) => {
  const { idCliente } = req.body;
  const { numeroContenedores } = req.body;
  const { origenCarga } = req.body;
  const { destinoCarga } = req.body;
  const actualizacion = new Actualizaciones();
  const cliente = await Cliente.findById(idCliente);
  const servicio = new Servicio(req.body);

  const domicilio = await Terminales.findById(origenCarga);
  const destino = await Domicilios.findById(destinoCarga);

  const estadoServicio = await EstadosServicio.findOne({ numeroEstado: "2" });

  const estadoViaje = await EstadosViajes.findOne({ numeroEstado: "1" });

  servicio.nombreCliente = cliente.nombre;
  servicio.cliente = idCliente;
  servicio.estado = estadoServicio.estado;
  servicio.origenCarga = domicilio.direccion;
  servicio.destinoCarga = destino.direccion;
  servicio.notificar = "Sin Notificar";
  servicio.nombreTerminal = domicilio.nombre;

  actualizacion.icon = "PlusCircleIcon";
  actualizacion.description = Date.now();
  actualizacion.color = "text-green-500";
  actualizacion.title = `Servicio importacion Nro ${servicio.numeroPedido} ingresado`;

  try {
    const servicioalmacenado = await servicio.save();

    if (
      servicioalmacenado.tipoCarga === "cajas" ||
      servicioalmacenado.tipoCarga === "pallets"
    ) {
      const nuevoViaje = new Viajes({
        numeroContenedor: "Mercaderia Suelta",
        fechaOrigen: servicioalmacenado.fechaCarga,
        horaOrigen: servicioalmacenado.horaCarga,
        creador: req.usuario._id,
        cliente: cliente._id,
        nombreCliente: cliente.nombre,
        domicilioOrigenTerminal: origenCarga,
        nombreDomicilioOrigenTerminal: domicilio.direccion,
        domicilioDestinoCliente: destinoCarga,
        estado: estadoViaje.estado,
        tipoServicio: servicioalmacenado.tipoOperacion,
        tipoCarga: servicioalmacenado.tipoCarga,
        nombreDomicilioDestinoCliente: destino.direccion,
        servicio: servicioalmacenado._id,
        numeroDeViaje: `${servicioalmacenado.numeroPedido}/1`,
        cantidadCarga: servicioalmacenado.cantidad,
        volumenCarga: servicioalmacenado.volumen,
        pesoCarga: servicioalmacenado.peso,
        estadoServicio: servicio.estado,
        notificado: "Sin Notificar",
      });

      const viajeAlmacenado = await nuevoViaje.save();
      servicioalmacenado.viajesSueltos = viajeAlmacenado._id;
    }
    if (
      servicioalmacenado.tipoCarga === "Contenedor20" ||
      servicioalmacenado.tipoCarga === "Contenedor40" ||
      servicioalmacenado.tipoCarga === "Contenedor40HC"
    ) {
      if (numeroContenedores.length > 1) {
        const viajesPromises = numeroContenedores.map(
          async (numeroContenedor, index) => {
            const nuevoViaje = new Viajes({
              numeroContenedor: numeroContenedor.numeroContenedor,
              direccionRetorno: numeroContenedor.direccionRetorno,
              fechaOrigen: servicioalmacenado.fechaCarga,
              horaOrigen: servicioalmacenado.horaCarga,
              creador: req.usuario._id,
              cliente: cliente._id,
              nombreCliente: cliente.nombre,
              domicilioOrigenTerminal: origenCarga,
              nombreDomicilioOrigenTerminal: domicilio.direccion,
              domicilioDestinoCliente: destinoCarga,
              estado: estadoViaje.estado,
              tipoServicio: servicioalmacenado.tipoOperacion,
              tipoCarga: servicioalmacenado.tipoCarga,
              nombreDomicilioDestinoCliente: destino.direccion,
              servicio: servicioalmacenado._id,
              numeroDeViaje: `${servicioalmacenado.numeroPedido}/${index + 1}`,
              cantidadCarga: servicioalmacenado.cantidad,
              volumenCarga: servicioalmacenado.volumen,
              pesoCarga: servicioalmacenado.peso,
              estadoServicio: servicio.estado,
              notificado: "Sin Notificar",
            });

            const viajeAlmacenado = await nuevoViaje.save();
            return viajeAlmacenado._id;
          }
        );

        const viajesIds = await Promise.all(viajesPromises);

        servicioalmacenado.numeroContenedores.forEach(
          (numeroContenedor, index) => {
            numeroContenedor.viaje = viajesIds[index];
          }
        );
      } else if (numeroContenedores.length === 1) {
        const nuevoViaje = new Viajes({
          numeroContenedor: numeroContenedores[0].numeroContenedor,
          direccionRetorno: numeroContenedores[0].direccionRetorno,
          estado: estadoViaje.estado,
          horaOrigen: servicioalmacenado.horaCarga,
          fechaOrigen: servicioalmacenado.fechaCarga,
          creador: req.usuario._id,
          cliente: cliente._id,
          nombreCliente: cliente.nombre,
          domicilioOrigenTerminal: origenCarga,
          nombreDomicilioOrigenTerminal: domicilio.direccion,
          domicilioDestinoCliente: destinoCarga,
          nombreDomicilioDestinoCliente: destino.direccion,
          servicio: servicioalmacenado._id,
          tipoServicio: servicioalmacenado.tipoOperacion,
          tipoCarga: servicioalmacenado.tipoCarga,
          numeroDeViaje: `${servicioalmacenado.numeroPedido}/1`,
          cantidadCarga: servicioalmacenado.cantidad,
          volumenCarga: servicioalmacenado.volumen,
          pesoCarga: servicioalmacenado.peso,
          estadoServicio: servicio.estado,
          notificado: "Sin Notificar",
        });
        const viajeAlmacenado = await nuevoViaje.save();

        servicioalmacenado.numeroContenedores[0].viaje = viajeAlmacenado._id;
      }
    }

    cliente.servicios.push(servicioalmacenado._id);
    await servicioalmacenado.save();
    await actualizacion.save();
    await cliente.save();
    const usuarios = await Usuario.find({
      cliente: servicioalmacenado.cliente,
    });

    notificarRecepcionViaje(usuarios, servicioalmacenado);

    res.json(servicioalmacenado);
  } catch (error) {
    console.log(error);
  }
};

const nuevoServicioExportacion = async (req, res) => {
  const { idCliente } = req.body;
  const { numeroContenedores } = req.body;
  const { origenCarga } = req.body;
  const { destinoCarga } = req.body;
  const cliente = await Cliente.findById(idCliente);
  const servicio = new Servicio(req.body);

  const actualizacion = new Actualizaciones();

  const destino = await Terminales.findById(destinoCarga);
  const domicilio = await Domicilios.findById(origenCarga);

  const estadoServicio = await EstadosServicio.findOne({ numeroEstado: "2" });

  const estadoViaje = await EstadosViajes.findOne({ numeroEstado: "1" });

  servicio.nombreCliente = cliente.nombre;
  servicio.cliente = idCliente;
  servicio.estado = estadoServicio.estado;
  servicio.origenCarga = domicilio.direccion;
  servicio.destinoCarga = destino.direccion;
  servicio.notificar = "Sin Notificar";
  servicio.nombreTerminal = domicilio.nombre;

  try {
    const servicioalmacenado = await servicio.save();

    actualizacion.icon = "PlusCircleIcon";
    actualizacion.description = Date.now();
    actualizacion.color = "text-green-500";
    actualizacion.title = `Servicio exportacion Nro ${servicioalmacenado.numeroPedido} ingresado`;

    if (
      servicioalmacenado.tipoCarga === "cajas" ||
      servicioalmacenado.tipoCarga === "pallets"
    ) {
      const nuevoViaje = new Viajes({
        numeroContenedor: "Mercaderia Suelta",
        fechaOrigen: servicioalmacenado.fechaCarga,
        horaOrigen: servicioalmacenado.horaCarga,
        creador: req.usuario._id,
        cliente: cliente._id,
        nombreCliente: cliente.nombre,
        domicilioOrigenCliente: origenCarga,
        nombreDomicilioOrigenCliente: domicilio.direccion,
        domicilioDestinoTerminal: destinoCarga,
        estado: estadoViaje.estado,
        tipoServicio: servicioalmacenado.tipoOperacion,
        tipoCarga: servicioalmacenado.tipoCarga,
        nombreDomicilioDestinoTerminal: destino.direccion,
        servicio: servicioalmacenado._id,
        numeroDeViaje: `${servicioalmacenado.numeroPedido}/1`,
        cantidadCarga: servicioalmacenado.cantidad,
        volumenCarga: servicioalmacenado.volumen,
        pesoCarga: servicioalmacenado.peso,
        estadoServicio: servicio.estado,
        notificado: "Sin Notificar",
      });

      const viajeAlmacenado = await nuevoViaje.save();
      servicioalmacenado.viajesSueltos = viajeAlmacenado._id;
    }
    if (
      servicioalmacenado.tipoCarga === "Contenedor20" ||
      servicioalmacenado.tipoCarga === "Contenedor40" ||
      servicioalmacenado.tipoCarga === "Contenedor40HC"
    ) {
      if (numeroContenedores.length > 1) {
        const viajesPromises = numeroContenedores.map(
          async (numeroContenedor, index) => {
            const nuevoViaje = new Viajes({
              numeroContenedor: numeroContenedor.numeroContenedor,
              direccionRetorno: numeroContenedor.direccionRetorno,
              fechaOrigen: servicioalmacenado.fechaCarga,
              horaOrigen: servicioalmacenado.horaCarga,
              creador: req.usuario._id,
              cliente: cliente._id,
              nombreCliente: cliente.nombre,
              domicilioOrigenCliente: origenCarga,
              nombreDomicilioOrigenCliente: domicilio.direccion,
              domicilioDestinoTerminal: destinoCarga,
              estado: estadoViaje.estado,
              tipoServicio: servicioalmacenado.tipoOperacion,
              tipoCarga: servicioalmacenado.tipoCarga,
              nombreDomicilioDestinoTerminal: destino.direccion,
              servicio: servicioalmacenado._id,
              numeroDeViaje: `${servicioalmacenado.numeroPedido}/${index + 1}`,
              cantidadCarga: servicioalmacenado.cantidad,
              volumenCarga: servicioalmacenado.volumen,
              pesoCarga: servicioalmacenado.peso,
              estadoServicio: servicio.estado,
              notificado: "Sin Notificar",
            });

            const viajeAlmacenado = await nuevoViaje.save();
            return viajeAlmacenado._id;
          }
        );

        const viajesIds = await Promise.all(viajesPromises);

        servicioalmacenado.numeroContenedores.forEach(
          (numeroContenedor, index) => {
            numeroContenedor.viaje = viajesIds[index];
          }
        );
      } else if (numeroContenedores.length === 1) {
        const nuevoViaje = new Viajes({
          numeroContenedor: numeroContenedores[0].numeroContenedor,
          direccionRetorno: numeroContenedores[0].direccionRetorno,
          estado: estadoViaje.estado,
          horaOrigen: servicioalmacenado.horaCarga,
          fechaOrigen: servicioalmacenado.fechaCarga,
          creador: req.usuario._id,
          cliente: cliente._id,
          nombreCliente: cliente.nombre,
          domicilioOrigenCliente: origenCarga,
          nombreDomicilioOrigenCliente: domicilio.direccion,
          domicilioDestinoTerminal: destinoCarga,
          nombreDomicilioDestinoTerminal: destino.direccion,
          servicio: servicioalmacenado._id,
          tipoServicio: servicioalmacenado.tipoOperacion,
          tipoCarga: servicioalmacenado.tipoCarga,
          numeroDeViaje: `${servicioalmacenado.numeroPedido}/1`,
          cantidadCarga: servicioalmacenado.cantidad,
          volumenCarga: servicioalmacenado.volumen,
          pesoCarga: servicioalmacenado.peso,
          estadoServicio: servicio.estado,
          notificado: "Sin Notificar",
        });
        const viajeAlmacenado = await nuevoViaje.save();

        servicioalmacenado.numeroContenedores[0].viaje = viajeAlmacenado._id;
      }
    }
    cliente.servicios.push(servicioalmacenado._id);
    await servicioalmacenado.save();
    await actualizacion.save();
    await cliente.save();

    res.json(servicioalmacenado);
  } catch (error) {
    console.log(error);
  }
};

const nuevoTransito = async (req, res) => {
  const { idCliente } = req.body;
  const { numeroContenedores } = req.body;
  const { origenCarga } = req.body;
  const { destinoCarga } = req.body;
  const actualizacion = new Actualizaciones();
  const cliente = await Cliente.findById(idCliente);
  const servicio = new Servicio(req.body);

  const domicilio = await Terminales.findById(origenCarga);
  const destino = await Terminales.findById(destinoCarga);

  const estadoServicio = await EstadosServicio.findOne({ numeroEstado: "2" });

  const estadoViaje = await EstadosViajes.findOne({ numeroEstado: "1" });

  servicio.nombreCliente = cliente.nombre;
  servicio.cliente = idCliente;
  servicio.estado = estadoServicio.estado;
  servicio.origenCarga = domicilio.direccion;
  servicio.destinoCarga = destino.direccion;
  servicio.notificar = "Sin Notificar";
  servicio.nombreTerminal = domicilio.nombre;

  actualizacion.icon = "PlusCircleIcon";
  actualizacion.description = Date.now();
  actualizacion.color = "text-green-500";
  actualizacion.title = `Servicio Transito Nro ${servicioalmacenado.numeroPedido} ingresado`;

  try {
    const servicioalmacenado = await servicio.save();

    if (
      servicioalmacenado.tipoCarga === "cajas" ||
      servicioalmacenado.tipoCarga === "pallets"
    ) {
      const nuevoViaje = new Viajes({
        numeroContenedor: "Mercaderia Suelta",
        fechaOrigen: servicioalmacenado.fechaCarga,
        horaOrigen: servicioalmacenado.horaCarga,
        creador: req.usuario._id,
        cliente: cliente._id,
        nombreCliente: cliente.nombre,
        domicilioOrigenTerminal: origenCarga,
        nombreDomicilioOrigenTerminal: domicilio.direccion,
        domicilioDestinoTerminal: destinoCarga,
        estado: estadoViaje.estado,
        tipoServicio: servicioalmacenado.tipoOperacion,
        tipoCarga: servicioalmacenado.tipoCarga,
        nombreDomicilioDestinoTerminal: destino.direccion,
        servicio: servicioalmacenado._id,
        numeroDeViaje: `${servicioalmacenado.numeroPedido}/1`,
        cantidadCarga: servicioalmacenado.cantidad,
        volumenCarga: servicioalmacenado.volumen,
        pesoCarga: servicioalmacenado.peso,
        estadoServicio: servicio.estado,
        notificado: "Sin Notificar",
      });

      const viajeAlmacenado = await nuevoViaje.save();
      servicioalmacenado.viajesSueltos = viajeAlmacenado._id;
    }
    if (
      servicioalmacenado.tipoCarga === "Contenedor20" ||
      servicioalmacenado.tipoCarga === "Contenedor40" ||
      servicioalmacenado.tipoCarga === "Contenedor40HC"
    ) {
      if (numeroContenedores.length > 1) {
        const viajesPromises = numeroContenedores.map(
          async (numeroContenedor, index) => {
            const nuevoViaje = new Viajes({
              numeroContenedor: numeroContenedor.numeroContenedor,
              direccionRetorno: numeroContenedor.direccionRetorno,
              fechaOrigen: servicioalmacenado.fechaCarga,
              horaOrigen: servicioalmacenado.horaCarga,
              creador: req.usuario._id,
              cliente: cliente._id,
              nombreCliente: cliente.nombre,
              domicilioOrigenTerminal: origenCarga,
              nombreDomicilioOrigenTerminal: domicilio.direccion,
              domicilioDestinoTerminal: destinoCarga,
              estado: estadoViaje.estado,
              tipoServicio: servicioalmacenado.tipoOperacion,
              tipoCarga: servicioalmacenado.tipoCarga,
              nombreDomicilioDestinoTerminal: destino.direccion,
              servicio: servicioalmacenado._id,
              numeroDeViaje: `${servicioalmacenado.numeroPedido}/${index + 1}`,
              cantidadCarga: servicioalmacenado.cantidad,
              volumenCarga: servicioalmacenado.volumen,
              pesoCarga: servicioalmacenado.peso,
              estadoServicio: servicio.estado,
              notificado: "Sin Notificar",
            });

            const viajeAlmacenado = await nuevoViaje.save();
            return viajeAlmacenado._id;
          }
        );

        const viajesIds = await Promise.all(viajesPromises);

        servicioalmacenado.numeroContenedores.forEach(
          (numeroContenedor, index) => {
            numeroContenedor.viaje = viajesIds[index];
          }
        );
      } else if (numeroContenedores.length === 1) {
        const nuevoViaje = new Viajes({
          numeroContenedor: numeroContenedores[0].numeroContenedor,
          direccionRetorno: numeroContenedores[0].direccionRetorno,
          estado: estadoViaje.estado,
          horaOrigen: servicioalmacenado.horaCarga,
          fechaOrigen: servicioalmacenado.fechaCarga,
          creador: req.usuario._id,
          cliente: cliente._id,
          nombreCliente: cliente.nombre,
          domicilioOrigenTerminal: origenCarga,
          nombreDomicilioOrigenTerminal: domicilio.direccion,
          domicilioDestinoTerminal: destinoCarga,
          nombreDomicilioDestinoTerminal: destino.direccion,
          servicio: servicioalmacenado._id,
          tipoServicio: servicioalmacenado.tipoOperacion,
          tipoCarga: servicioalmacenado.tipoCarga,
          numeroDeViaje: `${servicioalmacenado.numeroPedido}/1`,
          cantidadCarga: servicioalmacenado.cantidad,
          volumenCarga: servicioalmacenado.volumen,
          pesoCarga: servicioalmacenado.peso,
          estadoServicio: servicio.estado,
        });
        const viajeAlmacenado = await nuevoViaje.save();

        servicioalmacenado.numeroContenedores[0].viaje = viajeAlmacenado._id;
      }
    }
    cliente.servicios.push(servicioalmacenado._id);
    await servicioalmacenado.save();
    await actualizacion.save();
    await cliente.save();

    res.json(servicioalmacenado);
  } catch (error) {
    console.log(error);
  }
};

const nuevoServicioNacional = async (req, res) => {
  const { idCliente } = req.body;
  const { numeroContenedores } = req.body;
  const { origenCarga } = req.body;
  const { destinoCarga } = req.body;
  const actualizacion = new Actualizaciones();
  const cliente = await Cliente.findById(idCliente);
  const servicio = new Servicio(req.body);

  const domicilio = await Domicilios.findById(origenCarga);
  const destino = await Domicilios.findById(destinoCarga);

  const estadoServicio = await EstadosServicio.findOne({ numeroEstado: "2" });

  const estadoViaje = await EstadosViajes.findOne({ numeroEstado: "1" });

  servicio.nombreCliente = cliente.nombre;
  servicio.cliente = idCliente;
  servicio.estado = estadoServicio.estado;
  servicio.origenCarga = domicilio.direccion;
  servicio.destinoCarga = destino.direccion;
  servicio.notificar = "Sin Notificar";
  servicio.nombreTerminal = domicilio.nombre;

  actualizacion.icon = "PlusCircleIcon";
  actualizacion.description = Date.now();
  actualizacion.color = "text-green-500";
  actualizacion.title = `Servicio Nacional Nro ${servicioalmacenado.numeroPedido} ingresado`;

  try {
    const servicioalmacenado = await servicio.save();

    if (
      servicioalmacenado.tipoCarga === "cajas" ||
      servicioalmacenado.tipoCarga === "pallets"
    ) {
      const nuevoViaje = new Viajes({
        numeroContenedor: "Mercaderia Suelta",
        fechaOrigen: servicioalmacenado.fechaCarga,
        horaOrigen: servicioalmacenado.horaCarga,
        creador: req.usuario._id,
        cliente: cliente._id,
        nombreCliente: cliente.nombre,
        domicilioOrigenCliente: origenCarga,
        nombreDomicilioOrigenCliente: domicilio.direccion,
        domicilioDestinoCliente: destinoCarga,
        estado: estadoViaje.estado,
        tipoServicio: servicioalmacenado.tipoOperacion,
        tipoCarga: servicioalmacenado.tipoCarga,
        nombreDomicilioDestinoCliente: destino.direccion,
        servicio: servicioalmacenado._id,
        numeroDeViaje: `${servicioalmacenado.numeroPedido}/1`,
        cantidadCarga: servicioalmacenado.cantidad,
        volumenCarga: servicioalmacenado.volumen,
        pesoCarga: servicioalmacenado.peso,
        estadoServicio: servicio.estado,
        notificado: "Sin Notificar",
      });

      const viajeAlmacenado = await nuevoViaje.save();
      servicioalmacenado.viajesSueltos = viajeAlmacenado._id;
    }
    if (
      servicioalmacenado.tipoCarga === "Contenedor20" ||
      servicioalmacenado.tipoCarga === "Contenedor40" ||
      servicioalmacenado.tipoCarga === "Contenedor40HC"
    ) {
      if (numeroContenedores.length > 1) {
        const viajesPromises = numeroContenedores.map(
          async (numeroContenedor, index) => {
            const nuevoViaje = new Viajes({
              numeroContenedor: numeroContenedor.numeroContenedor,
              direccionRetorno: numeroContenedor.direccionRetorno,
              fechaOrigen: servicioalmacenado.fechaCarga,
              horaOrigen: servicioalmacenado.horaCarga,
              creador: req.usuario._id,
              cliente: cliente._id,
              nombreCliente: cliente.nombre,
              domicilioOrigenCliente: origenCarga,
              nombreDomicilioOrigenCliente: domicilio.direccion,
              domicilioDestinoCliente: destinoCarga,
              estado: estadoViaje.estado,
              tipoServicio: servicioalmacenado.tipoOperacion,
              tipoCarga: servicioalmacenado.tipoCarga,
              nombreDomicilioDestinoCliente: destino.direccion,
              servicio: servicioalmacenado._id,
              numeroDeViaje: `${servicioalmacenado.numeroPedido}/${index + 1}`,
              cantidadCarga: servicioalmacenado.cantidad,
              volumenCarga: servicioalmacenado.volumen,
              pesoCarga: servicioalmacenado.peso,
              estadoServicio: servicio.estado,
              notificado: "Sin Notificar",
            });

            const viajeAlmacenado = await nuevoViaje.save();
            return viajeAlmacenado._id;
          }
        );

        const viajesIds = await Promise.all(viajesPromises);

        servicioalmacenado.numeroContenedores.forEach(
          (numeroContenedor, index) => {
            numeroContenedor.viaje = viajesIds[index];
          }
        );
      } else if (numeroContenedores.length === 1) {
        const nuevoViaje = new Viajes({
          numeroContenedor: numeroContenedores[0].numeroContenedor,
          direccionRetorno: numeroContenedores[0].direccionRetorno,
          estado: estadoViaje.estado,
          horaOrigen: servicioalmacenado.horaCarga,
          fechaOrigen: servicioalmacenado.fechaCarga,
          creador: req.usuario._id,
          cliente: cliente._id,
          nombreCliente: cliente.nombre,
          domicilioOrigenCliente: origenCarga,
          nombreDomicilioOrigenCliente: domicilio.direccion,
          domicilioDestinoCliente: destinoCarga,
          nombreDomicilioDestinoCliente: destino.direccion,
          servicio: servicioalmacenado._id,
          tipoServicio: servicioalmacenado.tipoOperacion,
          tipoCarga: servicioalmacenado.tipoCarga,
          numeroDeViaje: `${servicioalmacenado.numeroPedido}/1`,
          cantidadCarga: servicioalmacenado.cantidad,
          volumenCarga: servicioalmacenado.volumen,
          pesoCarga: servicioalmacenado.peso,
          estadoServicio: servicio.estado,
          notificado: "Sin Notificar",
        });
        const viajeAlmacenado = await nuevoViaje.save();

        servicioalmacenado.numeroContenedores[0].viaje = viajeAlmacenado._id;
      }
    }
    cliente.servicios.push(servicioalmacenado._id);
    await servicioalmacenado.save();
    await actualizacion.save();
    await cliente.save();

    res.json(servicioalmacenado);
  } catch (error) {
    console.log(error);
  }
};

const obtenerServicios = async (req, res) => {
  try {
    const servicios = await Servicio.find({ estado: { $ne: "terminado" } });
    res.json(servicios);
  } catch (error) {
    // Manejo de errores
    console.error(error);
    res.status(500).json({ message: "Error al obtener los servicios" });
  }
};

const obtenerSinNotificar = async (req, res) => {
  try {
    const servicios = await Servicio.find({
      notificar: { $eq: "Sin Notificar" },
    });
    res.json(servicios);
  } catch (error) {
    // Manejo de errores
    console.error(error);
    res.status(500).json({ message: "Error al obtener los servicios" });
  }
};

const notificarViaje = async (req, res) => {
  const { id } = req.params;

  const servicio = await Servicio.findById(id);
  const actualizacion = new Actualizaciones();
  const informacionEnviar = [];
  const viajeIds = servicio.numeroContenedores.map(
    (contenedor) => contenedor.viaje
  );

  const usuarios = await Usuario.find({ cliente: servicio.cliente });

  const estadosViaje = await EstadosViajes.find({ numeroEstado: 5 });

  actualizacion.icon = "EnvelopeIcon";
  actualizacion.description = Date.now();
  actualizacion.color = "text-blue-500";
  actualizacion.title = `Viajes Servicio ${servicio.numeroPedido} notificado`;

  for (const viajeId of viajeIds) {
    // Buscar el viaje por su ID
    const viaje = await Viajes.findById(viajeId);
    try {
      const {
        numeroContenedor,
        nombreChofer,
        patenteSemi,
        patenteCamion,
        numeroDeViaje,
        chofer,
      } = viaje;

      const datosChofer = await Choferes.findById(chofer);

      const { dni, telefono } = datosChofer;

      // Crear un objeto con los datos relevantes
      const informacionViaje = {
        numeroDeViaje,
        numeroContenedor,
        nombreChofer,
        patenteCamion,
        patenteSemi,
        dni,
        telefono,
      };

      // Agregar el objeto al array informacionEnviar
      informacionEnviar.push(informacionViaje);

      // Asignar el valor manualmente al campo notificado en el modelo de Viaje
      viaje.notificado = "Notificado";
      const viajeGuardado = await viaje.save();
    } catch (error) {
      // Manejo de errores para cada iteración
      console.error(`Error al obtener el viaje con ID ${viajeId}:`, error);
    }
  }
  notificarViajes(usuarios, servicio, informacionEnviar);

  await actualizacion.save();
  res.json({ msg: "Viaje Notificado Con Exito" });
};

const notificarAceptacion = async (req, res) => {
  const { id } = req.params;
  const actualizacion = new Actualizaciones();
  const servicio = await Servicio.findById(id);
  const estadoServicio = await EstadosServicio.findOne({ numeroEstado: "2" });

  const usuarios = await Usuario.find({ cliente: servicio.cliente });

  actualizacion.icon = "EnvelopeIcon";
  actualizacion.description = Date.now();
  actualizacion.color = "text-blue-500";
  actualizacion.title = `Notificacion Aceptacion de servicio Nro ${servicio.numeroPedido} enviada`;

  notificarRecepcionViaje(usuarios, servicio);

  servicio.estado = estadoServicio.estado;

  try {
    await servicio.save();
    await actualizacion.save();
    res.json("ok");
  } catch (error) {
    console.log(error);
  }
};

const obtenerServicio = async (req, res) => {
  // const { idProveedor } = req.body;
  const { id } = req.params;

  const servicio = await Servicio.findById(id);

  res.json(servicio);
};

const obtenerTodosLosServicios = async (req, res) => {
  const servicios = await Servicio.find();

  res.json(servicios);
};

const obtenerServiciosHoy = async (req, res) => {
  try {
    // Obtener la fecha de hoy en el formato necesario para comparar en la base de datos
    const fechaHoy = new Date().toLocaleDateString("es-AR");

    // Realizar la búsqueda en la base de datos filtrando por la fecha de hoy
    const servicios = await Servicio.find({
      estado: { $ne: "terminado" },
      fechaCarga: { $eq: fechaHoy },
    });

    res.json(servicios);
  } catch (error) {
    // Manejo de errores
    console.error(error);
    res.status(500).json({ message: "Error al obtener los servicios" });
  }
};

const viajesHoy = async (req, res) => {
  try {
    // Obtener la fecha de hoy en el formato necesario para comparar en la base de datos
    const fechaHoy = new Date();
    fechaHoy.setHours(0, 0, 0, 0);
    const fechaHoyString = fechaHoy.toISOString().split("T")[0];

    // Realizar la búsqueda en la base de datos filtrando por la fecha de hoy
    const viajes = await Viajes.find({
      estado: { $ne: "terminado" },
      fechaOrigen: fechaHoyString,
    });

    res.json(viajes);
  } catch (error) {
    // Manejo de errores
    console.error(error);
    res.status(500).json({ message: "Error al obtener los servicios" });
  }
};

const viajesAyerSinCerrar = async (req, res) => {
  try {
    // Obtener la fecha de hoy con la hora actual
    const fechaHoy = new Date();

    // Establecer la hora de fechaHoy a las 00:00:00 para incluir solo la fecha
    fechaHoy.setHours(0, 0, 0, 0);
    const fechaHoyString = fechaHoy.toISOString().split("T")[0];

    // Realizar la búsqueda en la base de datos filtrando por la fecha anterior a hoy y estado no cerrado,
    // y luego ordenar los resultados por fecha de la más próxima a la más lejana
    const viajes = await Viajes.find({
      estado: { $ne: "terminado" },
      fechaOrigen: { $lt: fechaHoyString },
    }).sort({ fechaOrigen: 1 }); // Orden ascendente (de la más próxima a la más lejana)

    res.json(viajes);
  } catch (error) {
    // Manejo de errores
    console.error(error);
    res.status(500).json({ message: "Error al obtener los servicios" });
  }
};

const viajesFuturosSinCerrar = async (req, res) => {
  try {
    // Obtener la fecha de hoy
    const fechaHoy = new Date();

    // Establecer la fecha de hoy sin incluir la hora exacta
    fechaHoy.setHours(0, 0, 0, 0);
    const fechaHoyString = fechaHoy.toISOString().split("T")[0];

    // Realizar la búsqueda en la base de datos filtrando por la fecha posterior a hoy y estado no cerrado,
    // y luego ordenar los resultados por fecha de la más próxima a la más lejana
    const viajes = await Viajes.find({
      estado: { $ne: "terminado" },
      fechaOrigen: { $gt: fechaHoyString },
    }).sort({ fechaOrigen: 1 }); // Orden ascendente (de la más próxima a la más lejana)

    res.json(viajes);
  } catch (error) {
    // Manejo de errores
    console.error(error);
    res.status(500).json({ message: "Error al obtener los servicios" });
  }
};

const obtenerServiciosManana = async (req, res) => {
  try {
    // Obtener la fecha de hoy en el formato necesario para comparar en la base de datos
    const fechaHoy = new Date().toISOString().split("T")[0];

    // Realizar la búsqueda en la base de datos filtrando por la fecha de hoy
    const servicios = await Servicio.find({
      estado: { $ne: "terminado" },
      fechaCarga: { $gt: fechaHoy },
    });

    res.json(servicios);
  } catch (error) {
    // Manejo de errores
    console.error(error);
    res.status(500).json({ message: "Error al obtener los servicios" });
  }
};

const asignarProveedor = async (req, res) => {
  const { idProveedor } = req.body;
  const { idViaje } = req.body;
  const { id } = req.params;
  const actualizacion = new Actualizaciones();
  const proveedor = await Proveedor.findById(idProveedor);
  const viaje = await Viajes.findById(idViaje);

  const estadoViaje = await EstadosViajes.findOne({ numeroEstado: 2 });

  const servicio = await Servicio.findById(id);

  viaje.proveedor = idProveedor;
  viaje.nombreProveedor = proveedor.nombre;

  viaje.estado = estadoViaje.estado;

  servicio.estado = "En Coordinacion";

  actualizacion.icon = "InformationCircleIcon";
  actualizacion.description = Date.now();
  actualizacion.color = "text-cyan-300";
  actualizacion.title = `Se asigno proveedor al viaje Nro ${viaje.numeroDeViaje}`;

  try {
    const data = await servicio.save();
    const viajeAlmacenado = await viaje.save();
    await actualizacion.save();
    res.json(data);
  } catch (error) {
    console.log(error);
  }
};

const reasignarProveedor = async (req, res) => {
  const { idProveedor } = req.body;
  const { id } = req.params;
  const actualizacion = new Actualizaciones();
  const proveedor = await Proveedor.findById(idProveedor);
  const viaje = await Viajes.findById(id);

  viaje.proveedor = proveedor._id;
  viaje.nombreProveedor = proveedor.nombre;

  viaje.chofer = [];
  viaje.camion = [];
  viaje.semi = [];
  viaje.nombreChofer = "";
  viaje.patenteCamion = "";
  viaje.patenteSemi = "";

  actualizacion.icon = "InformationCircleIcon";
  actualizacion.description = Date.now();
  actualizacion.color = "text-cyan-300";
  actualizacion.title = `Se reasigno proveedor al viaje Nro ${viaje.numeroDeViaje}`;

  try {
    const data = await viaje.save();
    await actualizacion.save();
    res.json(data);
  } catch (error) {
    console.log(error);
  }
};

const asignarEquipo = async (req, res) => {
  const { id } = req.params;
  const { idChofer } = req.body;
  const { idCamion } = req.body;
  const { idSemi } = req.body;
  const viaje = await Viajes.findById(id);
  const actualizacion = new Actualizaciones();

  const chofer = await Choferes.findById(idChofer);
  const camion = await Camiones.findById(idCamion);
  const semi = await Semis.findById(idSemi);

  const estadoViaje = await EstadosViajes.findOne({ numeroEstado: 4 });

  viaje.chofer = idChofer;
  viaje.nombreChofer = chofer.nombre + " " + chofer.apellido;
  viaje.camion = idCamion;
  viaje.patenteCamion = camion.patente;
  viaje.semi = idSemi;
  viaje.patenteSemi = semi.patente;

  viaje.estado = estadoViaje.estado;

  actualizacion.icon = "TruckIcon";
  actualizacion.description = Date.now();
  actualizacion.color = "text-gray-300";
  actualizacion.title = `Se asigno equipo al viaje Nro ${viaje.numeroDeViaje}`;

  try {
    const { data } = await viaje.save();
    await actualizacion.save();
    res.json(data);
  } catch (error) {
    console.log(error);
  }
};

const aprobarEquipo = async (req, res) => {
  const { id } = req.params;
  const actualizacion = new Actualizaciones();
  const viaje = await Viajes.findById(id);

  const estadoViaje = await EstadosViajes.findOne({ numeroEstado: 5 });

  viaje.estado = estadoViaje.estado;

  actualizacion.icon = "CheckIcon";
  actualizacion.description = Date.now();
  actualizacion.color = "text-blue-300";
  actualizacion.title = `Se asigno aprobo el equipo viaje Nro ${viaje.numeroDeViaje}`;

  try {
    const { data } = await viaje.save();
    await actualizacion.save();
    res.json(data);
  } catch (error) {
    console.log(error);
  }
};

const obtenerServiciosCliente = async (req, res) => {
  const { id } = req.params;

  try {
    const servicios = await Servicio.find({ cliente: id });
    res.json(servicios);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Ocurrió un error al obtener los servicios del cliente" });
  }
};

const obtenerViajesServicio = async (req, res) => {
  const { id } = req.params;

  try {
    const viajes = await Viajes.find({ servicio: id });
    res.json(viajes);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Ocurrió un error al obtener los viajes del servicio" });
  }
};

const aceptarServicio = async (req, res) => {
  const ahora = new Date();
  const hora = ahora.getHours();
  const minutos = ahora.getMinutes();
  const actualizacion = new Actualizaciones();
  const { id } = req.params;
  const { nombreUsuario, idUsuario } = req.body;

  const servicio = await Servicio.findById(id);

  servicio.estado = "Aceptado, esperando equipos";

  const historia = new HistoriaServicios();

  historia.fecha = Date.now();
  historia.hora = hora + " " + minutos;
  historia.titulo = "El proveedor acepto el servicio";
  historia.creador = idUsuario;
  historia.nombreUsuario = nombreUsuario;
  historia.servicio = id;

  actualizacion.icon = "RocketLaunchIcon";
  actualizacion.description = Date.now();
  actualizacion.color = "text-red-300";
  actualizacion.title = `El proveedor acepto el servicio nro ${servicio.numeroPedido}`;

  try {
    const historiaAlmacenada = await historia.save();
    servicio.historia = historiaAlmacenada._id;
    const servicioAlmacenado = await servicio.save();
    await actualizacion.save();
    res.json("Todo almacenado correctamente");
  } catch (error) {
    res.json(error);
  }
};

const obtenerServiciosProveedor = async (req, res) => {
  const { id } = req.params;

  const viajes = await Viajes.find({ proveedor: id });

  res.json(viajes);
};

const obtenerViaje = async (req, res) => {
  const { id } = req.params;

  const viaje = await Viajes.findById(id);

  res.json(viaje);
};

const nuevaTerminal = async (req, res) => {
  const terminal = new Terminales(req.body);
  const actualizacion = new Actualizaciones();

  terminal.creador = req.usuario._id;

  actualizacion.icon = "RocketLaunchIcon";
  actualizacion.description = Date.now();
  actualizacion.color = "text-red-300";
  actualizacion.title = `Terminal ${terminal.nombre} creada`;
  try {
    const terminalAlmacenada = await terminal.save();
    await actualizacion.save();
    res.json(terminalAlmacenada);
  } catch (error) {
    console.log(error);
  }
};

const nuevoLugarDevolucion = async (req, res) => {
  const devolucion = new Devoluciones(req.body);
  const actualizacion = new Actualizaciones();

  devolucion.creador = req.usuario._id;

  actualizacion.icon = "RocketLaunchIcon";
  actualizacion.description = Date.now();
  actualizacion.color = "text-red-300";
  actualizacion.title = `Playa de devolucion ${devolucion.nombre} creada`;

  try {
    const terminalAlmacenada = await devolucion.save();
    await actualizacion.save();
    res.json(terminalAlmacenada);
  } catch (error) {
    console.log(error);
  }
};

const nuevoEstadoServicio = async (req, res) => {
  const { estado } = req.body;

  const existeEstado = await EstadosServicio.findOne({ estado });

  if (existeEstado) {
    const error = new Error("El estado ya esta registrado");
    return res.status(400).json({ msg: error.message });
  } else {
    const nuevoEstado = new EstadosServicio(req.body);
    try {
      const estadoAlmacenado = await nuevoEstado.save();
      res.json(estadoAlmacenado);
    } catch (error) {
      console.log(error);
    }
  }
};
//FUNCION VIEJA PARA ACTUALIZAR EL ESTADO
// const actualizarEstadoServicio = async (req, res) => {
//   const { id } = req.params;
//   const { estado } = req.body;
//   const actualizacion = new Actualizaciones();
//   const servicio = await Servicio.findById(id);

//   if (servicio.estado === estado) {
//     const error = new Error("Selecciona un estado distinto al ya guardado");
//     return res.status(400).json({ msg: error.message });
//   } else {
//     servicio.estado = estado;
//     try {
//       actualizacion.icon = "ArrowPathIcon";
//       actualizacion.description = Date.now();
//       actualizacion.color = "text-red-300";
//       actualizacion.title = `Servicio Nro ${servicio.numeroPedido} actualizado a estado ${servicio.estado}`;

//       const estadoAlmacenado = await servicio.save();
//       await actualizacion.save();
//       res.json(estadoAlmacenado);
//     } catch (error) {
//       console.log(error);
//     }
//   }
// };

const actualizarEstadoServicio = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const actualizacion = new Actualizaciones();
  const servicio = await Servicio.findById(id);

  if (servicio.estado === estado) {
    const error = new Error("Selecciona un estado distinto al ya guardado");
    return res.status(400).json({ msg: error.message });
  } else {
    servicio.estado = estado;
    try {
      actualizacion.icon = "ArrowPathIcon";
      actualizacion.description = Date.now();
      actualizacion.color = "text-red-300";
      actualizacion.title = `Servicio Nro ${servicio.numeroPedido} actualizado a estado ${servicio.estado}`;

      const estadoAlmacenado = await servicio.save();

      // Iterar sobre los viajes asociados al servicio y actualizar estadoServicio
      const viajes = await Viajes.find({ servicio: servicio._id });
      for (const viaje of viajes) {
        viaje.estadoServicio = estado;
        await viaje.save();
      }

      await actualizacion.save();
      res.json(estadoAlmacenado);
    } catch (error) {
      console.log(error);
    }
  }
};

const actualizarEstadoViaje = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const actualizacion = new Actualizaciones();
  const viaje = await Viajes.findById(id);

  if (viaje.estado === estado) {
    const error = new Error("Selecciona un estado distinto al ya guardado");
    return res.status(400).json({ msg: error.message });
  } else {
    viaje.estado = estado;
  }

  try {
    actualizacion.icon = "ArrowPathIcon";
    actualizacion.description = Date.now();
    actualizacion.color = "text-red-300";
    actualizacion.title = `Viaje Nro ${viaje.numeroDeViaje} actualizado a estado ${viaje.estado}`;

    await actualizacion.save();
    const estadoAlmacenado = await viaje.save();
    res.json({ msg: "Estado Actualizado" });
  } catch (error) {
    console.log(error);
  }
};

const nuevoEstadoViaje = async (req, res) => {
  // const estado = new EstadosServicio(req.body);

  const { estado } = req.body;

  const existeEstado = await EstadosViajes.findOne({ estado });

  if (existeEstado) {
    const error = new Error("El estado ya esta registrado");
    return res.status(400).json({ msg: error.message });
  } else {
    const nuevoEstado = new EstadosViajes(req.body);
    try {
      const estadoAlmacenado = await nuevoEstado.save();
      res.json(estadoAlmacenado);
    } catch (error) {
      console.log(error);
    }
  }

  try {
    const estadoAlmacenado = await estado.save();

    res.json(estadoAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const obtenerEstadosServicio = async (req, res) => {
  const estados = await EstadosServicio.find();

  res.json(estados);
};

const obtenerEstadosViaje = async (req, res) => {
  const estados = await EstadosViajes.find();

  res.json(estados);
};

const editarViaje = async (req, res) => {
  const { id } = req.params;
  const { tipoServicio } = req.body;

  const viaje = await Viajes.findById(id);
  const actualizacion = new Actualizaciones();
  if (!viaje) {
    const error = new Error("Viaje no encontrado");
    return res.status(404).json({ msg: error.message });
  }

  viaje.numeroContenedor = req.body.numeroContenedor || viaje.numeroContenedor;
  viaje.fechaOrigen = req.body.fechaOrigen || viaje.fechaOrigen;
  viaje.horaOrigen = req.body.horaOrigen || viaje.horaOrigen;
  viaje.direccionRetorno = req.body.direccionRetorno || viaje.direccionRetorno;
  viaje.estado = req.body.estado || viaje.estado;

  if (tipoServicio == "importacion") {
    const origen = await Terminales.findById(req.body.domicilioOrigen);
    const destino = await Domicilios.findById(req.body.domicilioDestino);

    viaje.domicilioOrigenTerminal =
      req.body.domicilioOrigen || viaje.domicilioOrigenTerminal;

    viaje.nombreDomicilioDestinoCliente =
      req.body.domicilioDestino || viaje.nombreDomicilioDestinoCliente;

    viaje.nombreDomicilioOrigenTerminal = origen.direccion;
    viaje.nombreDomicilioDestinoCliente = destino.direccion;
  }

  if (tipoServicio == "exportacion") {
    const origen = await Domicilios.findById(req.body.domicilioOrigen);
    const destino = await Terminales.findById(req.body.domicilioDestino);

    viaje.domicilioOrigenCliente =
      req.body.domicilioOrigen || viaje.domicilioOrigenCliente;

    viaje.domicilioDestinoTerminal =
      req.body.domicilioDestino || viaje.domicilioDestinoTerminal;

    viaje.nombreDomicilioOrigenCliente = origen.direccion;
    viaje.nombreDomicilioDestinoTerminal = destino.direccion;
  }

  if (tipoServicio == "transito-aduanero") {
    const origen = await Terminales.findById(req.body.domicilioOrigen);
    const destino = await Terminales.findById(req.body.domicilioDestino);

    viaje.domicilioOrigenTerminal =
      req.body.domicilioOrigen || viaje.domicilioOrigenTerminal;
    viaje.domicilioDestinoTerminal =
      req.body.domicilioDestino || viaje.domicilioDestinoTerminal;

    viaje.nombreDomicilioOrigenTerminal = origen.direccion;
    viaje.nombreDomicilioDestinoTerminal = destino.direccion;
  }

  if (tipoServicio == "nacional") {
    const origen = await Domicilios.findById(req.body.domicilioOrigen);
    const destino = await Domicilios.findById(req.body.domicilioDestino);

    viaje.domicilioOrigenCliente =
      req.body.domicilioOrigen || viaje.domicilioOrigenCliente;
    viaje.nombreDomicilioDestinoCliente =
      req.body.domicilioDestino || viaje.nombreDomicilioDestinoCliente;

    viaje.nombreDomicilioOrigenCliente = origen.direccion;
    viaje.nombreDomicilioDestinoCliente = destino.direccion;
  }

  try {
    actualizacion.icon = "PencilSquareIcon";
    actualizacion.description = Date.now();
    actualizacion.color = "text-green-300";
    actualizacion.title = `Se edito el viaje Nro ${viaje.numeroDeViaje}`;
    await actualizacion.save();
    const viajeAlmacenado = await viaje.save();
    res.json(viajeAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const obtenerActualizaciones = async (req, res) => {
  try {
    const actualizaciones = await Actualizaciones.find()
      .sort({ createdAt: -1 }) // Ordenar por fecha de creación en orden descendente
      .limit(3); // Limitar el resultado a las últimas 5 actualizaciones

    res.json(actualizaciones);
  } catch (error) {
    console.log(error);
  }
};

export {
  nuevoServicioImportacion,
  nuevoServicioExportacion,
  nuevoTransito,
  nuevoServicioNacional,
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
};
