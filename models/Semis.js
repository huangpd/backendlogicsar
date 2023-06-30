import mongoose from "mongoose";

const semisSchema = mongoose.Schema(
  {
    modelo: {
      type: String,
      trim: true,
    },
    patente: {
      type: String,
      trim: true,
      require: true,
    },
    year: {
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

const Semis = mongoose.model("Semis", semisSchema);

export default Semis;
