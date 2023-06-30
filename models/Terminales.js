import mongoose from "mongoose";

const terminalesSchema = mongoose.Schema(
  {
    tipo: {
      type: String,
      trim: true,
      require: true,
    },
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

const Terminales = mongoose.model("Terminales", terminalesSchema);

export default Terminales;
