import mongoose from "mongoose";

const camionesSchema = mongoose.Schema(
  {
    modelo: {
      type: String,
      trim: true,
      require: true,
    },
    patente: {
      type: String,
      trim: true,
      require: true,
    },
    year: {
      type: String,
      trim: true,
      require: true,
    },

    fechaAlta: {
      type: Date,
      default: Date.now(),
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

const Camiones = mongoose.model("Camiones", camionesSchema);

export default Camiones;
