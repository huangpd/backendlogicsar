import mongoose from "mongoose";

const actualizacionesSchema = mongoose.Schema(
  {
    description: {
      type: Date,
      default: Date.now(),
    },

    color: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

const Actualizaciones = mongoose.model(
  "Actualizaciones",
  actualizacionesSchema
);

export default Actualizaciones;
