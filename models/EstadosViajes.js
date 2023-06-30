import mongoose from "mongoose";

const estadosViajesSchema = mongoose.Schema(
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

estadosViajesSchema.pre("save", async function (next) {
  if (!this.isNew) {
    next();
  }

  try {
    const ultimoEstado = await EstadosViajes.findOne(
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

const EstadosViajes = mongoose.model("EstadosViajes", estadosViajesSchema);

export default EstadosViajes;
