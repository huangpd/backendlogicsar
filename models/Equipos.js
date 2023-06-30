import mongoose from "mongoose";

const equiposSchema = mongoose.Schema(
  {
    numeroEquipo: {
      type: String,
      trim: true,
    },
    chofer: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Choferes",
      },
    ],
    camion: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Camiones",
      },
    ],
    semis: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Semis",
      },
    ],
    viajes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Viajes",
      },
    ],
    nombreChofer: {
      type: String,
      trim: true,
    },
    patenteCamion: {
      type: String,
      trim: true,
    },
    patenteSemi: {
      type: String,
      trim: true,
    },
    fechaAlta: {
      type: Date,
      default: Date.now(),
    },
    estado: {
      type: String,
      trim: true,
    },
    nombreProveedor: {
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
  },
  {
    timestamps: true,
  }
);

equiposSchema.pre("save", async function (next) {
  if (!this.isNew) {
    next();
  }
  try {
    const ultimoEquipo = await Equipos.findOne(
      {},
      {},
      { sort: { numeroEquipo: -1 } }
    );

    if (ultimoEquipo) {
      this.numeroEquipo = parseInt(ultimoEquipo.numeroEquipo) + 1;
    } else {
      this.numeroEquipo = 1;
    }

    next();
  } catch (error) {
    next(error);
  }
});

const Equipos = mongoose.model("Equipos", equiposSchema);

export default Equipos;
