import mongoose from "mongoose";

const viajesSchema = mongoose.Schema(
  {
    numeroDeViaje: {
      type: String,
      trim: true,
      require: true,
    },
    numeroContenedor: {
      type: String,
      trim: true,
      require: true,
    },
    tipoDeOperacion: {
      type: String,
      trim: true,
    },
    tipoCarga: {
      type: String,
      trim: true,
    },
    observaciones: [
      {
        type: String,
      },
    ],

    cantidadCarga: {
      type: String,
      trim: true,
    },
    pesoCarga: {
      type: String,
      trim: true,
    },
    volumenCarga: {
      type: String,
      trim: true,
    },
    direccionRetorno: {
      type: String,
      trim: true,
    },
    notificado: {
      type: String,
      trim: true,
    },
    estado: {
      type: String,
      trim: true,
      require: true,
    },
    estado2: {
      type: String,
      trim: true,
      require: true,
    },
    estadoServicio: {
      type: String,
      trim: true,
    },
    fechaOrigen: {
      type: String,
      trim: true,
    },
    fechaDestino: {
      type: Date,
      default: Date.now(),
    },
    horaOrigen: {
      type: String,
      trim: true,
    },
    horaEntrega: {
      type: String,
      trim: true,
    },
    duracionServicio: {
      type: String,
      trim: true,
    },
    tipoServicio: {
      type: String,
      trim: true,
    },
    remito: {
      type: String,
      trim: true,
    },
    estado: {
      type: String,
      trim: true,
    },
    fechaAlta: {
      type: Date,
      default: Date.now(),
    },
    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    cliente: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clientes",
      },
    ],
    documentacion: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Documentacion",
      },
    ],
    nombreCliente: {
      type: String,
      trim: true,
      require: true,
    },
    domicilioOrigenCliente: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Domicilios",
      },
    ],
    nombreDomicilioOrigenCliente: {
      type: String,
      trim: true,
    },
    domicilioOrigenTerminal: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Terminales",
      },
    ],
    nombreDomicilioOrigenTerminal: {
      type: String,
      trim: true,
    },
    domicilioDestinoCliente: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Domicilios",
      },
    ],
    nombreDomicilioDestinoCliente: {
      type: String,
      trim: true,
    },
    domicilioDestinoTerminal: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Terminales",
      },
    ],
    nombreDomicilioDestinoTerminal: {
      type: String,
      trim: true,
    },
    proveedor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proveedor",
      },
    ],
    nombreProveedor: {
      type: String,
      trim: true,
    },

    chofer: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cohofer",
      },
    ],
    nombreChofer: {
      type: String,
      trim: true,
      require: true,
    },
    camion: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Camion",
      },
    ],
    servicio: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Servicio",
      },
    ],
    semi: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Semis",
      },
    ],
    patenteSemi: {
      type: String,
      trim: true,
      require: true,
    },
    patenteCamion: {
      type: String,
      trim: true,
      require: true,
    },
    adicionales: {
      type: String,
      trim: true,
    },
    fechaTerminacion: {
      type: String,
      trim: true,
    },
    horaTerminacion: {
      type: String,
      trim: true,
    },
    referenciaCliente: {
      type: String,
      trim: true,
    },
    diasDemora: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Viajes = mongoose.model("Viajes", viajesSchema);

export default Viajes;
