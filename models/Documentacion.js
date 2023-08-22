import mongoose from "mongoose";

const documentacionSchema = mongoose.Schema(
  {
    numeroViaje: {
      type: String,
      trim: true,
    },
    numeroServicio: {
      type: String,
      trim: true,
    },
    numeroContenedor: {
      type: String,
      trim: true,
    },
    tipoDocumentacion: {
      type: String,
      trim: true,
    },
    numeroDocumentacion: {
      type: String,
      trim: true,
    },
    linkRemito: {
      type: String,
      trim: true,
    },
    linkVacio: {
      type: String,
      trim: true,
    },
    estado: {
      type: String,
      trim: true,
    },

    nombreCliente: {
      type: String,
      trim: true,
    },
    cliente: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clientes",
      },
    ],
    servicio: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Servicio",
      },
    ],
    viaje: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Viajes",
      },
    ],
    chofer: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Choferes",
      },
    ],
    nombreChofer: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Documentacion = mongoose.model("Documentacion", documentacionSchema);

export default Documentacion;
