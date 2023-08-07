import Cliente from "../models/Cliente.js";

import Servicio from "../models/Servicio.js";
import HistoriaServicios from "../models/HistoriaServicios.js";

import {
  notificarRecepcionViaje,
  notificarViajeSoloLogicsar,
  notificarViajes,
  soloLogicsar,
} from "../helpers/emails.js";
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
import Documentacion from "../models/Documentacion.js";
import ConceptosAFActurar from "../models/ConceptosAFActurar.js";
import { grabarEnExcel } from "../helpers/grabarNumeroFActura.js";
import { faPieChart, faLineChart } from "@fortawesome/free-solid-svg-icons";

const nuevoServicioImportacion = async (req, res) => {
  const { idCliente } = req.body;
  const { numeroContenedores } = req.body;
  const { origenCarga } = req.body;
  const { destinoCarga } = req.body;
  const { fechaCarga } = req.body;
  const fechaParaList = new Date(fechaCarga);
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

  const numerosContenedores = [];

  try {
    const servicioalmacenado = await servicio.save();
    actualizacion.title = `Servicio importacion Nro ${servicioalmacenado.numeroPedido} ingresado`;

    if (
      servicioalmacenado.tipoCarga === "cajas" ||
      servicioalmacenado.tipoCarga === "bultos" ||
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
        fantasiaOrigen: domicilio.nombre,
        fantasiaDestino: destino.fantasia,
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
        estadoServicio: servicioalmacenado.estado,
        notificado: "Sin Notificar",
        referenciaCliente: servicioalmacenado.numeroCliente,
        observacionesServicio: servicioalmacenado.observaciones,
        fechaOrigenParaListados: fechaParaList,
      });

      const viajeAlmacenado = await nuevoViaje.save();
      servicioalmacenado.viajesSueltos = viajeAlmacenado._id;
      await cargarDocumentacionARecibir(
        cliente.nombre,
        cliente._id,
        servicioalmacenado.numeroPedido,
        servicioalmacenado._id,
        `${servicioalmacenado.numeroPedido}/1`,
        viajeAlmacenado._id,
        "Mercaderia sin Contenedor",
        "Remito"
      );

      const conceptos = {
        descripcion0: `${servicioalmacenado.tipoCarga}`,
        descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
          servicioalmacenado.tipoCarga
        } - ${servicioalmacenado.peso} - desde ${
          domicilio.nombre
            ? `${domicilio.nombre} - (${domicilio.direccion} - ${domicilio.localidad})`
            : `${domicilio.direccion}-${domicilio.localidad}`
        } hasta ${
          destino.fantasia
            ? `${destino.fantasia} - (${destino.direccion}-${destino.localidad})`
            : `${destino.direccion} - ${destino.localidad}-${destino.localidad}`
        }`,
        descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
        descripcion3: `${servicioalmacenado.despachoAduana}`,
        descripcion4: `Contenedor: ${viajeAlmacenado.numeroContenedor}`,
        descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
      };

      await cargarConceptosAFacturar(
        viajeAlmacenado.fechaOrigen,
        cliente._id,
        cliente.nombre,
        conceptos,
        servicioalmacenado._id
      );
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
              fechaOrigen: servicioalmacenado.fechaCarga,
              horaOrigen: servicioalmacenado.horaCarga,
              creador: req.usuario._id,
              cliente: cliente._id,
              nombreCliente: cliente.nombre,
              domicilioOrigenTerminal: origenCarga,
              nombreDomicilioOrigenTerminal: domicilio.direccion,
              fantasiaOrigen: domicilio.nombre,
              fantasiaDestino: destino.fantasia,
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
              estadoServicio: servicioalmacenado.estado,
              notificado: "Sin Notificar",
              referenciaCliente: servicioalmacenado.numeroCliente,
              observacionesServicio: servicioalmacenado.observaciones,
              fechaOrigenParaListados: fechaParaList,
            });

            const viajeAlmacenado = await nuevoViaje.save();
            await cargarDocumentacionARecibir(
              cliente.nombre,
              cliente._id,
              servicioalmacenado.numeroPedido,
              servicioalmacenado._id,
              `${servicioalmacenado.numeroPedido}/${index + 1}`,
              viajeAlmacenado._id,
              numeroContenedor.numeroContenedor,
              "Remito"
            );
            await cargarDocumentacionARecibir(
              cliente.nombre,
              cliente._id,
              servicioalmacenado.numeroPedido,
              servicioalmacenado._id,
              `${servicioalmacenado.numeroPedido}/${index + 1}`,
              viajeAlmacenado._id,
              numeroContenedor.numeroContenedor,
              "Devolucion Vacio"
            );

            return viajeAlmacenado._id;
          }
        );

        numeroContenedores.forEach((numeroContenedor) => {
          numerosContenedores.push(numeroContenedor.numeroContenedor);
        });

        const numerosContenedoresString = numerosContenedores.join("/");

        const conceptos = {
          descripcion0: `${servicioalmacenado.tipoCarga}`,
          descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
            servicioalmacenado.tipoCarga
          } - ${servicioalmacenado.peso} - desde ${
            domicilio.nombre
              ? `${domicilio.nombre} - (${domicilio.direccion}-${domicilio.localidad})`
              : `${domicilio.direccion}-${domicilio.localidad}`
          } hasta ${
            destino.fantasia
              ? `${destino.fantasia} - (${destino.direccion})`
              : `${destino.direccion}`
          }`,
          descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
          descripcion3: `${servicioalmacenado.despachoAduana}`,
          descripcion4: `Contenedores: ${numerosContenedoresString}`,
          descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
        };
        await cargarConceptosAFacturar(
          servicio.fechaCarga,
          cliente._id,
          cliente.nombre,
          conceptos,
          servicioalmacenado._id
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
          fechaDevolucion: numeroContenedores[0].fechaDevolucion,
          horaDevolucion: numeroContenedores[0].horaDevolucionContenedor,
          fechaVencimientoDevolucion:
            numeroContenedores[0].fechaVencimientoDevolucionContenedor,
          lugarDevolucion: numeroContenedores[0].direccionRetorno,
          estado: estadoViaje.estado,
          horaOrigen: servicioalmacenado.horaCarga,
          fechaOrigen: servicioalmacenado.fechaCarga,
          creador: req.usuario._id,
          cliente: cliente._id,
          nombreCliente: cliente.nombre,
          domicilioOrigenTerminal: origenCarga,
          nombreDomicilioOrigenTerminal: domicilio.direccion,
          domicilioDestinoCliente: destinoCarga,
          fantasiaOrigen: domicilio.nombre,
          fantasiaDestino: destino.fantasia,
          nombreDomicilioDestinoCliente: destino.direccion,
          servicio: servicioalmacenado._id,
          tipoServicio: servicioalmacenado.tipoOperacion,
          tipoCarga: servicioalmacenado.tipoCarga,
          numeroDeViaje: `${servicioalmacenado.numeroPedido}/1`,
          cantidadCarga: servicioalmacenado.cantidad,
          volumenCarga: servicioalmacenado.volumen,
          pesoCarga: servicioalmacenado.peso,
          estadoServicio: servicioalmacenado.estado,
          notificado: "Sin Notificar",
          observacionesServicio: servicioalmacenado.observaciones,
          referenciaCliente: servicioalmacenado.numeroCliente,
          fechaOrigenParaListados: fechaParaList,
        });
        const viajeAlmacenado = await nuevoViaje.save();
        await cargarDocumentacionARecibir(
          cliente.nombre,
          cliente._id,
          servicioalmacenado.numeroPedido,
          servicioalmacenado._id,
          `${servicioalmacenado.numeroPedido}/1`,
          viajeAlmacenado._id,
          numeroContenedores[0].numeroContenedor,
          "Remito"
        );
        await cargarDocumentacionARecibir(
          cliente.nombre,
          cliente._id,
          servicioalmacenado.numeroPedido,
          servicioalmacenado._id,
          `${servicioalmacenado.numeroPedido}/1`,
          viajeAlmacenado._id,
          numeroContenedores[0].numeroContenedor,
          "Devolucion Vacio"
        );

        const conceptos = {
          descripcion0: `${servicioalmacenado.tipoCarga}`,
          descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
            servicioalmacenado.tipoCarga
          } - ${servicioalmacenado.peso} - desde ${
            domicilio.nombre
              ? `${domicilio.nombre} - (${domicilio.direccion})`
              : `${domicilio.direccion}- ${domicilio.localidad}`
          } hasta ${
            destino.fantasia
              ? `${destino.fantasia} - (${destino.direccion} - ${destino.localidad})`
              : `${destino.direccion} - ${destino.localidad}`
          }`,
          descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
          descripcion3: `${servicioalmacenado.despachoAduana}`,
          descripcion4: `Contenedor: ${viajeAlmacenado.numeroContenedor}`,
          descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
        };
        await cargarConceptosAFacturar(
          viajeAlmacenado.fechaOrigen,
          cliente._id,
          cliente.nombre,
          conceptos,

          servicioalmacenado._id
        );

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

    if (usuarios.length == 0) {
      await soloLogicsar(servicioalmacenado);
    } else {
      await notificarRecepcionViaje(usuarios, servicioalmacenado);
    }

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
  const { fechaCarga } = req.body;
  const fechaParaList = new Date(fechaCarga);

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
  const numerosContenedores = [];

  try {
    const servicioalmacenado = await servicio.save();

    actualizacion.icon = "PlusCircleIcon";
    actualizacion.description = Date.now();
    actualizacion.color = "text-green-500";
    actualizacion.title = `Servicio One Way Full Nro ${servicioalmacenado.numeroPedido} ingresado`;

    if (
      servicioalmacenado.tipoCarga === "cajas" ||
      servicioalmacenado.tipoCarga === "bultos" ||
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
        fantasiaOrigen: domicilio.fantasia,
        fantasiaDestino: destino.nombre,
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
        estadoServicio: servicioalmacenado.estado,
        notificado: "Sin Notificar",
        observacionesServicio: servicioalmacenado.observaciones,
        fechaOrigenParaListados: fechaParaList,

        referenciaCliente: servicioalmacenado.numeroCliente,
      });

      const viajeAlmacenado = await nuevoViaje.save();
      servicioalmacenado.viajesSueltos = viajeAlmacenado._id;
      await cargarDocumentacionARecibir(
        cliente.nombre,
        cliente._id,
        servicioalmacenado.numeroPedido,
        servicioalmacenado._id,
        `${servicioalmacenado.numeroPedido}/1`,
        viajeAlmacenado._id,
        "Mercaderia sin Contenedor",
        "Remito"
      );

      const conceptos = {
        descripcion0: `${servicioalmacenado.tipoCarga}`,
        descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
          servicioalmacenado.tipoCarga
        } - ${servicioalmacenado.peso} - desde ${
          domicilio.fantasia
            ? `${domicilio.fantasia} - (${domicilio.direccion})`
            : `${domicilio.direccion}- ${domicilio.localidad}`
        } hasta ${
          destino.nombre
            ? `${destino.nombre} - (${destino.direccion} - ${destino.localidad})`
            : `${destino.direccion} - ${destino.localidad}`
        }`,
        descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
        descripcion3: `${servicioalmacenado.despachoAduana}`,
        descripcion4: `Contenedor: ${viajeAlmacenado.numeroContenedor}`,
        descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
      };
      await cargarConceptosAFacturar(
        viajeAlmacenado.fechaOrigen,
        cliente._id,
        cliente.nombre,
        conceptos,

        servicioalmacenado._id
      );
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
              fechaOrigen: servicioalmacenado.fechaCarga,
              horaOrigen: servicioalmacenado.horaCarga,
              creador: req.usuario._id,
              cliente: cliente._id,
              nombreCliente: cliente.nombre,
              domicilioOrigenCliente: origenCarga,
              fantasiaOrigen: domicilio.fantasia,
              fantasiaDestino: destino.nombre,
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
              estadoServicio: servicioalmacenado.estado,
              notificado: "Sin Notificar",
              referenciaCliente: servicioalmacenado.numeroCliente,
              observacionesServicio: servicioalmacenado.observaciones,
              fechaOrigenParaListados: fechaParaList,
            });

            const viajeAlmacenado = await nuevoViaje.save();
            await cargarDocumentacionARecibir(
              cliente.nombre,
              cliente._id,
              servicioalmacenado.numeroPedido,
              servicioalmacenado._id,
              `${servicioalmacenado.numeroPedido}/${index + 1}`,
              viajeAlmacenado._id,
              numeroContenedor.numeroContenedor,
              "Remito"
            );
            await cargarDocumentacionARecibir(
              cliente.nombre,
              cliente._id,
              servicioalmacenado.numeroPedido,
              servicioalmacenado._id,
              `${servicioalmacenado.numeroPedido}/${index + 1}`,
              viajeAlmacenado._id,
              numeroContenedor.numeroContenedor,
              "Devolucion Vacio"
            );

            return viajeAlmacenado._id;
          }
        );

        numeroContenedores.forEach((numeroContenedor) => {
          numerosContenedores.push(numeroContenedor.numeroContenedor);
        });

        const numerosContenedoresString = numerosContenedores.join("/");

        const conceptos = {
          descripcion0: `${servicioalmacenado.tipoCarga}`,
          descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
            servicioalmacenado.tipoCarga
          } - ${servicioalmacenado.peso} - desde ${
            domicilio.fantasia
              ? `${domicilio.fantasia} - (${domicilio.direccion})`
              : `${domicilio.direccion}- ${domicilio.localidad}`
          } hasta ${
            destino.nombre
              ? `${destino.nombre} - (${destino.direccion} - ${destino.localidad})`
              : `${destino.direccion} - ${destino.localidad}`
          }`,
          descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
          descripcion3: `${servicioalmacenado.despachoAduana}`,
          descripcion4: `Contenedores: ${numerosContenedoresString}`,
          descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
        };
        await cargarConceptosAFacturar(
          servicio.fechaCarga,
          cliente._id,
          cliente.nombre,
          conceptos,

          servicioalmacenado._id
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
          numeroContenedor: numeroContenedores[0].numeroContenedor,
          fechaDevolucion: numeroContenedores[0].fechaDevolucion,
          horaDevolucion: numeroContenedores[0].horaDevolucionContenedor,
          fechaVencimientoDevolucion:
            numeroContenedores[0].fechaVencimientoDevolucionContenedor,
          lugarDevolucion: numeroContenedores[0].direccionRetorno,
          estado: estadoViaje.estado,
          horaOrigen: servicioalmacenado.horaCarga,
          fechaOrigen: servicioalmacenado.fechaCarga,
          creador: req.usuario._id,
          cliente: cliente._id,
          nombreCliente: cliente.nombre,
          domicilioOrigenCliente: origenCarga,
          fantasiaOrigen: domicilio.fantasia,
          fantasiaDestino: destino.nombre,
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
          estadoServicio: servicioalmacenado.estado,
          notificado: "Sin Notificar",
          observacionesServicio: servicioalmacenado.observaciones,

          referenciaCliente: servicioalmacenado.numeroCliente,
          fechaOrigenParaListados: fechaParaList,
        });
        const viajeAlmacenado = await nuevoViaje.save();
        await cargarDocumentacionARecibir(
          cliente.nombre,
          cliente._id,
          servicioalmacenado.numeroPedido,
          servicioalmacenado._id,
          `${servicioalmacenado.numeroPedido}/$1`,
          viajeAlmacenado._id,
          numeroContenedores[0].numeroContenedor
        );
        await cargarDocumentacionARecibir(
          cliente.nombre,
          cliente._id,
          servicioalmacenado.numeroPedido,
          servicioalmacenado._id,
          `${servicioalmacenado.numeroPedido}/1`,
          viajeAlmacenado._id,
          numeroContenedores[0].numeroContenedor,
          "Devolucion Vacio"
        );
        const conceptos = {
          descripcion0: `${servicioalmacenado.tipoCarga}`,
          descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
            servicioalmacenado.tipoCarga
          } - ${servicioalmacenado.peso} - desde ${
            domicilio.fantasia
              ? `${domicilio.fantasia} - (${domicilio.direccion})`
              : `${domicilio.direccion}- ${domicilio.localidad}`
          } hasta ${
            destino.nombre
              ? `${destino.nombre} - (${destino.direccion} - ${destino.localidad})`
              : `${destino.direccion} - ${destino.localidad}`
          }`,
          descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
          descripcion3: `${servicioalmacenado.despachoAduana}`,
          descripcion4: `Contenedor: ${viajeAlmacenado.numeroContenedor}`,
          descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
        };
        await cargarConceptosAFacturar(
          viajeAlmacenado.fechaOrigen,
          cliente._id,
          cliente.nombre,
          conceptos,

          servicioalmacenado._id
        );

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

    if (usuarios.length == 0) {
      await soloLogicsar(servicioalmacenado);
    } else {
      await notificarRecepcionViaje(usuarios, servicioalmacenado);
    }

    res.json(servicioalmacenado);
  } catch (error) {
    console.log(error);
  }
};
const nuevaRoundTripExpo = async (req, res) => {
  const { idCliente } = req.body;
  const { numeroContenedores } = req.body;
  const { origenCarga } = req.body;
  const { destinoCarga } = req.body;
  const cliente = await Cliente.findById(idCliente);
  const servicio = new Servicio(req.body);
  const { fechaCarga } = req.body;
  const fechaParaList = new Date(fechaCarga);

  const actualizacion = new Actualizaciones();

  const destino = await Terminales.findById(destinoCarga);
  const domicilio = await Domicilios.findById(origenCarga);
  const playas = await Devoluciones.findById(req.body.playa);

  const estadoServicio = await EstadosServicio.findOne({ numeroEstado: "2" });

  const estadoViaje = await EstadosViajes.findOne({ numeroEstado: "1" });

  servicio.nombreCliente = cliente.nombre;
  servicio.cliente = idCliente;
  servicio.estado = estadoServicio.estado;
  servicio.origenCarga = domicilio.direccion;
  servicio.destinoCarga = destino.direccion;
  servicio.notificar = "Sin Notificar";
  servicio.nombreTerminal = domicilio.nombre;
  servicio.playa = playas.nombre;
  const numerosContenedores = [];

  try {
    const servicioalmacenado = await servicio.save();

    actualizacion.icon = "PlusCircleIcon";
    actualizacion.description = Date.now();
    actualizacion.color = "text-green-500";
    actualizacion.title = `Servicio One Way Full Nro ${servicioalmacenado.numeroPedido} ingresado`;

    if (
      servicioalmacenado.tipoCarga === "cajas" ||
      servicioalmacenado.tipoCarga === "bultos" ||
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
        fantasiaOrigen: domicilio.fantasia,
        fantasiaDestino: destino.nombre,
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
        estadoServicio: servicioalmacenado.estado,
        notificado: "Sin Notificar",
        observacionesServicio: servicioalmacenado.observaciones,
        referenciaCliente: servicioalmacenado.numeroCliente,
        nombrePlaya: playas.nombre,
        domicilioPlaya: playas._id,
        fechaOrigenParaListados: fechaParaList,
      });

      const viajeAlmacenado = await nuevoViaje.save();
      servicioalmacenado.viajesSueltos = viajeAlmacenado._id;
      await cargarDocumentacionARecibir(
        cliente.nombre,
        cliente._id,
        servicioalmacenado.numeroPedido,
        servicioalmacenado._id,
        `${servicioalmacenado.numeroPedido}/1`,
        viajeAlmacenado._id,
        "Mercaderia sin Contenedor",
        "Remito"
      );

      const conceptos = {
        descripcion0: `${servicioalmacenado.tipoCarga}`,
        descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
          servicioalmacenado.tipoCarga
        } - ${servicioalmacenado.peso} - desde ${
          domicilio.fantasia
            ? `${domicilio.fantasia} - (${domicilio.direccion})`
            : `${domicilio.direccion}- ${domicilio.localidad}`
        } hasta ${
          destino.nombre
            ? `${destino.nombre} - (${destino.direccion} - ${destino.localidad})`
            : `${destino.direccion} - ${destino.localidad}`
        }`,
        descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
        descripcion3: `${servicioalmacenado.despachoAduana}`,
        descripcion4: `Contenedor: ${viajeAlmacenado.numeroContenedor}`,
        descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
      };
      await cargarConceptosAFacturar(
        viajeAlmacenado.fechaOrigen,
        cliente._id,
        cliente.nombre,
        conceptos,

        servicioalmacenado._id
      );
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
              fechaOrigen: servicioalmacenado.fechaCarga,
              horaOrigen: servicioalmacenado.horaCarga,
              creador: req.usuario._id,
              cliente: cliente._id,
              nombreCliente: cliente.nombre,
              domicilioOrigenCliente: origenCarga,
              fantasiaOrigen: domicilio.fantasia,
              fantasiaDestino: destino.nombre,
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
              estadoServicio: servicioalmacenado.estado,
              notificado: "Sin Notificar",
              referenciaCliente: servicioalmacenado.numeroCliente,
              observacionesServicio: servicioalmacenado.observaciones,
              nombrePlaya: playas.nombre,
              domicilioPlaya: playas._id,
              fechaOrigenParaListados: fechaParaList,
            });

            const viajeAlmacenado = await nuevoViaje.save();
            await cargarDocumentacionARecibir(
              cliente.nombre,
              cliente._id,
              servicioalmacenado.numeroPedido,
              servicioalmacenado._id,
              `${servicioalmacenado.numeroPedido}/${index + 1}`,
              viajeAlmacenado._id,
              numeroContenedor.numeroContenedor,
              "Remito"
            );
            await cargarDocumentacionARecibir(
              cliente.nombre,
              cliente._id,
              servicioalmacenado.numeroPedido,
              servicioalmacenado._id,
              `${servicioalmacenado.numeroPedido}/${index + 1}`,
              viajeAlmacenado._id,
              numeroContenedor.numeroContenedor,
              "Devolucion Vacio"
            );

            return viajeAlmacenado._id;
          }
        );

        numeroContenedores.forEach((numeroContenedor) => {
          numerosContenedores.push(numeroContenedor.numeroContenedor);
        });

        const numerosContenedoresString = numerosContenedores.join("/");

        const conceptos = {
          descripcion0: `${servicioalmacenado.tipoCarga}`,
          descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
            servicioalmacenado.tipoCarga
          } - ${servicioalmacenado.peso} - desde ${
            domicilio.fantasia
              ? `${domicilio.fantasia} - (${domicilio.direccion})`
              : `${domicilio.direccion}- ${domicilio.localidad}`
          } hasta ${
            destino.nombre
              ? `${destino.nombre} - (${destino.direccion} - ${destino.localidad})`
              : `${destino.direccion} - ${destino.localidad}`
          }`,
          descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
          descripcion3: `${servicioalmacenado.despachoAduana}`,
          descripcion4: `Contenedores: ${numerosContenedoresString}`,
          descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
        };
        await cargarConceptosAFacturar(
          servicio.fechaCarga,
          cliente._id,
          cliente.nombre,
          conceptos,

          servicioalmacenado._id
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
          numeroContenedor: numeroContenedores[0].numeroContenedor,
          fechaDevolucion: numeroContenedores[0].fechaDevolucion,
          horaDevolucion: numeroContenedores[0].horaDevolucionContenedor,
          fechaVencimientoDevolucion:
            numeroContenedores[0].fechaVencimientoDevolucionContenedor,
          lugarDevolucion: numeroContenedores[0].direccionRetorno,
          estado: estadoViaje.estado,
          horaOrigen: servicioalmacenado.horaCarga,
          fechaOrigen: servicioalmacenado.fechaCarga,
          creador: req.usuario._id,
          cliente: cliente._id,
          nombreCliente: cliente.nombre,
          domicilioOrigenCliente: origenCarga,
          fantasiaOrigen: domicilio.fantasia,
          fantasiaDestino: destino.nombre,
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
          estadoServicio: servicioalmacenado.estado,
          notificado: "Sin Notificar",
          observacionesServicio: servicioalmacenado.observaciones,
          fechaOrigenParaListados: fechaParaList,

          referenciaCliente: servicioalmacenado.numeroCliente,
          nombrePlaya: playas.nombre,
          domicilioPlaya: playas._id,
        });
        const viajeAlmacenado = await nuevoViaje.save();
        await cargarDocumentacionARecibir(
          cliente.nombre,
          cliente._id,
          servicioalmacenado.numeroPedido,
          servicioalmacenado._id,
          `${servicioalmacenado.numeroPedido}/$1`,
          viajeAlmacenado._id,
          numeroContenedores[0].numeroContenedor
        );
        await cargarDocumentacionARecibir(
          cliente.nombre,
          cliente._id,
          servicioalmacenado.numeroPedido,
          servicioalmacenado._id,
          `${servicioalmacenado.numeroPedido}/1`,
          viajeAlmacenado._id,
          numeroContenedores[0].numeroContenedor,
          "Devolucion Vacio"
        );
        const conceptos = {
          descripcion0: `${servicioalmacenado.tipoCarga}`,
          descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
            servicioalmacenado.tipoCarga
          } - ${servicioalmacenado.peso} - desde ${
            domicilio.fantasia
              ? `${domicilio.fantasia} - (${domicilio.direccion})`
              : `${domicilio.direccion}- ${domicilio.localidad}`
          } hasta ${
            destino.nombre
              ? `${destino.nombre} - (${destino.direccion} - ${destino.localidad})`
              : `${destino.direccion} - ${destino.localidad}`
          }`,
          descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
          descripcion3: `${servicioalmacenado.despachoAduana}`,
          descripcion4: `Contenedor: ${viajeAlmacenado.numeroContenedor}`,
          descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
        };
        await cargarConceptosAFacturar(
          viajeAlmacenado.fechaOrigen,
          cliente._id,
          cliente.nombre,
          conceptos,

          servicioalmacenado._id
        );

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

    if (usuarios.length == 0) {
      await soloLogicsar(servicioalmacenado);
    } else {
      await notificarRecepcionViaje(usuarios, servicioalmacenado);
    }

    res.json(servicioalmacenado);
  } catch (error) {
    console.log(error);
  }
};
const nuevoServicioDevolucionVacios = async (req, res) => {
  const { idCliente } = req.body;
  const { numeroContenedores } = req.body;
  const { origenCarga } = req.body;
  const { destinoCarga } = req.body;
  const cliente = await Cliente.findById(idCliente);
  const servicio = new Servicio(req.body);
  const { fechaCarga } = req.body;
  const fechaParaList = new Date(fechaCarga);

  const actualizacion = new Actualizaciones();

  const destino = await Devoluciones.findById(destinoCarga);
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

  const numerosContenedores = [];

  try {
    const servicioalmacenado = await servicio.save();

    actualizacion.icon = "PlusCircleIcon";
    actualizacion.description = Date.now();
    actualizacion.color = "text-green-500";
    actualizacion.title = `Servicio Devolucion Vacios Nro ${servicioalmacenado.numeroPedido} ingresado`;

    if (
      servicioalmacenado.tipoCarga === "cajas" ||
      servicioalmacenado.tipoCarga === "bultos" ||
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
        fantasiaOrigen: domicilio.fantasia,
        fantasiaDestino: destino.nombre,
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
        estadoServicio: servicioalmacenado.estado,
        notificado: "Sin Notificar",
        observacionesServicio: servicioalmacenado.observaciones,
        fechaOrigenParaListados: fechaParaList,

        referenciaCliente: servicioalmacenado.numeroCliente,
      });

      const viajeAlmacenado = await nuevoViaje.save();
      servicioalmacenado.viajesSueltos = viajeAlmacenado._id;
      await cargarDocumentacionARecibir(
        cliente.nombre,
        cliente._id,
        servicioalmacenado.numeroPedido,
        servicioalmacenado._id,
        `${servicioalmacenado.numeroPedido}/1`,
        viajeAlmacenado._id,
        "Mercaderia sin Contenedor",
        "Remito"
      );

      const conceptos = {
        descripcion0: `${servicioalmacenado.tipoCarga}`,
        descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
          servicioalmacenado.tipoCarga
        } - ${servicioalmacenado.peso} - desde ${
          domicilio.fantasia
            ? `${domicilio.fantasia} - (${domicilio.direccion})`
            : `${domicilio.direccion}- ${domicilio.localidad}`
        } hasta ${
          destino.nombre
            ? `${destino.nombre} - (${destino.direccion} - ${destino.localidad})`
            : `${destino.direccion} - ${destino.localidad}`
        }`,
        descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
        descripcion3: `${servicioalmacenado.despachoAduana}`,
        descripcion4: `Contenedor: ${viajeAlmacenado.numeroContenedor}`,
        descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
      };
      await cargarConceptosAFacturar(
        viajeAlmacenado.fechaOrigen,
        cliente._id,
        cliente.nombre,
        conceptos,

        servicioalmacenado._id
      );
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

              fechaOrigen: servicioalmacenado.fechaCarga,
              horaOrigen: servicioalmacenado.horaCarga,
              creador: req.usuario._id,
              cliente: cliente._id,
              nombreCliente: cliente.nombre,
              domicilioOrigenCliente: origenCarga,
              fantasiaOrigen: domicilio.fantasia,
              fantasiaDestino: destino.nombre,
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
              estadoServicio: servicioalmacenado.estado,
              notificado: "Sin Notificar",
              observacionesServicio: servicioalmacenado.observaciones,
              referenciaCliente: servicioalmacenado.numeroCliente,
              fechaOrigenParaListados: fechaParaList,
            });

            const viajeAlmacenado = await nuevoViaje.save();
            await cargarDocumentacionARecibir(
              cliente.nombre,
              cliente._id,
              servicioalmacenado.numeroPedido,
              servicioalmacenado._id,
              `${servicioalmacenado.numeroPedido}/${index + 1}`,
              viajeAlmacenado._id,
              numeroContenedor.numeroContenedor,
              "Remito"
            );
            await cargarDocumentacionARecibir(
              cliente.nombre,
              cliente._id,
              servicioalmacenado.numeroPedido,
              servicioalmacenado._id,
              `${servicioalmacenado.numeroPedido}/${index + 1}`,
              viajeAlmacenado._id,
              numeroContenedor.numeroContenedor,
              "Devolucion Vacio"
            );

            return viajeAlmacenado._id;
          }
        );

        numeroContenedores.forEach((numeroContenedor) => {
          numerosContenedores.push(numeroContenedor.numeroContenedor);
        });

        const numerosContenedoresString = numerosContenedores.join("/");

        const conceptos = {
          descripcion0: `${servicioalmacenado.tipoCarga}`,
          descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
            servicioalmacenado.tipoCarga
          } - ${servicioalmacenado.peso} - desde ${
            domicilio.fantasia
              ? `${domicilio.fantasia} - (${domicilio.direccion})`
              : `${domicilio.direccion}- ${domicilio.localidad}`
          } hasta ${
            destino.nombre
              ? `${destino.nombre} - (${destino.direccion} - ${destino.localidad})`
              : `${destino.direccion} - ${destino.localidad}`
          }`,
          descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
          descripcion3: `${servicioalmacenado.despachoAduana}`,
          descripcion4: `Contenedores: ${numerosContenedoresString}`,
          descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
        };
        await cargarConceptosAFacturar(
          servicio.fechaCarga,
          cliente._id,
          cliente.nombre,
          conceptos,

          servicioalmacenado._id
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
          numeroContenedor: numeroContenedores[0].numeroContenedor,
          fechaDevolucion: numeroContenedores[0].fechaDevolucion,
          horaDevolucion: numeroContenedores[0].horaDevolucionContenedor,
          fechaVencimientoDevolucion:
            numeroContenedores[0].fechaVencimientoDevolucionContenedor,
          lugarDevolucion: numeroContenedores[0].direccionRetorno,
          estado: estadoViaje.estado,
          horaOrigen: servicioalmacenado.horaCarga,
          fechaOrigen: servicioalmacenado.fechaCarga,
          creador: req.usuario._id,
          cliente: cliente._id,
          nombreCliente: cliente.nombre,
          domicilioOrigenCliente: origenCarga,
          fantasiaOrigen: domicilio.fantasia,
          fantasiaDestino: destino.nombre,
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
          estadoServicio: servicioalmacenado.estado,
          notificado: "Sin Notificar",
          observacionesServicio: servicioalmacenado.observaciones,
          fechaOrigenParaListados: fechaParaList,

          referenciaCliente: servicioalmacenado.numeroCliente,
        });
        const viajeAlmacenado = await nuevoViaje.save();
        await cargarDocumentacionARecibir(
          cliente.nombre,
          cliente._id,
          servicioalmacenado.numeroPedido,
          servicioalmacenado._id,
          `${servicioalmacenado.numeroPedido}/$1`,
          viajeAlmacenado._id,
          numeroContenedores[0].numeroContenedor
        );
        await cargarDocumentacionARecibir(
          cliente.nombre,
          cliente._id,
          servicioalmacenado.numeroPedido,
          servicioalmacenado._id,
          `${servicioalmacenado.numeroPedido}/1`,
          viajeAlmacenado._id,
          numeroContenedores[0].numeroContenedor,
          "Devolucion Vacio"
        );
        const conceptos = {
          descripcion0: `${servicioalmacenado.tipoCarga}`,
          descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
            servicioalmacenado.tipoCarga
          } - ${servicioalmacenado.peso} - desde ${
            domicilio.fantasia
              ? `${domicilio.fantasia} - (${domicilio.direccion})`
              : `${domicilio.direccion}- ${domicilio.localidad}`
          } hasta ${
            destino.nombre
              ? `${destino.nombre} - (${destino.direccion} - ${destino.localidad})`
              : `${destino.direccion} - ${destino.localidad}`
          }`,
          descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
          descripcion3: `${servicioalmacenado.despachoAduana}`,
          descripcion4: `Contenedor: ${viajeAlmacenado.numeroContenedor}`,
          descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
        };
        await cargarConceptosAFacturar(
          viajeAlmacenado.fechaOrigen,
          cliente._id,
          cliente.nombre,
          conceptos,

          servicioalmacenado._id
        );

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

    if (usuarios.length == 0) {
      await soloLogicsar(servicioalmacenado);
    } else {
      await notificarRecepcionViaje(usuarios, servicioalmacenado);
    }

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
  const { fechaCarga } = req.body;
  const fechaParaList = new Date(fechaCarga);

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

  const numerosContenedores = [];

  try {
    const servicioalmacenado = await servicio.save();
    actualizacion.title = `Servicio Transito Nro ${servicioalmacenado.numeroPedido} ingresado`;

    if (
      servicioalmacenado.tipoCarga === "cajas" ||
      servicioalmacenado.tipoCarga === "bultos" ||
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
        fantasiaOrigen: domicilio.nombre,
        fantasiaDestino: destino.nombre,
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
        estadoServicio: servicioalmacenado.estado,
        notificado: "Sin Notificar",
        observacionesServicio: servicioalmacenado.observaciones,
        fechaOrigenParaListados: fechaParaList,

        referenciaCliente: servicioalmacenado.numeroCliente,
      });

      const viajeAlmacenado = await nuevoViaje.save();
      servicioalmacenado.viajesSueltos = viajeAlmacenado._id;
      await cargarDocumentacionARecibir(
        cliente.nombre,
        cliente._id,
        servicioalmacenado.numeroPedido,
        servicioalmacenado._id,
        `${servicioalmacenado.numeroPedido}/1`,
        viajeAlmacenado._id,
        "Mercaderia sin Contenedor",
        "Remito"
      );

      const conceptos = {
        descripcion0: `${servicioalmacenado.tipoCarga}`,
        descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
          servicioalmacenado.tipoCarga
        } - ${servicioalmacenado.peso} - desde ${
          domicilio.nombre
            ? `${domicilio.nombre} - (${domicilio.direccion})`
            : `${domicilio.direccion}- ${domicilio.localidad}`
        } hasta ${
          destino.nombre
            ? `${destino.nombre} - (${destino.direccion} - ${destino.localidad})`
            : `${destino.direccion} - ${destino.localidad}`
        }`,
        descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
        descripcion3: `${servicioalmacenado.despachoAduana}`,
        descripcion4: `Contenedor: ${viajeAlmacenado.numeroContenedor}`,
        descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
      };
      await cargarConceptosAFacturar(
        viajeAlmacenado.fechaOrigen,
        cliente._id,
        cliente.nombre,
        conceptos,

        servicioalmacenado._id
      );
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
              fechaOrigen: servicioalmacenado.fechaCarga,
              horaOrigen: servicioalmacenado.horaCarga,
              creador: req.usuario._id,
              cliente: cliente._id,
              nombreCliente: cliente.nombre,
              domicilioOrigenTerminal: origenCarga,
              fantasiaOrigen: domicilio.nombre,
              fantasiaDestino: destino.nombre,
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
              estadoServicio: servicioalmacenado.estado,
              notificado: "Sin Notificar",
              observacionesServicio: servicioalmacenado.observaciones,
              fechaOrigenParaListados: fechaParaList,

              referenciaCliente: servicioalmacenado.numeroCliente,
            });

            const viajeAlmacenado = await nuevoViaje.save();
            await cargarDocumentacionARecibir(
              cliente.nombre,
              cliente._id,
              servicioalmacenado.numeroPedido,
              servicioalmacenado._id,
              `${servicioalmacenado.numeroPedido}/${index + 1}`,
              viajeAlmacenado._id,
              numeroContenedor.numeroContenedor,
              "Remito"
            );
            await cargarDocumentacionARecibir(
              cliente.nombre,
              cliente._id,
              servicioalmacenado.numeroPedido,
              servicioalmacenado._id,
              `${servicioalmacenado.numeroPedido}/${index + 1}`,
              viajeAlmacenado._id,
              numeroContenedor.numeroContenedor,
              "Devolucion Vacio"
            );

            return viajeAlmacenado._id;
          }
        );

        numeroContenedores.forEach((numeroContenedor) => {
          numerosContenedores.push(numeroContenedor.numeroContenedor);
        });

        const numerosContenedoresString = numerosContenedores.join("/");

        const conceptos = {
          descripcion0: `${servicioalmacenado.tipoCarga}`,
          descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
            servicioalmacenado.tipoCarga
          } - ${servicioalmacenado.peso} - desde ${
            domicilio.nombre
              ? `${domicilio.nombre} - (${domicilio.direccion})`
              : `${domicilio.direccion}- ${domicilio.localidad}`
          } hasta ${
            destino.nombre
              ? `${destino.nombre} - (${destino.direccion} - ${destino.localidad})`
              : `${destino.direccion} - ${destino.localidad}`
          }`,
          descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
          descripcion3: `${servicioalmacenado.despachoAduana}`,
          descripcion4: `Contenedores: ${numerosContenedoresString}`,
          descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
        };
        await cargarConceptosAFacturar(
          servicio.fechaCarga,
          cliente._id,
          cliente.nombre,
          conceptos,

          servicioalmacenado._id
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
          numeroContenedor: numeroContenedores[0].numeroContenedor,
          fechaDevolucion: numeroContenedores[0].fechaDevolucion,
          horaDevolucion: numeroContenedores[0].horaDevolucionContenedor,
          fechaVencimientoDevolucion:
            numeroContenedores[0].fechaVencimientoDevolucionContenedor,
          lugarDevolucion: numeroContenedores[0].direccionRetorno,
          estado: estadoViaje.estado,
          horaOrigen: servicioalmacenado.horaCarga,
          fechaOrigen: servicioalmacenado.fechaCarga,
          creador: req.usuario._id,
          cliente: cliente._id,
          nombreCliente: cliente.nombre,
          domicilioOrigenTerminal: origenCarga,
          fantasiaOrigen: domicilio.nombre,
          fantasiaDestino: destino.nombre,
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
          estadoServicio: servicioalmacenado.estado,
          observacionesServicio: servicioalmacenado.observaciones,
          fechaOrigenParaListados: fechaParaList,

          referenciaCliente: servicioalmacenado.numeroCliente,
        });
        const viajeAlmacenado = await nuevoViaje.save();
        await cargarDocumentacionARecibir(
          cliente.nombre,
          cliente._id,
          servicioalmacenado.numeroPedido,
          servicioalmacenado._id,
          `${servicioalmacenado.numeroPedido}/$1`,
          viajeAlmacenado._id,
          numeroContenedores[0].numeroContenedor,
          "Remito"
        );
        await cargarDocumentacionARecibir(
          cliente.nombre,
          cliente._id,
          servicioalmacenado.numeroPedido,
          servicioalmacenado._id,
          `${servicioalmacenado.numeroPedido}/${index + 1}`,
          viajeAlmacenado._id,
          numeroContenedores[0].numeroContenedor,
          "Devolucion Vacio"
        );
        const conceptos = {
          descripcion0: `${servicioalmacenado.tipoCarga}`,
          descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
            servicioalmacenado.tipoCarga
          } - ${servicioalmacenado.peso} - desde ${
            domicilio.nombre
              ? `${domicilio.nombre} - (${domicilio.direccion})`
              : `${domicilio.direccion}- ${domicilio.localidad}`
          } hasta ${
            destino.nombre
              ? `${destino.nombre} - (${destino.direccion} - ${destino.localidad})`
              : `${destino.direccion} - ${destino.localidad}`
          }`,
          descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
          descripcion3: `${servicioalmacenado.despachoAduana}`,
          descripcion4: `Contenedor: ${viajeAlmacenado.numeroContenedor}`,
          descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
        };
        await cargarConceptosAFacturar(
          viajeAlmacenado.fechaOrigen,
          cliente._id,
          cliente.nombre,
          conceptos,

          servicioalmacenado._id
        );

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

    if (usuarios.length == 0) {
      await soloLogicsar(servicioalmacenado);
    } else {
      await notificarRecepcionViaje(usuarios, servicioalmacenado);
    }

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
  const { fechaCarga } = req.body;
  const fechaParaList = new Date(fechaCarga);

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

  const numerosContenedores = [];

  try {
    const servicioalmacenado = await servicio.save();
    actualizacion.title = `Servicio Nacional Nro ${servicioalmacenado.numeroPedido} ingresado`;

    if (
      servicioalmacenado.tipoCarga === "cajas" ||
      servicioalmacenado.tipoCarga === "bultos" ||
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
        fantasiaOrigen: domicilio.fantasia,
        fantasiaDestino: destino.fantasia,
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
        estadoServicio: servicioalmacenado.estado,
        notificado: "Sin Notificar",
        observacionesServicio: servicioalmacenado.observaciones,
        fechaOrigenParaListados: fechaParaList,

        referenciaCliente: servicioalmacenado.numeroCliente,
      });

      const viajeAlmacenado = await nuevoViaje.save();
      servicioalmacenado.viajesSueltos = viajeAlmacenado._id;
      await cargarDocumentacionARecibir(
        cliente.nombre,
        cliente._id,
        servicioalmacenado.numeroPedido,
        servicioalmacenado._id,
        `${servicioalmacenado.numeroPedido}/1`,
        viajeAlmacenado._id,
        "Mercaderia sin Contenedor",
        "Remito"
      );
      const conceptos = {
        descripcion0: `${servicioalmacenado.tipoCarga}`,
        descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
          servicioalmacenado.tipoCarga
        } - ${servicioalmacenado.peso} - desde ${
          domicilio.fantasia
            ? `${domicilio.fantasia} - (${domicilio.direccion})`
            : `${domicilio.direccion}- ${domicilio.localidad}`
        } hasta ${
          destino.fantasia
            ? `${destino.fantasia} - (${destino.direccion} - ${destino.localidad})`
            : `${destino.direccion} - ${destino.localidad}`
        }`,
        descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
        descripcion3: `${servicioalmacenado.despachoAduana}`,
        descripcion4: `Contenedor: ${viajeAlmacenado.numeroContenedor}`,
        descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
      };
      await cargarConceptosAFacturar(
        viajeAlmacenado.fechaOrigen,
        cliente._id,
        cliente.nombre,
        conceptos,

        servicioalmacenado._id
      );
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

              fechaOrigen: servicioalmacenado.fechaCarga,
              horaOrigen: servicioalmacenado.horaCarga,
              creador: req.usuario._id,
              cliente: cliente._id,
              nombreCliente: cliente.nombre,
              domicilioOrigenCliente: origenCarga,
              nombreDomicilioOrigenCliente: domicilio.direccion,
              fantasiaOrigen: domicilio.fantasia,
              fantasiaDestino: destino.fantasia,
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
              estadoServicio: servicioalmacenado.estado,
              notificado: "Sin Notificar",
              observacionesServicio: servicioalmacenado.observaciones,
              fechaOrigenParaListados: fechaParaList,

              referenciaCliente: servicioalmacenado.numeroCliente,
            });

            const viajeAlmacenado = await nuevoViaje.save();
            await cargarDocumentacionARecibir(
              cliente.nombre,
              cliente._id,
              servicioalmacenado.numeroPedido,
              servicioalmacenado._id,
              `${servicioalmacenado.numeroPedido}/${index + 1}`,
              viajeAlmacenado._id,
              numeroContenedor.numeroContenedor,
              "Remito"
            );
            await cargarDocumentacionARecibir(
              cliente.nombre,
              cliente._id,
              servicioalmacenado.numeroPedido,
              servicioalmacenado._id,
              `${servicioalmacenado.numeroPedido}/${index + 1}`,
              viajeAlmacenado._id,
              numeroContenedor.numeroContenedor,
              "Devolucion Vacio"
            );

            return viajeAlmacenado._id;
          }
        );

        numeroContenedores.forEach((numeroContenedor) => {
          numerosContenedores.push(numeroContenedor.numeroContenedor);
        });

        const numerosContenedoresString = numerosContenedores.join("/");

        const conceptos = {
          descripcion0: `${servicioalmacenado.tipoCarga}`,
          descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
            servicioalmacenado.tipoCarga
          } - ${servicioalmacenado.peso} - desde ${
            domicilio.fantasia
              ? `${domicilio.fantasia} - (${domicilio.direccion})`
              : `${domicilio.direccion}- ${domicilio.localidad}`
          } hasta ${
            destino.fantasia
              ? `${destino.fantasia} - (${destino.direccion} - ${destino.localidad})`
              : `${destino.direccion} - ${destino.localidad}`
          }`,
          descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
          descripcion3: `${servicioalmacenado.despachoAduana}`,
          descripcion4: `Contenedor: ${viajeAlmacenado.numeroContenedor}`,
          descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
        };
        await cargarConceptosAFacturar(
          viajeAlmacenado.fechaOrigen,
          cliente._id,
          cliente.nombre,
          conceptos,

          servicioalmacenado._id
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
          numeroContenedor: numeroContenedores[0].numeroContenedor,
          fechaDevolucion: numeroContenedores[0].fechaDevolucion,
          horaDevolucion: numeroContenedores[0].horaDevolucionContenedor,
          fechaVencimientoDevolucion:
            numeroContenedores[0].fechaVencimientoDevolucionContenedor,
          lugarDevolucion: numeroContenedores[0].direccionRetorno,
          estado: estadoViaje.estado,
          horaOrigen: servicioalmacenado.horaCarga,
          fechaOrigen: servicioalmacenado.fechaCarga,
          creador: req.usuario._id,
          cliente: cliente._id,
          nombreCliente: cliente.nombre,
          domicilioOrigenCliente: origenCarga,
          nombreDomicilioOrigenCliente: domicilio.direccion,
          fantasiaOrigen: domicilio.fantasia,
          fantasiaDestino: destino.fantasia,
          domicilioDestinoCliente: destinoCarga,
          nombreDomicilioDestinoCliente: destino.direccion,
          servicio: servicioalmacenado._id,
          tipoServicio: servicioalmacenado.tipoOperacion,
          tipoCarga: servicioalmacenado.tipoCarga,
          numeroDeViaje: `${servicioalmacenado.numeroPedido}/1`,
          cantidadCarga: servicioalmacenado.cantidad,
          volumenCarga: servicioalmacenado.volumen,
          pesoCarga: servicioalmacenado.peso,
          estadoServicio: servicioalmacenado.estado,
          notificado: "Sin Notificar",
          observacionesServicio: servicioalmacenado.observaciones,
          fechaOrigenParaListados: fechaParaList,

          referenciaCliente: servicioalmacenado.numeroCliente,
        });
        const viajeAlmacenado = await nuevoViaje.save();
        await cargarDocumentacionARecibir(
          cliente.nombre,
          cliente._id,
          servicioalmacenado.numeroPedido,
          servicioalmacenado._id,
          `${servicioalmacenado.numeroPedido}/1`,
          viajeAlmacenado._id,
          numeroContenedores[0].numeroContenedor,
          "Remito"
        );
        await cargarDocumentacionARecibir(
          cliente.nombre,
          cliente._id,
          servicioalmacenado.numeroPedido,
          servicioalmacenado._id,
          `${servicioalmacenado.numeroPedido}/1`,
          viajeAlmacenado._id,
          numeroContenedores[0].numeroContenedor,
          "Devolucion Vacio"
        );
        const conceptos = {
          descripcion0: `${servicioalmacenado.tipoCarga}`,
          descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
            servicioalmacenado.tipoCarga
          } - ${servicioalmacenado.peso} - desde ${
            domicilio.fantasia
              ? `${domicilio.fantasia} - (${domicilio.direccion})`
              : `${domicilio.direccion}- ${domicilio.localidad}`
          } hasta ${
            destino.fantasia
              ? `${destino.fantasia} - (${destino.direccion} - ${destino.localidad})`
              : `${destino.direccion} - ${destino.localidad}`
          }`,
          descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
          descripcion3: `${servicioalmacenado.despachoAduana}`,
          descripcion4: `Contenedor: ${viajeAlmacenado.numeroContenedor}`,
          descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
        };
        await cargarConceptosAFacturar(
          viajeAlmacenado.fechaOrigen,
          cliente._id,
          cliente.nombre,
          conceptos,

          servicioalmacenado._id
        );
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

    if (usuarios.length == 0) {
      await soloLogicsar(servicioalmacenado);
    } else {
      await notificarRecepcionViaje(usuarios, servicioalmacenado);
    }

    res.json(servicioalmacenado);
  } catch (error) {
    console.log(error);
  }
};

const nuevoEmptyPickUp = async (req, res) => {
  const { idCliente } = req.body;
  const { numeroContenedores } = req.body;
  const { origenCarga } = req.body;
  const { destinoCarga } = req.body;
  const cliente = await Cliente.findById(idCliente);
  const servicio = new Servicio(req.body);
  const { fechaCarga } = req.body;
  const fechaParaList = new Date(fechaCarga);

  const actualizacion = new Actualizaciones();

  const domicilio = await Devoluciones.findById(origenCarga);
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

  const numerosContenedores = [];

  try {
    const servicioalmacenado = await servicio.save();

    actualizacion.icon = "PlusCircleIcon";
    actualizacion.description = Date.now();
    actualizacion.color = "text-green-500";
    actualizacion.title = `Servicio Devolucion Vacios Nro ${servicioalmacenado.numeroPedido} ingresado`;

    if (
      servicioalmacenado.tipoCarga === "cajas" ||
      servicioalmacenado.tipoCarga === "bultos" ||
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
        fantasiaOrigen: domicilio.nombre,
        fantasiaDestino: destino.nombre,
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
        estadoServicio: servicioalmacenado.estado,
        notificado: "Sin Notificar",
        observacionesServicio: servicioalmacenado.observaciones,
        fechaOrigenParaListados: fechaParaList,

        referenciaCliente: servicioalmacenado.numeroCliente,
      });

      const viajeAlmacenado = await nuevoViaje.save();
      servicioalmacenado.viajesSueltos = viajeAlmacenado._id;
      await cargarDocumentacionARecibir(
        cliente.nombre,
        cliente._id,
        servicioalmacenado.numeroPedido,
        servicioalmacenado._id,
        `${servicioalmacenado.numeroPedido}/1`,
        viajeAlmacenado._id,
        "Mercaderia sin Contenedor",
        "Remito"
      );

      const conceptos = {
        descripcion0: `${servicioalmacenado.tipoCarga}`,
        descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
          servicioalmacenado.tipoCarga
        } - ${servicioalmacenado.peso} - desde ${
          domicilio.fantasia
            ? `${domicilio.fantasia} - (${domicilio.direccion})`
            : `${domicilio.direccion}- ${domicilio.localidad}`
        } hasta ${
          destino.nombre
            ? `${destino.nombre} - (${destino.direccion} - ${destino.localidad})`
            : `${destino.direccion} - ${destino.localidad}`
        }`,
        descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
        descripcion3: `${servicioalmacenado.despachoAduana}`,
        descripcion4: `Contenedor: ${viajeAlmacenado.numeroContenedor}`,
        descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
      };
      await cargarConceptosAFacturar(
        viajeAlmacenado.fechaOrigen,
        cliente._id,
        cliente.nombre,
        conceptos,

        servicioalmacenado._id
      );
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

              fechaOrigen: servicioalmacenado.fechaCarga,
              horaOrigen: servicioalmacenado.horaCarga,
              creador: req.usuario._id,
              cliente: cliente._id,
              nombreCliente: cliente.nombre,
              domicilioOrigenCliente: origenCarga,
              fantasiaOrigen: domicilio.nombre,
              fantasiaDestino: destino.nombre,
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
              estadoServicio: servicioalmacenado.estado,
              notificado: "Sin Notificar",
              observacionesServicio: servicioalmacenado.observaciones,
              referenciaCliente: servicioalmacenado.numeroCliente,
              fechaOrigenParaListados: fechaParaList,
            });

            const viajeAlmacenado = await nuevoViaje.save();
            await cargarDocumentacionARecibir(
              cliente.nombre,
              cliente._id,
              servicioalmacenado.numeroPedido,
              servicioalmacenado._id,
              `${servicioalmacenado.numeroPedido}/${index + 1}`,
              viajeAlmacenado._id,
              numeroContenedor.numeroContenedor,
              "Remito"
            );
            await cargarDocumentacionARecibir(
              cliente.nombre,
              cliente._id,
              servicioalmacenado.numeroPedido,
              servicioalmacenado._id,
              `${servicioalmacenado.numeroPedido}/${index + 1}`,
              viajeAlmacenado._id,
              numeroContenedor.numeroContenedor,
              "Devolucion Vacio"
            );

            return viajeAlmacenado._id;
          }
        );

        numeroContenedores.forEach((numeroContenedor) => {
          numerosContenedores.push(numeroContenedor.numeroContenedor);
        });

        const numerosContenedoresString = numerosContenedores.join("/");

        const conceptos = {
          descripcion0: `${servicioalmacenado.tipoCarga}`,
          descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
            servicioalmacenado.tipoCarga
          } - ${servicioalmacenado.peso} - desde ${
            domicilio.fantasia
              ? `${domicilio.fantasia} - (${domicilio.direccion})`
              : `${domicilio.direccion}- ${domicilio.localidad}`
          } hasta ${
            destino.nombre
              ? `${destino.nombre} - (${destino.direccion} - ${destino.localidad})`
              : `${destino.direccion} - ${destino.localidad}`
          }`,
          descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
          descripcion3: `${servicioalmacenado.despachoAduana}`,
          descripcion4: `Contenedores: ${numerosContenedoresString}`,
          descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
        };
        await cargarConceptosAFacturar(
          servicio.fechaCarga,
          cliente._id,
          cliente.nombre,
          conceptos,

          servicioalmacenado._id
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
          numeroContenedor: numeroContenedores[0].numeroContenedor,
          fechaDevolucion: numeroContenedores[0].fechaDevolucion,
          horaDevolucion: numeroContenedores[0].horaDevolucionContenedor,
          fechaVencimientoDevolucion:
            numeroContenedores[0].fechaVencimientoDevolucionContenedor,
          lugarDevolucion: numeroContenedores[0].direccionRetorno,
          estado: estadoViaje.estado,
          horaOrigen: servicioalmacenado.horaCarga,
          fechaOrigen: servicioalmacenado.fechaCarga,
          creador: req.usuario._id,
          cliente: cliente._id,
          nombreCliente: cliente.nombre,
          domicilioOrigenCliente: origenCarga,
          fantasiaOrigen: domicilio.nombre,
          fantasiaDestino: destino.nombre,
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
          estadoServicio: servicioalmacenado.estado,
          notificado: "Sin Notificar",
          observacionesServicio: servicioalmacenado.observaciones,
          fechaOrigenParaListados: fechaParaList,

          referenciaCliente: servicioalmacenado.numeroCliente,
        });
        const viajeAlmacenado = await nuevoViaje.save();
        await cargarDocumentacionARecibir(
          cliente.nombre,
          cliente._id,
          servicioalmacenado.numeroPedido,
          servicioalmacenado._id,
          `${servicioalmacenado.numeroPedido}/$1`,
          viajeAlmacenado._id,
          numeroContenedores[0].numeroContenedor
        );
        await cargarDocumentacionARecibir(
          cliente.nombre,
          cliente._id,
          servicioalmacenado.numeroPedido,
          servicioalmacenado._id,
          `${servicioalmacenado.numeroPedido}/1`,
          viajeAlmacenado._id,
          numeroContenedores[0].numeroContenedor,
          "Devolucion Vacio"
        );
        const conceptos = {
          descripcion0: `${servicioalmacenado.tipoCarga}`,
          descripcion1: `Por transporte de ${servicioalmacenado.cantidad} ${
            servicioalmacenado.tipoCarga
          } - ${servicioalmacenado.peso} - desde ${
            domicilio.fantasia
              ? `${domicilio.fantasia} - (${domicilio.direccion})`
              : `${domicilio.direccion}- ${domicilio.localidad}`
          } hasta ${
            destino.nombre
              ? `${destino.nombre} - (${destino.direccion} - ${destino.localidad})`
              : `${destino.direccion} - ${destino.localidad}`
          }`,
          descripcion2: `Ref: ${servicioalmacenado.numeroCliente}`,
          descripcion3: `${servicioalmacenado.despachoAduana}`,
          descripcion4: `Contenedor: ${viajeAlmacenado.numeroContenedor}`,
          descripcion5: `Pedido Logicsar ${servicioalmacenado.numeroPedido}`,
        };
        await cargarConceptosAFacturar(
          viajeAlmacenado.fechaOrigen,
          cliente._id,
          cliente.nombre,
          conceptos,

          servicioalmacenado._id
        );

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

    if (usuarios.length == 0) {
      await soloLogicsar(servicioalmacenado);
    } else {
      await notificarRecepcionViaje(usuarios, servicioalmacenado);
    }

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
  if (usuarios.length == 0) {
    await notificarViajeSoloLogicsar(servicio, informacionEnviar);
  } else {
    await notificarViajes(usuarios, servicio, informacionEnviar);
  }
  servicio.notificar = "Notificado";
  await servicio.save();
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

  await notificarRecepcionViaje(usuarios, servicio);

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

const obtenerTodosLosServiciosAFacturar = async (req, res) => {
  try {
    const servicios = await Servicio.find({
      estado: "Por Facturar",
      estado2: { $ne: "eliminado" },
    });
    console.log(servicios);
    res.json(servicios);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Ocurrió un error al obtener los servicios" });
  }
};

const obtenerTodosLosServicios = async (req, res) => {
  try {
    const servicios = await Servicio.find({
      estado: { $ne: "Terminado" },
      estado2: { $ne: "eliminado" },
    });

    res.json(servicios);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Ocurrió un error al obtener los servicios" });
  }
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

    // Realizar la búsqueda en la base de datos filtrando por la fecha de hoy y estado no cerrado
    const viajes = await Viajes.find({
      estado2: { $ne: "eliminado" },
      fechaOrigen: fechaHoyString,
    })
      .sort({ horaOrigen: 1, numeroDeViaje: 1 })
      .lean(); // Utilizamos lean() para obtener objetos planos en lugar de documentos de Mongoose

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
    // y luego ordenar los resultados por fecha de la más próxima a la más lejana, y horaOrigen y numeroDeViaje
    const viajes = await Viajes.find({
      estado2: { $ne: "eliminado" },
      fechaOrigen: { $lt: fechaHoyString },
    })
      .sort({ fechaOrigen: -1, horaOrigen: -1, numeroDeViaje: 1 })
      .lean(); // Utilizamos lean() para obtener objetos planos en lugar de documentos de Mongoose

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
    // y luego ordenar los resultados por fecha de la más próxima a la más lejana, y horaOrigen y numeroDeViaje
    const viajes = await Viajes.find({
      estado: { $ne: "Terminado" },
      estado2: { $ne: "eliminado" },
      fechaOrigen: { $gt: fechaHoyString },
    })
      .sort({ fechaOrigen: -1, horaOrigen: -1, numeroDeViaje: 1 })
      .lean(); // Utilizamos lean() para obtener objetos planos en lugar de documentos de Mongoose

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
  const servicio = await Servicio.findById(viaje.servicio);

  const viajesServicio = await Viajes.find({ servicio: servicio._id });

  const documentacion = await Documentacion.find({ viaje: id });

  const chofer = await Choferes.findById(idChofer);
  const camion = await Camiones.findById(idCamion);

  if (idSemi !== "") {
    const semi = await Semis.findById(idSemi);
    viaje.semi = idSemi;
    viaje.patenteSemi = semi.patente;
  }

  const estadoViaje = await EstadosViajes.findOne({ numeroEstado: 4 });

  viaje.chofer = idChofer;
  viaje.nombreChofer = chofer.nombre + " " + chofer.apellido;
  viaje.camion = idCamion;
  viaje.patenteCamion = camion.patente;

  viaje.estado = estadoViaje.estado;

  if (viaje.estado === "Por Asignar") {
    viaje.estado = "Asignado";
  }

  if (viajesServicio.length == 1) {
    servicio.estado = "Coordinado";
  } else if (
    viajesServicio.every(
      (viaje) => viaje.nombreChofer && viaje.nombreChofer.trim() !== ""
    )
  ) {
    servicio.estado = "Coordinado";
  }

  actualizacion.icon = "TruckIcon";
  actualizacion.description = Date.now();
  actualizacion.color = "text-gray-300";
  actualizacion.title = `Se asigno equipo al viaje Nro ${viaje.numeroDeViaje}`;

  try {
    const viajeAlmacenado = await viaje.save();
    documentacion[0].nombreChofer = viajeAlmacenado.nombreChofer;

    if (documentacion.length > 1) {
      documentacion[1].nombreChofer = viajeAlmacenado.nombreChofer;
      await documentacion[1].save();
    }

    await documentacion[0].save();
    await servicio.save();
    await actualizacion.save();
    res.json(viajeAlmacenado);
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
    const servicios = await Servicio.find({
      cliente: id,
      estado2: { $ne: "eliminado" },
    });
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
    // Realizar la búsqueda en la base de datos filtrando por el servicio específico y estado no eliminado,
    // y luego ordenar los resultados por fecha de la más próxima a la más lejana, y horaOrigen y numeroDeViaje
    const viajes = await Viajes.find({
      servicio: id,
      estado2: { $ne: "eliminado" },
    })
      .sort({ fechaOrigen: 1, horaOrigen: 1, numeroDeViaje: 1 })
      .lean(); // Utilizamos lean() para obtener objetos planos en lugar de documentos de Mongoose

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

//pepito

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

const actualizarEstadoServicio = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const actualizacion = new Actualizaciones();
  const servicio = await Servicio.findById(id);

  const viajesAsociados = await Viajes.find({ servicio: id });

  if (servicio.estado === estado) {
    const error = new Error("Selecciona un estado distinto al ya guardado");
    return res.status(400).json({ msg: error.message });
  } else {
    servicio.estado = estado;
    try {
      // Actualizar estadoServicio para cada viaje asociado
      for (let viaje of viajesAsociados) {
        viaje.estadoServicio = estado;
        await viaje.save(); // Guardar los cambios en cada viaje
      }

      actualizacion.icon = "ArrowPathIcon";
      actualizacion.description = Date.now();
      actualizacion.color = "text-red-300";
      actualizacion.title = `Servicio Nro ${servicio.numeroPedido} actualizado a estado ${servicio.estado}`;

      const estadoAlmacenado = await servicio.save();

      await actualizacion.save();
      res.json(estadoAlmacenado);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: "Error interno del servidor" });
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

const filtrarViajes = async (req, res) => {
  const { cliente, fecha, estado } = req.body;
  console.log(req.body);
  let filtro = {};

  //Busca primero si solo le pasaste por cliente
  if (cliente) {
    if (fecha) {
      if (estado) {
        filtro = {
          cliente: { $eq: cliente },
          fechaOrigen: { $eq: fecha },
          estado: { $eq: estado },
        };
      } else {
        filtro = {
          cliente: { $eq: cliente },
          fechaOrigen: { $eq: fecha },
        };
      }
    } else if (estado) {
      filtro = {
        cliente: { $eq: cliente },
        estado: { $eq: estado },
      };
    } else {
      filtro = {
        cliente: { $eq: cliente },
      };
    }
  } else if (fecha) {
    if (estado) {
      filtro = {
        fechaOrigen: { $eq: fecha },
        estado: { $eq: estado },
      };
    } else {
      filtro = {
        fechaOrigen: { $eq: fecha },
      };
    }
  } else if (estado) {
    filtro = {
      estado: { $eq: estado },
    };
  }

  //Busca si solo le pasaste por estado
  if (estado) {
    if (cliente) {
      if (fecha) {
        filtro = {
          estado: { $eq: estado },
          cliente: { $eq: cliente },
          fechaOrigen: { $eq: fecha },
        };
      } else {
        filtro = {
          estado: { $eq: estado },
          cliente: { $eq: cliente },
        };
      }
    } else if (fecha) {
      filtro = {
        estado: { $eq: estado },
        fechaOrigen: { $eq: fecha },
      };
    } else {
      filtro = {
        estado: { $eq: estado },
      };
    }
  } else if (cliente) {
    if (fecha) {
      filtro = {
        cliente: { $eq: cliente },
        fechaOrigen: { $eq: fecha },
      };
    } else {
      filtro = {
        cliente: { $eq: cliente },
      };
    }
  } else if (fecha) {
    filtro = {
      fechaOrigen: { $eq: fecha },
    };
  }

  //Busca si solo le pasaste por fecha
  if (fecha) {
    if (cliente) {
      if (estado) {
        filtro = {
          fechaOrigen: { $eq: fecha },
          cliente: { $eq: cliente },
          estado: { $eq: estado },
        };
      } else {
        filtro = {
          fechaOrigen: { $eq: fecha },
          cliente: { $eq: cliente },
        };
      }
    } else if (estado) {
      filtro = {
        fechaOrigen: { $eq: fecha },
        estado: { $eq: estado },
      };
    } else {
      filtro = {
        fechaOrigen: { $eq: fecha },
      };
    }
  } else if (cliente) {
    if (estado) {
      filtro = {
        cliente: { $eq: cliente },
        estado: { $eq: estado },
      };
    } else {
      filtro = {
        cliente: { $eq: cliente },
      };
    }
  } else if (estado) {
    filtro = {
      estado: { $eq: estado },
    };
  }

  try {
    const viajesFiltrados = await Viajes.find(filtro);

    console.log(viajesFiltrados);
    res.json(viajesFiltrados);
  } catch (error) {
    res.status(500).json({ error: "Error al filtrar los viajes" });
  }
};

const editarViaje = async (req, res) => {
  const { id } = req.params;
  const { tipoServicio } = req.body;

  const viaje = await Viajes.findById(id);
  const documentacion = await Documentacion.find({ viaje: id });

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
  viaje.observacionesViaje = req.body.observaciones || viaje.observacionesViaje;
  viaje.pesoCarga = req.body.pesoCarga || viaje.pesoCarga;
  viaje.volumenCarga = req.body.volumenCarga || viaje.volumenCarga;
  viaje.cantidadCarga = req.body.cantidadCarga || viaje.cantidadCarga;
  viaje.tipoCarga = req.body.tipoCarga || viaje.tipoCarga;

  if (tipoServicio === "importacion") {
    const origen = await Terminales.findById(req.body.domicilioOrigen);
    const destino = await Domicilios.findById(req.body.domicilioDestino);

    viaje.domicilioOrigenTerminal =
      req.body.domicilioOrigen || viaje.domicilioOrigenTerminal;

    viaje.nombreDomicilioDestinoCliente =
      req.body.domicilioDestino || viaje.nombreDomicilioDestinoCliente;

    viaje.nombreDomicilioOrigenTerminal = origen.direccion;
    viaje.nombreDomicilioDestinoCliente = destino.direccion;

    viaje.fantasiaOrigen = origen.nombre;
    viaje.fantasiaDestino = destino.fantasia;
  }

  if (tipoServicio === "one-way") {
    const origen = await Domicilios.findById(req.body.domicilioOrigen);
    const destino = await Terminales.findById(req.body.domicilioDestino);

    viaje.domicilioOrigenCliente =
      req.body.domicilioOrigen || viaje.domicilioOrigenCliente;

    viaje.domicilioDestinoTerminal =
      req.body.domicilioDestino || viaje.domicilioDestinoTerminal;

    viaje.nombreDomicilioOrigenCliente = origen.direccion;
    viaje.nombreDomicilioDestinoTerminal = destino.direccion;

    viaje.fantasiaOrigen = origen.fantasia;
    viaje.fantasiaDestino = destino.nombre;
  }

  if (tipoServicio === "transito-aduanero") {
    const origen = await Terminales.findById(req.body.domicilioOrigen);
    const destino = await Terminales.findById(req.body.domicilioDestino);

    viaje.domicilioOrigenTerminal =
      req.body.domicilioOrigen || viaje.domicilioOrigenTerminal;
    viaje.domicilioDestinoTerminal =
      req.body.domicilioDestino || viaje.domicilioDestinoTerminal;

    viaje.nombreDomicilioOrigenTerminal = origen.direccion;
    viaje.nombreDomicilioDestinoTerminal = destino.direccion;

    viaje.fantasiaOrigen = origen.nombre;
    viaje.fantasiaDestino = destino.nombre;
  }

  if (tipoServicio === "nacional") {
    const origen = await Domicilios.findById(req.body.domicilioOrigen);
    const destino = await Domicilios.findById(req.body.domicilioDestino);

    viaje.domicilioOrigenCliente =
      req.body.domicilioOrigen || viaje.domicilioOrigenCliente;
    viaje.nombreDomicilioDestinoCliente =
      req.body.domicilioDestino || viaje.nombreDomicilioDestinoCliente;

    viaje.nombreDomicilioOrigenCliente = origen.direccion;
    viaje.nombreDomicilioDestinoCliente = destino.direccion;

    viaje.fantasiaOrigen = origen.nombre;
    viaje.fantasiaDestino = destino.nombre;
  }
  if (tipoServicio === "round-trip") {
    const origen = await Domicilios.findById(req.body.domicilioOrigen);
    const destino = await Terminales.findById(req.body.domicilioDestino);

    viaje.domicilioOrigenCliente =
      req.body.domicilioOrigen || viaje.domicilioOrigenCliente;
    viaje.nombreDomicilioDestinoCliente =
      req.body.domicilioDestino || viaje.nombreDomicilioDestinoCliente;

    viaje.nombreDomicilioOrigenCliente = origen.direccion;
    viaje.nombreDomicilioDestinoCliente = destino.direccion;

    viaje.fantasiaOrigen = origen.fantasia;
    viaje.fantasiaDestino = destino.nombre;
  }
  if (tipoServicio === "vacios") {
    const origen = await Domicilios.findById(req.body.domicilioOrigen);
    const destino = await Devoluciones.findById(req.body.domicilioDestino);

    viaje.domicilioOrigenCliente =
      req.body.domicilioOrigen || viaje.domicilioOrigenCliente;
    viaje.nombreDomicilioDestinoCliente =
      req.body.domicilioDestino || viaje.nombreDomicilioDestinoCliente;

    viaje.nombreDomicilioOrigenCliente = origen.direccion;
    viaje.nombreDomicilioDestinoCliente = destino.direccion;

    viaje.fantasiaOrigen = origen.nombre;
    viaje.fantasiaDestino = destino.nombre;
  }
  if (tipoServicio === "empty-pick") {
    const origen = await Devoluciones.findById(req.body.domicilioOrigen);
    const destino = await Domicilios.findById(req.body.domicilioDestino);

    viaje.domicilioOrigenCliente =
      req.body.domicilioOrigen || viaje.domicilioOrigenCliente;
    viaje.nombreDomicilioDestinoCliente =
      req.body.domicilioDestino || viaje.nombreDomicilioDestinoCliente;

    viaje.nombreDomicilioOrigenCliente = origen.direccion;
    viaje.nombreDomicilioDestinoCliente = destino.direccion;

    viaje.fantasiaOrigen = origen.nombre;
    viaje.fantasiaDestino = destino.fantasia;
  }

  try {
    actualizacion.icon = "PencilSquareIcon";
    actualizacion.description = Date.now();
    actualizacion.color = "text-green-300";
    actualizacion.title = `Se edito el viaje Nro ${viaje.numeroDeViaje}`;
    await actualizacion.save();
    const viajeAlmacenado = await viaje.save();
    documentacion[0].numeroContenedor = viajeAlmacenado.numeroContenedor;

    if (documentacion.length > 1) {
      documentacion[1].numeroContenedor = viajeAlmacenado.numeroContenedor;
      await documentacion[1].save();
    }

    await documentacion[0].save();

    console.log(viajeAlmacenado);
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

const busqueda = async (req, res) => {
  try {
    // Obtén el término de búsqueda del cuerpo de la solicitud (puedes ajustar esto según tu implementación)
    const { terminoBusqueda } = req.body;
    let query = {
      $or: [
        { nombreCliente: { $regex: terminoBusqueda, $options: "i" } },
        { destinoCarga: { $regex: terminoBusqueda, $options: "i" } },
        { observaciones: { $regex: terminoBusqueda, $options: "i" } },
        { nombreTerminal: { $regex: terminoBusqueda, $options: "i" } },
        { nombreProveedor: { $regex: terminoBusqueda, $options: "i" } },
        { nombreChofer: { $regex: terminoBusqueda, $options: "i" } },
        { numeroCliente: { $regex: terminoBusqueda, $options: "i" } },
      ],
    };

    let queryClientes = {
      $or: [
        { nombre: { $regex: terminoBusqueda, $options: "i" } },
        { cuit: { $regex: terminoBusqueda, $options: "i" } },
        { mailFactura: { $regex: terminoBusqueda, $options: "i" } },
      ],
    };

    let queryProveedores = {
      $or: [
        { nombre: { $regex: terminoBusqueda, $options: "i" } },
        { cuit: { $regex: terminoBusqueda, $options: "i" } },
        { email: { $regex: terminoBusqueda, $options: "i" } },
      ],
    };

    let queryviajes = {
      $or: [
        { numeroDeViaje: { $regex: terminoBusqueda, $options: "i" } },
        { numeroContenedor: { $regex: terminoBusqueda, $options: "i" } },
      ],
    };

    // Verifica si el término de búsqueda es un número válido utilizando una expresión regular
    if (/^\d+$/.test(terminoBusqueda)) {
      const numeroPedido = parseInt(terminoBusqueda);
      query.$or.push({ numeroPedido: numeroPedido });
    }

    // Construye la consulta de búsqueda utilizando el término proporcionado
    const servicios = await Servicio.find(query);
    const clientes = await Cliente.find(queryClientes);
    const proveedores = await Proveedor.find(queryProveedores);
    const viajes = await Viajes.find(queryviajes);

    res.json({
      servicios: servicios,
      clientes: clientes,
      proveedores: proveedores,
      viajes: viajes,
    });
  } catch (error) {
    // Manejo de errores
    console.error(error);
    res.status(500).json({ message: "Error al buscar los servicios" });
  }
};

const actualizarObservacionesServicio = async (req, res) => {
  const { id } = req.params;
  const { observaciones } = req.body;

  const servicio = await Servicio.findById(id);

  servicio.observaciones = observaciones;

  await servicio.save();

  res.json({ msg: "ok" });
};

const eliminarViaje = async (req, res) => {
  const { id } = req.params;

  const viaje = await Viajes.findById(id);

  viaje.estado2 = "eliminado";

  await viaje.save();

  res.json({ msg: "Viaje Eliminado " });
};

const eliminarServicio = async (req, res) => {
  const { id } = req.params;

  try {
    const servicio = await Servicio.findById(id);

    // Buscar en Viaje todos los documentos con el campo "servicio" igual a "id"
    const viajes = await Viajes.find({ servicio: id });

    servicio.estado2 = "eliminado";

    await servicio.save();

    if (viajes.length > 1) {
      for (const viaje of viajes) {
        viaje.estado2 = "eliminado";
        await viaje.save();
      }
    } else if (viajes.length === 1) {
      await Viajes.updateMany({ _id: viajes[0]._id }, { estado2: "eliminado" });
    }

    res.json({ msg: "Servicio eliminado", viajes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ocurrió un error al eliminar el servicio" });
  }
};

const terminarViaje = async (req, res) => {
  const { id } = req.params;

  const { adicionales } = req.body;
  const { fechaTerminacion } = req.body;
  const { horaTerminacion } = req.body;
  const { diasDemora } = req.body;
  const { observaciones } = req.body;

  // const estadoServicios = await EstadosServicio.findOne({ numeroEstado: "7" });
  const viaje = await Viajes.findById(id);
  // const servicio = await Servicio.findById(viaje.servicio);

  // const viajesDelServicio = await Viajes.find({ servicio: viaje.servicio });

  // console.log(viajesDelServicio);

  viaje.adicionales = adicionales;
  viaje.fechaTerminacion = fechaTerminacion;
  viaje.horaTerminacion = horaTerminacion;
  viaje.diasDemora = diasDemora;
  viaje.observacionesViaje = observaciones;

  // if (viajesDelServicio.length == 1) {
  //   servicio.estado = estadoServicios.estado;
  //   const servicioAlmacenado = await servicio.save();
  //   viaje.estadoServicio = servicioAlmacenado.estado;
  //   await viaje.save();
  // }

  // if (viajesDelServicio.length > 1) {
  //   const todosTerminados = viajesDelServicio.every(
  //     (viaje) =>
  //       viaje.estado === "terminado" &&
  //       (!viaje.estado2 || viaje.estado2 !== "eliminado")
  //   );

  //   if (todosTerminados) {
  //     servicio.estado = estadoServicios.estado;
  //     const servicioAlmacenado = await servicio.save();
  //     viaje.estadoServicio = servicioAlmacenado.estado;
  //     await viaje.save();
  //   }
  // }

  await viaje.save();
  await adicionalFacturar(
    fechaTerminacion,
    horaTerminacion,
    viaje.cliente,
    viaje.nombreCliente,
    diasDemora,
    viaje.servicio
  );

  res.json({ msg: "Ok" });
};

const adicionalFacturar = async (
  fechaTerminacion,
  horaTerminacion,
  cliente,
  nombreCliente,
  diasDemora,
  servicio
) => {
  const aFacturar = new ConceptosAFActurar();

  if (diasDemora >= 1) {
    aFacturar.fecha = fechaTerminacion;
    aFacturar.horaTerminacion = horaTerminacion;
    aFacturar.cliente = cliente;
    aFacturar.nombreCliente = nombreCliente;
    aFacturar.descripcion0 = `Demora Contenedores`;
    aFacturar.servicio = servicio;
    aFacturar.descripcion1 = `Recargo por ${diasDemora} ${
      diasDemora > 1 ? "dias" : "dia"
    } de demora en la descarga ${
      diasDemora > 1 ? "de los contenedores" : "del contenedor"
    }`;
    aFacturar.servicio = servicio;
  }

  await aFacturar.save();
};

const buscarTodosLosViajes = async (req, res) => {
  try {
    const viajes = await Viajes.find({ estado2: { $ne: "eliminado" } }).sort({
      fechaOrigen: -1,
      horaOrigen: 1,
    });

    res.json(viajes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ocurrió un error al obtener los viajes" });
  }
};

const notificarAlChofer = async (req, res) => {
  const { id } = req.params;

  const viaje = await Viajes.findById(id);
  const actualizacion = new Actualizaciones();
  let origenFantasia = "";
  let destinoFantasia = "";
  let origen = [];
  let destino = [];

  const chofer = await Choferes.findById(viaje.chofer);

  if (viaje.domicilioOrigenCliente.length !== 0) {
    origen = await Domicilios.findById(viaje.domicilioOrigenCliente);
    origenFantasia = origen.fantasia;
  }
  if (viaje.domicilioOrigenTerminal.length !== 0) {
    origen = await Terminales.findById(viaje.domicilioOrigenTerminal);
    origenFantasia = origen.nombre;
  }
  if (viaje.domicilioDestinoCliente.length !== 0) {
    destino = await Domicilios.findById(viaje.domicilioOrigenCliente);
    destinoFantasia = destino.fantasia;
  }
  if (viaje.domicilioDestinoTerminal.length !== 0) {
    destino = await Terminales.findById(viaje.domicilioOrigenTerminal);
    destinoFantasia = destino.nombre;
  }

  actualizacion.icon = "EnvelopeIcon";
  actualizacion.description = Date.now();
  actualizacion.color = "text-blue-500";
  actualizacion.title = `Viajes Servicio ${viaje.numeroDeViaje} notificado al chofer`;

  const informacionEnviar = {
    nombre: chofer.nombre + chofer.apellido,
    dni: chofer.dni,
    patenteCamion: viaje.patenteCamion,
    patenteSemi: viaje.patenteSemi,
    fechaCarga: viaje.fechaOrigen,
    horaCarga: viaje.horaOrigen,
    tipoCarga: viaje.tipoCarga,
    cantidad: viaje.cantidad,
    peso: viaje.peso,
    contenedor: viaje.numeroContenedor,
    origenFantasia: origenFantasia,
    origen: origen.direccion,
    destinoFantasia: destinoFantasia,
    destino: destino.direccion,
    observaciones: viaje.observacionesViaje,
  };

  await notificarViajeSoloLogicsar(informacionEnviar);

  await actualizacion.save();
  res.json({ msg: "Viaje Notificado al chofer Con Exito" });
};

const cargarDocumentacionARecibir = async (
  nombreCliente,
  idCliente,
  nroServicio,
  idServicio,
  nroViaje,
  idviaje,
  nroContenedor,
  tipo
) => {
  const documentacion = new Documentacion();

  documentacion.numeroViaje = nroViaje;
  documentacion.numeroServicio = nroServicio;
  documentacion.tipoDocumentacion = tipo;
  if (tipo === "Remito") {
    documentacion.estado = "Esperando Numero";
  }
  if (tipo === "Devolucion Vacio") {
    documentacion.estado = "Esperando Link";
  }
  documentacion.cliente = idCliente;
  documentacion.nombreCliente = nombreCliente;
  documentacion.servicio = idServicio;
  documentacion.viaje = idviaje;
  documentacion.numeroContenedor = nroContenedor;

  await documentacion.save();
};

const obtenerDocumentacion = async (req, res) => {
  const { id } = req.params;

  const docu = await Documentacion.find({ servicio: id });

  res.json(docu);
};

const editarDocumento = async (req, res) => {
  const { id } = req.params;

  const documento = await Documentacion.findById(id);
  const actualizacion = new Actualizaciones();

  if (!documento) {
    const error = new Error("Documento no encontrado");
    return res.status(404).json({ msg: error.message });
  }

  documento.numeroDocumentacion =
    req.body.numeroDocumentacion || documento.numeroDocumentacion;
  documento.linkDocumento = req.body.linkDocumento || documento.linkDocumento;
  documento.estado = req.body.estado || documento.estado;
  console.log(req.body.estado);
  if (
    req.body.estado === "Solo Fisico" ||
    req.body.estado === "Fisico y Virtual"
  ) {
    const viaje = await Viajes.findById(documento.viaje);
    viaje.estadoDocumentacion = "entregado";
    const viajeAlmacenado = await viaje.save();

    console.log(viajeAlmacenado);
  }

  try {
    actualizacion.icon = "PaperClipIcon";
    actualizacion.description = Date.now();
    actualizacion.color = "text-green-300";
    actualizacion.title = `Se edito el documento del viaje Nro ${documento.numeroViaje}`;
    await actualizacion.save();
    const documentoAlmacenado = await documento.save();
    res.json(documentoAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const cargarConceptosAFacturar = async (
  fecha,
  cliente,
  nombreCliente,
  campos,
  servicio
) => {
  const conceptos = new ConceptosAFActurar();

  const {
    descripcion0,
    descripcion1,
    descripcion2,
    descripcion3,
    descripcion4,
    descripcion5,
    precioBruto,
    iva,
    iibb,
    precioNeto,
  } = campos;

  conceptos.fecha = fecha;
  conceptos.cliente = cliente;
  conceptos.nombreCliente = nombreCliente;
  conceptos.campos = campos;

  conceptos.servicio = servicio;
  conceptos.descripcion0 = descripcion0;
  conceptos.descripcion1 = descripcion1;
  conceptos.descripcion2 = descripcion2;
  conceptos.descripcion3 = descripcion3;
  conceptos.descripcion4 = descripcion4;
  conceptos.descripcion5 = descripcion5;
  conceptos.precioBruto = precioBruto;
  conceptos.iva = iva;
  conceptos.iibb = iibb;
  conceptos.precioNeto = precioNeto;

  await conceptos.save();
};

const obtenerConceptos = async (req, res) => {
  const { id } = req.params;

  const conceptos = await ConceptosAFActurar.find({ servicio: id });

  res.json(conceptos);
};

const completarDevolucion = async (req, res) => {
  const { id } = req.params;

  const viaje = await Viajes.findById(id);

  viaje.fechaDevolucion = req.body.fechaDevolucion || viaje.fechaDevolucion;
  viaje.horaDevolucion = req.body.horaDevolucion || viaje.horaDevolucion;
  viaje.fechaVencimientoDevolucion =
    req.body.fechaVencimientoDevolucion || viaje.fechaVencimientoDevolucion;
  viaje.lugarDevolucion = req.body.lugarDevolucion || viaje.lugarDevolucion;

  await viaje.save();

  res.json({ msg: "ok" });
};

const editarConcepto = async (req, res) => {
  const { id } = req.params;

  const concepto = await ConceptosAFActurar.findById(id);

  if (!concepto) {
    const error = new Error("Concepto no encontrado");
    return res.status(404).json({ msg: error.message });
  }

  concepto.fecha = req.body.fecha || concepto.fecha;
  concepto.descripcion0 = req.body.descripcion0 || concepto.descripcion0;
  concepto.descripcion1 = req.body.descripcion1 || concepto.descripcion1;
  concepto.descripcion2 = req.body.descripcion2 || concepto.descripcion2;
  concepto.descripcion3 = req.body.descripcion3 || concepto.descripcion3;
  concepto.descripcion4 = req.body.descripcion4 || concepto.descripcion4;
  concepto.descripcion5 = req.body.descripcion5 || concepto.descripcion5;
  concepto.precioBruto = req.body.precioBruto || concepto.precioBruto;

  try {
    await concepto.save();

    res.json(concepto);
  } catch (error) {
    console.log(error);
  }
};

const agregarConcepto = async (req, res) => {
  const concepto = new ConceptosAFActurar(req.body);

  try {
    await concepto.save();

    res.json(concepto);
  } catch (error) {
    console.log(error);
  }
};

const agregarViajes = async (req, res) => {
  const { id } = req.params;

  const servicio = await Servicio.findById(id);

  const estadoViaje = await EstadosViajes.findOne({ numeroEstado: "1" });

  const viajesAlmacenados = await Viajes.find({ servicio: id });

  console.log(servicio);
  console.log(viajesAlmacenados);

  const viaje = new Viajes();

  (viaje.numeroContenedor = "Mercaderia Suelta"),
    (viaje.fechaOrigen = servicio.fechaCarga),
    (viaje.horaOrigen = servicio.horaCarga),
    (viaje.cliente = servicio.cliente),
    (viaje.nombreCliente = servicio.nombreCliente);
  if (
    servicio.tipoOperacion === "importacion" ||
    servicio.tipoOperacion === "transito-aduanero"
  ) {
    viaje.domicilioOrigenTerminal =
      viajesAlmacenados[0].domicilioOrigenTerminal;
    viaje.nombreDomicilioOrigenTerminal =
      viajesAlmacenados[0].nombreDomicilioOrigenTerminal;
  }
  if (
    servicio.tipoOperacion === "one-way" ||
    servicio.tipoOperacion === "nacional"
  ) {
    viaje.domicilioOrigenCliente = viajesAlmacenados[0].domicilioOrigenCliente;
    viaje.nombreDomicilioOrigenCliente =
      viajesAlmacenados[0].nombreDomicilioOrigenCliente;
  }
  if (
    servicio.tipoOperacion === "importacion" ||
    servicio.tipoOperacion === "nacional"
  ) {
    viaje.domicilioDestinoCliente =
      viajesAlmacenados[0].domicilioDestinoCliente;
    viaje.nombreDomicilioDestinoCliente =
      viajesAlmacenados[0].nombreDomicilioDestinoCliente;
  }
  if (
    servicio.tipoOperacion === "one-way" ||
    servicio.tipoOperacion === "transito-aduanero"
  ) {
    viaje.domicilioDestinoTerminal =
      viajesAlmacenados[0].domicilioDestinoTerminal;
    viaje.nombreDomicilioDestinoTerminal =
      viajesAlmacenados[0].nombreDomicilioDestinoTerminal;
  }

  viaje.fantasiaOrigen = viajesAlmacenados[0].fantasiaOrigen;
  viaje.fantasiaDestino = viajesAlmacenados[0].fantasiaDestino;
  viaje.tipoServicio = servicio.tipoOperacion;
  viaje.tipoCarga = servicio.tipoCarga;
  (viaje.servicio = servicio._id),
    (viaje.numeroDeViaje = viajesAlmacenados[0].numeroDeViaje + "/BIS"),
    (viaje.cantidadCarga = servicio.cantidad),
    (viaje.volumenCarga = servicio.volumen),
    (viaje.pesoCarga = servicio.peso),
    (viaje.estadoServicio = servicio.estado),
    (viaje.notificado = "Sin Notificar"),
    (viaje.referenciaCliente = servicio.numeroCliente),
    (viaje.observacionesServicio = servicio.observaciones);
  viaje.estado = estadoViaje.estado;

  try {
    const viajeAlmacenado = await viaje.save();
    console.log(viajeAlmacenado);
    res.json(viajeAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const obtenerViajesValorizarCliente = async (req, res) => {
  const { id } = req.params;
  const { fecha } = req.query;
  console.log(fecha);

  // Crear un objeto Date a partir de la fecha proporcionada
  const fechaObj = new Date(fecha);

  // Crear las fechas de inicio y finalización del mes
  const primerDiaDelMes = new Date(
    fechaObj.getFullYear(),
    fechaObj.getMonth(),
    1
  );
  const ultimoDiaDelMes = new Date(
    fechaObj.getFullYear(),
    fechaObj.getMonth() + 1,
    0
  );

  const viajesCliente = await Viajes.find({
    cliente: id,
    fechaOrigenParaListados: { $gte: primerDiaDelMes, $lte: ultimoDiaDelMes },
    $or: [
      { PrecioViaje: { $in: [null, ""] } },
      { PrecioAdicional: { $in: [null, ""] } },
    ],
  });
  console.log(viajesCliente);
  res.json(viajesCliente);
};

const obtenerTodosLosViajesPorValorizarPorCliente = async (req, res) => {
  const viajesCliente = await Viajes.find({
    numeroFactura: { $in: [null, ""] },
  }).sort({
    PrecioViaje: 1, // Esto ordenará los documentos de tal manera que aquellos con PrecioViaje nulo o cadena vacía aparecerán primero
  });

  res.json(viajesCliente);
};

const actualizarPrecioViajesDesdeClientes = async (req, res) => {
  const { id } = req.params;
  const { precio } = req.body;

  console.log(precio);

  const viaje = await Viajes.findById(id);

  viaje.precioViaje = precio;

  await viaje.save();

  res.json({ msg: "ok!" });
};

const actualizarAdicionalCliente = async (req, res) => {
  const { id } = req.params;
  const { precio } = req.body;

  console.log(precio);

  const viaje = await Viajes.findById(id);

  viaje.precioAdicional = precio;

  await viaje.save();

  res.json({ msg: "ok!" });
};

const actualizarNumeroFacturaDesdeClientes = async (req, res) => {
  const { id } = req.params;
  const { numero } = req.body;

  const viaje = await Viajes.findById(id);
  const servicio = await Servicio.findById(viaje.servicio);

  const viajesFiltrados = await Viajes.find({ servicio: viaje.servicio });

  viaje.numeroFactura = numero;

  await grabarEnExcel({ numero });

  if (viajesFiltrados.length == 1) {
    servicio.estado = "Terminado";
  } else if (
    viajesFiltrados.every(
      (viaje) => viaje.nombreChofer && viaje.nombreChofer.trim() !== ""
    )
  ) {
    servicio.estado = "Terminado";
  }

  await viaje.save();
  await servicio.save();

  res.json({ msg: "ok!" });
};

const filtrarViajesModal = async (req, res) => {};

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
};
