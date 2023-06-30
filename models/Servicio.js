import mongoose from "mongoose";

const servicioSchema = mongoose.Schema(
  {
    numeroPedido: {
      type: String,
      trim: true,
      require: true,
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
      require: true,
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

servicioSchema.pre("save", async function (next) {
  if (!this.isNew) {
    next();
  }

  try {
    const ultimoServicio = await Servicio.findOne(
      {},
      {},
      { sort: { numeroPedido: -1 } }
    );

    if (ultimoServicio) {
      this.numeroPedido = parseInt(ultimoServicio.numeroPedido) + 1;
    } else {
      this.numeroPedido = 1;
    }

    next();
  } catch (error) {
    next(error);
  }
});

const Servicio = mongoose.model("Servicio", servicioSchema);

export default Servicio;
