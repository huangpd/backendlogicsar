import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";

const servicioSchema = mongoose.Schema(
  {
    numeroPedido: {
      type: Number,
      trim: true,
      unique: true,
    },
    cliente: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cliente",
      },
    ],
    nombreCliente: {
      type: String,
      trim: true,
    },
    fechaCarga: {
      type: String,
      trimt: true,
    },
    horaCarga: {
      type: String,
      trim: true,
    },
    tipoOperacion: {
      type: String,
      trim: true,
      require: true,
    },
    tipoCarga: {
      type: String,
      trim: true,
      require: true,
    },
    cantidad: {
      type: String,
      trim: true,
      require: true,
    },
    peso: {
      type: String,
      trim: true,
      require: true,
    },
    volumen: {
      type: String,
      trim: true,
      require: true,
    },
    origenCarga: {
      type: String,
      trim: true,
      require: true,
    },
    destinoCarga: {
      type: String,
      trim: true,
      require: true,
    },
    observaciones: {
      type: String,
      trim: true,
    },
    nombreTerminal: {
      type: String,
      trim: true,
    },
    notificar: {
      type: String,
      trim: true,
    },
    numeroCliente: {
      type: String,
      trim: true,
      require: true,
    },
    despachoAduana: {
      type: String,
      trim: true,
      require: true,
    },
    playa: {
      type: String,
      trim: true,
    },

    numeroContenedores: [
      {
        numeroContenedor: {
          type: String,
          trim: true,
        },
        viaje: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Viajes",
        },
      },
    ],
    otro: {
      type: String,
      trim: true,
      require: true,
    },
    nombreProveedor: {
      type: String,
      trim: true,
    },
    estado: {
      type: String,
      trim: true,
    },
    estado2: {
      type: String,
      trim: true,
    },
    nombreChofer: {
      type: String,
      trim: true,
    },

    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    proveedor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proveedor",
      },
    ],
    minutas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Minutas",
      },
    ],
    chofer: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Choferes",
      },
    ],
    viajesSueltos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Viajes",
      },
    ],
    historia: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HistoriaServicios",
      },
    ],
  },
  {
    timestamps: true,
  }
);

servicioSchema.plugin(mongooseSequence(mongoose), {
  inc_field: "numeroPedido",
  start_seq: 60000,
});

const Servicio = mongoose.model("Servicio", servicioSchema);

export default Servicio;
