import mongoose from "mongoose";

const clienteSchema = mongoose.Schema(
  {
    tipo: {
      type: String,
      require: true,
      enum: ["A", "B"],
    },
    nombre: {
      type: String,
      trim: true,
      require: true,
    },
    cuit: {
      type: String,
      trim: true,
      require: true,
      unique: true,
    },
    domicilio: {
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
    mailFactura: {
      type: String,
      trim: true,
      require: true,
    },
    telefono: {
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
    domiciliosEntrega: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Domicilios",
      },
    ],
    servicios: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Servicios",
      },
    ],
    facturas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Factura",
      },
    ],
    recibos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recibos",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Cliente = mongoose.model("Cliente", clienteSchema);

export default Cliente;
