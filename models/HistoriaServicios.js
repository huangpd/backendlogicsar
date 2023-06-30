import mongoose from "mongoose";

const historiaServicios = mongoose.Schema(
  {
    fecha: {
      type: Date,
      default: Date.now(),
    },
    hora: {
      type: String,
      trim: true,
      require: true,
    },
    titulo: {
      type: String,
      trim: true,
      require: true,
    },
    nombreUsuario: {
      type: String,
      trim: true,
      require: true,
    },

    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    servicio: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Servicio",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const HistoriaServicios = mongoose.model(
  "HistoriaServicios",
  historiaServicios
);

export default HistoriaServicios;
