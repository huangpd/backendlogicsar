import mongoose from "mongoose";

const choferesSchema = mongoose.Schema(
  {
    nombre: {
      type: String,
      trim: true,
      require: true,
    },
    apellido: {
      type: String,
      trim: true,
      require: true,
    },
    dni: {
      type: String,
      trim: true,
      require: true,
    },
    email: {
      type: String,
      trim: true,
      require: true,
    },
    telefono: {
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

    servicios: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Servicios",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Choferes = mongoose.model("Choferes", choferesSchema);

export default Choferes;
