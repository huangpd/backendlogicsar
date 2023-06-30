import mongoose from "mongoose";

const domiciliosSchema = mongoose.Schema(
  {
    direccion: {
      type: String,
      trim: true,
      require: true,
    },
    localidad: {
      type: String,
      trim: true,
      require: true,
    },
    provincia: {
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
    cliente: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clientes",
      },
    ],
    entregas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Viajes",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Domicilios = mongoose.model("Domicilios", domiciliosSchema);

export default Domicilios;
