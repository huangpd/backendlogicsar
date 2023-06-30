import mongoose from "mongoose";

const estadosServiciosSchema = mongoose.Schema(
  {
    numeroEstado: {
      type: String,
      trim: true,
      require: true,
    },
    estado: {
      type: String,
      trim: true,
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

estadosServiciosSchema.pre("save", async function (next) {
  if (!this.isNew) {
    next();
  }

  try {
    const ultimoEstado = await EstadosServicio.findOne(
      {},
      {},
      { sort: { numeroEstado: -1 } }
    );

    if (ultimoEstado) {
      this.numeroEstado = parseInt(ultimoEstado.numeroEstado) + 1;
    } else {
      this.numeroEstado = 1;
    }

    next();
  } catch (error) {
    next(error);
  }
});

const EstadosServicio = mongoose.model(
  "EstadosServicio",
  estadosServiciosSchema
);

export default EstadosServicio;
