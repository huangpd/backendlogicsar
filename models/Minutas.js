import mongoose from "mongoose";

const minutasSchema = mongoose.Schema(
  {
    tipo: {
      type: String,
      trim: true,
      require: true,
    },
    titulo: {
      type: String,
      trim: true,
      require: true,
    },
    contacto: {
      type: String,
      trim: true,
      require: true,
    },
    minuta: {
      type: String,
      trim: true,
      require: true,
    },
    nombreCliente: {
      type: String,
      trim: true,
      require: true,
    },
    nombreProveedor: {
      type: String,
      trim: true,
      require: true,
    },
    nombreChofer: {
      type: String,
      trim: true,
      require: true,
    },

    fecha: {
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
    proveedor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proveedor",
      },
    ],
    chofer: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proveedor",
      },
    ],
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

const Minutas = mongoose.model("Minutas", minutasSchema);

export default Minutas;
