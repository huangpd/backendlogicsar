import mongoose from "mongoose";

const facturaSchema = mongoose.Schema(
  {
    numero: {
      type: String,
      trim: true,
    },
    fecha: {
      type: Date,
      default: Date.now(),
    },
    tipo: {
      type: String,
      trim: true,
    },
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
    },
    campos: [
      {
        descripcion: {
          type: String,
          trim: true,
        },
        precioBruto: {
          type: String,
          trim: true,
        },
        iva: {
          type: String,
          trim: true,
        },
        iibb: {
          type: String,
          trim: true,
        },
        precioNeto: {
          type: String,
          trim: true,
        },
      },
    ],
    totalFactura: {
      type: String,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    estado: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Factura = mongoose.model("Factura", facturaSchema);

export default Factura;
