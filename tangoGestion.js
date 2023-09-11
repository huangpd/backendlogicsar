import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

async function getAuthToken() {
  const authEndpoint = "https://www.tangofactura.com/Provisioning/GetAuthToken";
  const credentials = {
    UserName: process.env.UserName, // Tu UserName codificado
    Password: process.env.Password, // Tu Password codificado
  };

  try {
    const response = await axios.post(authEndpoint, credentials);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el token de autenticación:", error);
    throw error;
  }
}

export { getAuthToken };
