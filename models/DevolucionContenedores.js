import mongoose from "mongoose";

const devolucionContenedoresSchema = mongoose.Schema(
  {
    nombre: {
      type: String,
      trim: true,
      require: true,
    },
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
  },
  {
    timestamps: true,
  }
);

const Devoluciones = mongoose.model(
  "Devoluciones",
  devolucionContenedoresSchema
);

export default Devoluciones;
