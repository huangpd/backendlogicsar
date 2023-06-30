import express from "express";

const router = express.Router();

import {
  nuevaMinuta,
  obtenerMinutas,
} from "../controllers/minutasController.js";

import checkAuth from "../middleware/checkAuth.js";

router.post("/:id", checkAuth, nuevaMinuta);
router.get("/obtener-minutas/:id", checkAuth, obtenerMinutas);

export default router;
