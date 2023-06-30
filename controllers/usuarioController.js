import Usuario from "../models/Usuario.js";
import generarId from "../helpers/generarId.js";
import generarJWT from "../helpers/generarJWT.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/emails.js";
import Cliente from "../models/Cliente.js";
import Proveedor from "../models/Proveedor.js";
import Actualizaciones from "../models/UltimasActualizaciones.js";

const obtenerUsuarios = async (req, res) => {
  const usuarios = await Usuario.find();

  res.json(usuarios);
};

const obtenerUsuario = async (req, res) => {
  const { id } = req.params;

  const usuario = await Usuario.findById(id);

  if (usuario) {
    const error = new Error("No existe el usuario");
    return res.status(403).json({ msg: error.message });
  }
  res.json(usuario);
};

const comprobarUsuario = async (req, res) => {
  const { email } = req.body;

  const existeUsuario = await Usuario.findOne({ email });

  if (existeUsuario) {
    const error = new Error("Usuario ya registrado");
    return res.status(400).json({ msg: error.message });
  }

  res.json({ msg: "ok" });
};

const editarUsuario = async (req, res) => {
  const { id } = req.params;

  const usuario = await Usuario.findById(id);

  if (!usuario) {
    const error = new Error("No encontrado");
    return res.status(404).json({ msg: error.message });
  }

  usuario.nombre = req.body.nombre || usuario.nombre;
  usuario.apellido = req.body.apellido || usuario.apellido;
  usuario.dni = req.body.dni || usuario.dni;
  usuario.email = req.body.email || usuario.email;
  usuario.celu = req.body.celu || usuario.celu;
  usuario.rol = req.body.rol || usuario.rol;
  usuario.cliente = req.body.cliente || usuario.cliente;
  usuario.proveedor = req.body.proveedor || usuario.proveedor;

  try {
    const usuarioAlmacenado = await usuario.save();
    res.json(usuarioAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const registrar = async (req, res) => {
  //Evita registros duplicados
  const { email } = req.body;
  const { cuit } = req.body;
  const { rol } = req.body;
  const actualizacion = new Actualizaciones();

  let id = "";
  let nombre = "";

  const existeUsuario = await Usuario.findOne({ email });
  if (existeUsuario) {
    const error = new Error("Usuario ya registrado");
    return res.status(400).json({ msg: error.message });
  }
  const usuario = new Usuario(req.body);

  if (rol === "cliente") {
    const { idCliente } = req.body;
    const cliente = await Cliente.findById(idCliente);
    console.log(cliente);
    usuario.empresa = cliente.nombre;
    usuario.cliente = cliente._id;
  }

  if (rol === "proveedor" || rol === "chofer") {
    const { idProveedor } = req.body;
    const proveedor = await Proveedor.findById(idProveedor);
    usuario.empresa = proveedor.nombre;
    usuario.proveedor = proveedor._id;
  }

  try {
    usuario.token = generarId();
    const usuarioAlmacenado = await usuario.save();

    // Enviamos el email de confirmacion
    // emailRegistro({
    //   email: usuario.email,
    //   nombre: usuario.nombre,
    //   token: usuario.token,
    // });

    actualizacion.icon = "PencilSquareIcon";
    actualizacion.description = Date.now();
    actualizacion.color = "text-green-300";
    actualizacion.title = `Se creo el usuario Nro ${usuario.nombre} ${usuario.apellido}`;
    await actualizacion.save();
    res.json({ msg: "Usuario Creado Correctamente." });

    // setTimeout(() => {
    //   guardarUsuarioenCliente(cuit, usuarioAlmacenado._id);
    // }, 2000);
  } catch (error) {
    console.log(error);
  }
};

const guardarUsuarioenCliente = async (cuit, id) => {
  const existeCliente = await Cliente.findOne({ cuit });
  existeCliente.usuarios.push(id);
  await existeCliente.save();

  const usuario = await Usuario.findById(id);
  usuario.cliente.push(existeCliente._id.toString());

  await usuario.save();
};

const autenticar = async (req, res) => {
  const { email, password } = req.body;

  // Comprobar si el usuario existe
  const usuario = await Usuario.findOne({ email });
  if (!usuario) {
    const error = new Error("El usuario no existe");
    return res.status(404).json({ msg: error.message });
  }
  // Comprobar si el usuario esta confirmado
  if (!usuario.confirmado) {
    const error = new Error("Tu cuenta no ha sido confirmada");
    return res.status(403).json({ msg: error.message });
  }
  // Comprobar su password
  if (await usuario.comprobarPassword(password)) {
    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      token: generarJWT(usuario._id),
    });
  } else {
    const error = new Error("El password es incorrecto");
    return res.status(403).json({ msg: error.message });
  }
};

const confirmar = async (req, res) => {
  const { token } = req.params;
  const usuarioConfirmar = await Usuario.findOne({ token });
  if (!usuarioConfirmar) {
    const error = new Error("Token no valido");
    return res.status(403).json({ msg: error.message });
  }

  try {
    usuarioConfirmar.confirmado = true;
    usuarioConfirmar.token = "";
    await usuarioConfirmar.save();
    res.json({ msg: "Usuario confirmado correctamente" });
  } catch (error) {
    console.log(error);
  }
};

const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      const error = new Error("Usuario no encontrado");
      return res.status(404).json({ msg: error.message });
    }

    await usuario.remove();
    res.json({ msg: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar el usuario" });
  }
};

const olvidePassword = async (req, res) => {
  const { email } = req.body;
  const usuario = await Usuario.findOne({ email });

  if (!usuario) {
    const error = new Error("El usuario no existe");
    return res.status(404).json({ msg: error.message });
  }

  try {
    usuario.token = generarId();
    await usuario.save();

    //Enviar Email de recupero de contraseña
    emailOlvidePassword({
      email: usuario.email,
      nombre: usuario.nombre,
      token: usuario.token,
    });

    res.json({ msg: "Hemos enviado un email con las instrucciones" });
  } catch (error) {
    console.log(error);
  }
};

const comprobarToken = async (req, res) => {
  const { token } = req.params;
  const tokenValido = await Usuario.findOne({ token });

  if (tokenValido) {
    res.json({ msg: "Token valido y el usuario existe" });
  } else {
    const error = new Error("Token no valido");
    return res.status(404).json({ msg: error.message });
  }
};

const nuevoPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const usuario = await Usuario.findOne({ token });

  if (usuario) {
    usuario.password = password;
    usuario.token = "";
    try {
      await usuario.save();
      res.json({ msg: "Password modificado correctamente" });
    } catch (error) {
      console.log(error);
    }
  } else {
    const error = new Error("Token no valido");
    return res.status(404).json({ msg: error.message });
  }
};

const crearPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const usuario = await Usuario.findOne({ token });

  if (usuario) {
    usuario.password = password;
    usuario.token = "";
    usuario.confirmado = true;

    try {
      await usuario.save();
      res.json({ msg: "Password guardado correctamente" });
    } catch (error) {
      console.log(error);
    }
  } else {
    const error = new Error("Token no valido");
    return res.status(404).json({ msg: error.message });
  }
};

const perfil = async (req, res) => {
  const { usuario } = req;

  res.json(usuario);
};

export {
  registrar,
  autenticar,
  confirmar,
  olvidePassword,
  comprobarToken,
  nuevoPassword,
  perfil,
  crearPassword,
  comprobarUsuario,
  obtenerUsuarios,
  obtenerUsuario,
  editarUsuario,
  eliminarUsuario,
};
