import mongoose from "mongoose";

const conceptosAFacturarSchema = mongoose.Schema(
  {
    fecha: {
      type: Date,
      default: Date.now(),
    },
    horaTerminacion: {
      type: String,
      trim: true,
    },
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
    },
    nombreCliente: {
      type: String,
      trim: true,
    },
    descripcion0: {
      type: String,
    },
    descripcion1: {
      type: String,
    },
    descripcion2: {
      type: String,
    },
    descripcion3: {
      type: String,
    },
    descripcion4: {
      type: String,
    },
    descripcion5: {
      type: String,
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

    servicio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Servicio",
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

const ConceptosAFActurar = mongoose.model(
  "ConceptosAFActurar",
  conceptosAFacturarSchema
);

export default ConceptosAFActurar;
