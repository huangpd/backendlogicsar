import nodemailer from "nodemailer";
import moment from "moment";

import "moment/locale/es.js";

moment.locale("es");

// TODO: mejorar los html de los mail que llegan a los clientes.

export const emailRegistro = async (datos) => {
  const { email, nombre, token } = datos;

  const hemail = process.env.EMAIL;
  const hpass = process.env.PASSWORD;
  const host = process.env.HOST;
  const port = process.env.EMAIL_PORT;

  const transport = nodemailer.createTransport({
    host: host,
    port: port,
    auth: {
      user: hemail,
      pass: hpass,
    },
  });

  //informacion del email

  const info = await transport.sendMail({
    from: '"CarryOn - Bienvenid@!" <carryon.arg@gmail.com>',
    to: email,
    cc: "carryon.arg@gmail.com",

    subject: "Alta de cuenta",
    text: "Verifica tu cuenta en CarryOn",
    html: `
        <p>Hola ${nombre}, bienvenid@ a CarryOn</p>
        <p>Hemos creado tu cuenta para que puedas gestionar todos los servicios con nosotros y mucho mas. Solo debes configurar una contraseña y puedes hacerlo en el siguiente enlace: <a href='${process.env.FRONTEND_URL}/crear-password/${token}'>Configurar Pass</a></p>

        <p>Si no acabas de adquirir un servicio con nosotros, puedes ignorar este mensaje.</p>

        <p>Que tengas un gran dia!</p>
        <p>Equipo Logicsar</p>
    `,
  });
  console.log(info);
};

export const emailOlvidePassword = async (datos) => {
  const { email, nombre, token } = datos;

  const hemail = process.env.EMAIL;
  const hpass = process.env.PASSWORD;
  const host = process.env.HOST;
  const port = process.env.EMAIL_PORT;

  const transport = nodemailer.createTransport({
    host: host,
    port: port,
    auth: {
      user: hemail,
      pass: hpass,
    },
  });

  //informacion del email

  const info = await transport.sendMail({
    from: '"Carry On" <carryon.arg@gmail.com>',
    to: email,
    cc: "carryon.arg@gmail.com",
    subject: "Reestablece tu Password",
    text: "Reestablece tu Password",
    html: `
        <p>Hola ${nombre} has solicitado reestablecer tu password en nuestro sistema</p>
        <p>sigue siguiente enlace para generar un nuevo password: <a href='${process.env.FRONTEND_URL}/olvide-password/${token}'>Reestablecer Password</a></p>

        <p>Si tu no solicitaste este cambio, puedes ignorar el mensaje</p>

    `,
  });
};

export const emailNuevoViajeProveedor = async (datos) => {
  const { email, nombre } = datos;

  const hemail = process.env.EMAIL;
  const hpass = process.env.PASSWORD;
  const host = process.env.HOST;
  const port = process.env.EMAIL_PORT;

  const transport = nodemailer.createTransport({
    host: host,
    port: port,
    auth: {
      user: hemail,
      pass: hpass,
    },
  });

  //informacion del email

  const info = await transport.sendMail({
    from: '"CarryOn" <carryon.arg@gmail.com>',
    to: email,
    cc: "carryon.arg@gmail.com",
    subject: "Nuevo Viaje!",
    text: "Tienes un nuevo viaje para confirmar",
    html: `
        <p>Hola ${nombre} Se te asigno un nuevo viaje.</p>
        <p>sigue siguiente enlace para armar los equipos: <a href='${process.env.FRONTEND_URL}/olvide-password/'>Armar Equipos</a></p>
    `,
  });
};

export const emailNuevoViajeCliente = async (datos) => {
  const { email, nombre } = datos;

  const hemail = process.env.EMAIL;
  const hpass = process.env.PASSWORD;
  const host = process.env.HOST;
  const port = process.env.EMAIL_PORT;

  const transport = nodemailer.createTransport({
    host: host,
    port: port,
    auth: {
      user: hemail,
      pass: hpass,
    },
  });

  //informacion del email

  const info = await transport.sendMail({
    from: '"CarryOn" <carryon.arg@gmail.com>',
    to: email,
    cc: "carryon.arg@gmail.com",
    subject: "Nuevo Viaje Registrado!",
    text: "Hemos registrado su pedido",
    html: `
        <p>Estimados ${nombre},</p>
        <p>Este es un mail para informarte que hemos registrado correctamente tu solicitud de viaje en nuestro sistema. Pronto te estaremos enviando la informacion del chofer junto con los datos del viaje.</p></br>
        <p>Equipo CarryOn</p>
    `,
  });
};

export const notificarViajes = async (usuarios, servicio, viajes) => {
  console.log("intento enviar mail");
  console.log(usuarios);
  console.log(servicio);
  console.log(viajes);

  const hemail = process.env.EMAIL;
  const hpass = process.env.PASSWORD;
  const host = process.env.HOST;
  const port = process.env.EMAIL_PORT;

  const transport = nodemailer.createTransport({
    host: host,
    port: port,
    auth: {
      user: hemail,
      pass: hpass,
    },
  });

  //informacion del email

  if (usuarios.length !== 1) {
    for (let usuario of usuarios) {
      const { email, nombre } = usuario;
      const {
        nombreCliente,
        numeroPedido,
        fechaCarga,
        horaCarga,
        origenCarga,
        observaciones,
      } = servicio;

      const info = await transport.sendMail({
        from: '"CarryOn" <carryon.arg@gmail.com>',
        to: email,
        cc: "carryon.arg@gmail.com",
        subject: `Pedido de Transporte - ${moment(fechaCarga).format(
          "dddd DD/MM"
        )} - ${horaCarga} - Pedido Nro ${numeroPedido} `,
        text: "Datos del transporte",
        html: `
            <p>Hola ${nombre},</p>
            <p>Los datos de los choferes y camiones asignados para esta operacion son:</p>
            <p><b>Número de Pedido: ${numeroPedido}</b></p>
            <p><b>Por Cuenta y Orden de: ${nombreCliente}</b></p>

            <table style="border-collapse: separate; border-spacing: 0 8px; ">
         
            <tr>
              <th style="background-color: #ccc; padding: 8px;">NUM DE VIAJE</th>
              <th style="background-color: #ccc; padding: 8px;">NOMBRE Y APELLIDO</th>
              <th style="background-color: #ccc; padding: 8px;">DNI</th>
              <th style="background-color: #ccc; padding: 8px;">CAMION/SEMI</th>
              <th style="background-color: #ccc; padding: 8px;">CELULAR</th>
              <th style="background-color: #000; color: #fff; padding: 8px;">REFERENCIA</th>
              <th style="background-color: #000; color: #fff; padding: 8px;">CONTENEDOR</th>
            </tr>
            ${viajes
              .map(
                (viaje) => `
              <tr>
                <td style="border-bottom: 1px solid #ccc; padding: 8px;">${viaje.numeroDeViaje}</td>
                <td style="border-bottom: 1px solid #ccc; padding: 8px;">${viaje.nombreChofer}</td>
                <td style="border-bottom: 1px solid #ccc; padding: 10px;">${viaje.dni}</td>
                <td style="border-bottom: 1px solid #ccc; padding: 10px;">${viaje.patenteCamion} / ${viaje.patenteSemi}</td>
                <td style="border-bottom: 1px solid #ccc; padding: 8px;">${viaje.telefono}</td>
                <td style="border-bottom: 1px solid #ccc;  padding: 8px;">aaa2233</td>
                <td style="border-bottom: 1px solid #ccc; padding: 8px;">${viaje.numeroContenedor}</td>
              </tr>      
            `
              )
              .join("")}
          </table>
     
          
  <p> *Los camiones estaran el dia ${moment(fechaCarga).format(
    "dddd DD/MM"
  )} a las ${horaCarga} en ${origenCarga}.</p>

       <p>Ante cualquier duda no duden en consultarnos</p>
       <p>Saludos!</p>    

            <p>Equipo CarryOn</p>
        `,
      });
    }
  } else {
    const { email, nombre } = usuarios[0];

    const { nombreCliente, numeroPedido, fechaCarga, horaCarga, origenCarga } =
      servicio;

    const info = await transport.sendMail({
      from: '"CarryOn" <carryon.arg@gmail.com>',
      to: email,
      cc: "carryon.arg@gmail.com",
      subject: `Pedido de Transporte - ${moment(fechaCarga).format(
        "dddd DD/MM"
      )} - ${horaCarga} - Pedido Nro ${numeroPedido} `,
      text: "Datos del transporte",
      html: `
          <p>Hola ${nombre},</p>
          <p>Los datos de los choferes y camiones asignados para esta operacion son:</p>
          <p><b>Número de Pedido: ${numeroPedido}</b></p>
          <p><b>Por Cuenta y Orden de: ${nombreCliente}</b></p>

          <table style="border-collapse: separate; border-spacing: 0 8px; ">
       
          <tr>
            <th style="background-color: #ccc; padding: 8px;">NUM DE VIAJE</th>
            <th style="background-color: #ccc; padding: 8px;">NOMBRE Y APELLIDO</th>
            <th style="background-color: #ccc; padding: 8px;">DNI</th>
            <th style="background-color: #ccc; padding: 8px;">CAMION/SEMI</th>
            <th style="background-color: #ccc; padding: 8px;">CELULAR</th>
            <th style="background-color: #000; color: #fff; padding: 8px;">REFERENCIA</th>
            <th style="background-color: #000; color: #fff; padding: 8px;">CONTENEDOR</th>
          </tr>
          ${viajes
            .map(
              (viaje) => `
            <tr>
              <td style="border-bottom: 1px solid #ccc; padding: 8px;">${viaje.numeroDeViaje}</td>
              <td style="border-bottom: 1px solid #ccc; padding: 8px;">${viaje.nombreChofer}</td>
              <td style="border-bottom: 1px solid #ccc; padding: 10px;">${viaje.dni}</td>
              <td style="border-bottom: 1px solid #ccc; padding: 10px;">${viaje.patenteCamion} / ${viaje.patenteSemi}</td>
              <td style="border-bottom: 1px solid #ccc; padding: 8px;">${viaje.telefono}</td>
              <td style="border-bottom: 1px solid #ccc;  padding: 8px;">aaa2233</td>
              <td style="border-bottom: 1px solid #ccc; padding: 8px;">${viaje.numeroContenedor}</td>
            </tr>      
          `
            )
            .join("")}
        </table>
   
        
<p> *Los camiones estaran el dia ${moment(fechaCarga).format(
        "dddd DD/MM"
      )} a las ${horaCarga} en ${origenCarga}.</p>

     <p>Ante cualquier duda no duden en consultarnos</p>
     <p>Saludos!</p>    

          <p>Equipo CarryOn</p>
      `,
    });
    console.log(info);
  }
  console.log("Email Enviado");
};

export const notificarRecepcionViaje = async (usuarios, servicio) => {
  const hemail = process.env.EMAIL;
  const hpass = process.env.PASSWORD;
  const host = process.env.HOST;
  const port = process.env.EMAIL_PORT;

  const transport = nodemailer.createTransport({
    host: host,
    port: port,
    auth: {
      user: hemail,
      pass: hpass,
    },
  });

  //informacion del email

  if (usuarios.length > 1) {
    for (let usuario of usuarios) {
      const { email, nombre } = usuario;
      const {
        nombreCliente,
        numeroPedido,
        fechaCarga,
        horaCarga,
        origenCarga,
        observaciones,
        nombreTerminal,
        cantidad,
        tipoCarga,
        peso,
        destinoCarga,
        numeroCliente,
        despachoAduana,
      } = servicio;

      const info = await transport.sendMail({
        from: '"CarryOn" <carryon.arg@gmail.com>',
        to: email,
        cc: "carryon.arg@gmail.com",
        subject: `Pedido de Transporte Nro ${numeroPedido} | ${moment(
          fechaCarga
        ).format("dddd DD/MM")} | ${horaCarga} | ${nombreTerminal}`,
        text: "Datos del transporte",
        html: `
          <p>Hola ${nombre},</p>
          <p>Recibido y Coordinado este pedido para el dia ${moment(
            fechaCarga
          ).format("dddd DD/MM")} - ${horaCarga} </p>
          <p><b>Número de Pedido: ${numeroPedido}</b></p>
          <p><b>Por Cuenta y Orden de: ${nombreCliente}</b></p>

          <p>MERCADERIA:  ${cantidad} ${tipoCarga} - Peso: ${peso} KG </p>
          <p>LUGAR DE CARGA: ${nombreTerminal} | ${origenCarga}</p>
          <p>LUGAR DE DESCARGA: ${destinoCarga}</p>
          ${
            observaciones !== "" ? `<p>OBSERVACIONES: ${observaciones}</p>` : ""
          }
          ${numeroCliente !== "" ? `<p>INTERNO: ${numeroCliente}</p>` : ""}
          ${despachoAduana !== "" ? `<p>INTERNO: ${despachoAduana}</p>` : ""}

          <p><b>Luego Pasaremos los datos del chofer y camion asignados.</b></p>

          <hr style="border: 1px solid #ccc;">
          <small>
      <p style="font-size: 12px; font-style: italic;">
        El contratante y/o consignatario asume la obligación de asegurar la carga por su cuenta, carga y riesgo con cláusula de "NO REPETICIÓN CONTRA EL TRANSPORTISTA", por los daños y riesgos que pudieran producirse durante el curso de transporte, carga y/o descarga. Salvo que opte por la contratación del seguro por intermedio de nuestra empresa, quien deberá poseer entonces comunicación por escrito con debida anticipación.
      </p>
    </small>
    <hr style="border: 1px solid #ccc;">

          
    <p>Ante cualquier duda no duden en consultarnos</p>
    <p>Saludos!</p>    


  

          <p>Equipo CarryOn</p>

          <style>
      hr {
        margin-top: 10px;
        margin-bottom: 10px;
      }
    </style>
      `,
      });
    }
  } else {
    console.log(usuarios);
    const { email, nombre } = usuarios[0];
    const {
      nombreCliente,
      numeroPedido,
      fechaCarga,
      horaCarga,
      origenCarga,
      observaciones,
      nombreTerminal,
      cantidad,
      tipoCarga,
      peso,
      destinoCarga,
      numeroCliente,
      despachoAduana,
    } = servicio;

    console.log(email);

    const info = await transport.sendMail({
      from: '"CarryOn" <carryon.arg@gmail.com>',
      to: email,
      cc: "carryon.arg@gmail.com",
      subject: `Pedido de Transporte Nro ${numeroPedido} | ${moment(
        fechaCarga
      ).format("dddd DD/MM")} | ${horaCarga} | ${nombreTerminal}`,
      text: "Datos del transporte",
      html: `
          <p>Hola ${nombre},</p>
          <p>Recibido y Coordinado este pedido para el dia ${moment(
            fechaCarga
          ).format("dddd DD/MM")} - ${horaCarga} </p>
          <p><b>Número de Pedido: ${numeroPedido}</b></p>
          <p><b>Por Cuenta y Orden de: ${nombreCliente}</b></p>

          <p>MERCADERIA:${cantidad} ${tipoCarga} ${peso} KG </p>
          <p>LUGAR DE CARGA: ${nombreTerminal} | ${origenCarga}</p>
          <p>LUGAR DE DESCARGA: ${destinoCarga}</p>
          ${
            observaciones !== "" ? `<p>OBSERVACIONES: ${observaciones}</p>` : ""
          }
          ${numeroCliente !== "" ? `<p>INTERNO: ${numeroCliente}</p>` : ""}
          ${despachoAduana !== "" ? `<p>INTERNO: ${despachoAduana}</p>` : ""}

          <p></i><b>Luego Pasaremos los datos del chofer y camion asignados.</b></p>

          <hr style="border: 1px solid #ccc;">
          <small>
      <p style="font-size: 12px; font-style: italic;">
        El contratante y/o consignatario asume la obligación de asegurar la carga por su cuenta, carga y riesgo con cláusula de "NO REPETICIÓN CONTRA EL TRANSPORTISTA", por los daños y riesgos que pudieran producirse durante el curso de transporte, carga y/o descarga. Salvo que opte por la contratación del seguro por intermedio de nuestra empresa, quien deberá poseer entonces comunicación por escrito con debida anticipación.
      </p>
    </small>
    <hr style="border: 1px solid #ccc;">

          
    <p>Ante cualquier duda no duden en consultarnos</p>
    <p>Saludos!</p>    


  

          <p>Equipo CarryOn</p>

          <style>
      hr {
        margin-top: 10px;
        margin-bottom: 10px;
      }
    </style>
 
      `,
    });
  }
  console.log("Email Enviado");
};
