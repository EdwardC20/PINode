const express = require("express");
const app = express();
const cors = require("cors");
const mercadopago = require("mercadopago");
const path = require("path");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const mysql = require("mysql");
const bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const OAuth2 = google.auth.OAuth2;
const CLIENT_ID = "437769868676-dqdshuubhglogmdvbjllm359g5cdvvpg.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN = "1//04vyZCjWlhwFkCgYIARAAGAQSNwF-L9IruQNr1XrmjdySTV8GO36rCb6k-l7Ryhg7aXHGMWzj7KzHtNDg4-pOmvFr_pad5lEi_88"


const oauth2Client = new OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({refresh_token: REFRESH_TOKEN});
const accessToken = oauth2Client.getAccessToken();

const smtpTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: "betokatrina@gmail.com",
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    refreshToken: REFRESH_TOKEN,
    accessToken: accessToken
  }
});


app.post("/send-email", (req, res) => {

  let datosReserva = {
    to: req.body.to,
    Npersona: req.body.Npersona,
    Apersona: req.body.Apersona,
    costo:  req.body.costo,
    idpago: req.body.idpago,
    tatuador:req.body.tatuador,
    fecha:req.body.fecha,
  };

  let emailContent = "esto es una variable"


  if (!datosReserva.to) {
    return res.status(400).send("Ingrese un correo destinatario válido.");
  }
  let msg = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }
        .header {
          background-color: #f0f0f0;
          padding: 10px;
          text-align: center;
          font-size: 24px;
          font-weight: bold;
        }
        .info {
          margin-top: 20px;
          margin-bottom: 20px;
        }
        .info p {
          margin: 5px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Confirmación de reserva de cita para tatuaje</div>
        <div class="info">
          <p>Estimado/a ${datosReserva.Npersona} ${datosReserva.Apersona},</p>
          <p>Tu cita para un tatuaje con el tatuador ${datosReserva.tatuador} ha sido reservada exitosamente.</p>
          <p>Detalles de la reserva:</p>
          <p><strong>Fecha:</strong> ${datosReserva.fecha}</p>
          <p><strong>Nombre del cliente:</strong> ${datosReserva.Npersona} ${datosReserva.Apersona}</p>
          <p><strong>ID de pago:</strong> ${datosReserva.idpago}</p>
          <p><strong>Costo:</strong> $ ${datosReserva.costo} USD</p>
          <p><em>Recuerda llegar a tiempo para tu cita y seguir las instrucciones del tatuador.</em></p>
        </div>
        <div class="footer">Este es un correo electrónico generado automáticamente, por favor no respondas a este mensaje.</div>
      </div>
    </body>
  </html>`;

  const mailOptions = {
    from: "Tattoores Angular <betokatrina@gmail.com>",
    to: datosReserva.to,
    subject: "Notificacion de reserva realizada",
    generateTextFromHTML: true,
    html: msg
  };

  smtpTransport.sendMail(mailOptions, (error, response) => {
    if (error) {
      console.log(error);
      res.status(500).send("Error al enviar el correo.");
    } else {
      console.log(response);
      res.send("Correo enviado correctamente.");
    }
    smtpTransport.close();
  });
});





//CORS middleware
app.use(function (req, res, next) {
  //Enabling CORS
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization"
  );
  next();
});

const mc = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "tattoores",
});
mc.connect();

//Login

app.post("/login", (req, res) => {
  let CorreoElectronico = req.body.CorreoElectronico;
  let Contrasenia = req.body.Contrasenia;

  mc.query("SELECT * FROM usuario WHERE CorreoElectronico= ?",CorreoElectronico,function (err, results, fields) {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: "Error al buscar usuario",
          errors: err,
        });
      }
      if (!results.length) {
        return res.status(400).json({
          ok: false,
          mensaje: "Credenciales incorrectas - email",
          errors: err,
        });
      }
      
      
        if(results[0].Contrasenia == Contrasenia){
          return res.status(200).json({
            ok:true,
            mensaje: "Usuario logueado correctamente",
            data: results,
            errors: err
          })
        }else{
          return res.status(400).json({
            ok:false,
            mensaje: "Credenciales incorrectas - password",
            errors: err
          })
          console.log('no');
          console.log(results[0].Contrasenia);
          
        }
        
      
      

      
      /* if(!bcrypt.compareSync(body.password,results[0].userPassword)){
      return res.status(400).json({
        ok:false, mensaje: 'Credenciales incorrectas - password', errors:err
      });
     */
      //crear un token
      let SEED = "esta-es-una-semilla";
      let token = jwt.sign({ usuario: results[0].userPassword }, SEED, {
        expiresIn: 14400,
      });
      res.status(200).json({
        ok: true,
        usuario: results,
        id: results[0].userId,
        token: token,
      });
    }
  );
});

/* app.use('/', (req, res, next) => {
  let token = req.query.token;
  let SEED = "esta-es-una-semilla";
  console.log(token);
  jwt.verify(token, SEED, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        ok: false,
        mensaje: "Token incorrecto",
        errors: err,
      });
    }
    req.usuario = decoded.usuario;
    next();
  });
}); */

//Reserva
app.post("/reservas", function (req, res) {
  let datosReserva = {
    //productId: 0 autoincremental
    FechaInicio: req.body.FechaInicio,
    FechaFin: req.body.FechaFin,
    Comentario: req.body.Comentario,
    Descripción: req.body.Descripción,
    IdUsuario: req.body.IdUsuario,
    IdUsuarioT: req.body.IdUsuarioT,
    IdImagen: req.body.IdImagen,
    IdPago: req.body.IdPago
    
  };
  console.log("si llega 1 2 3 4 5 6")
  console.log("si llega 1 2 3 4 5 6")
  console.log("si llega 1 2 3 4 5 6")
  console.log("si llega 1 2 3 4 5 6")
  console.log("si llega 1 2 3 4 5 6")
  console.log("si llega 1 2 3 4 5 6")
  console.log("si llega 1 2 3 4 5 6")
  console.log("si llega 1 2 3 4 5 6")
  if (mc) {
    mc.query(
      "INSERT INTO reservas SET ?",
      datosReserva,
      function (error, results) {
        if (error) {
          console.log("no funciona")
          res.status(500).json({ Mensaje: error });
        } else {
          res.status(201).json({ Mensaje: "Reserva creado correctamente" });
          console.log("Si funciona")
        }
      }
    );
  }
});


// Get Reservas


//Registrar usuario
app.post("/usuario/:id", function (req, res) {
    let datosUsuario = {
      Nombre: req.body.Nombre,
      Apellido: req.body.Apellido,
      Fotografia: 	req.body.Fotografia,
      CorreoElectronico: req.body.CorreoElectronico,
      Contrasenia: req.body.Contrasenia,
      Edad: req.body.Edad,
      Sexo: req.body.Sexo,
      IdRol: req.params.id,
    };

  if (mc) {
    mc.query(
      "INSERT INTO usuario SET ?",
      datosUsuario,
      function (err, result) {
        if (err) {
          return res.status(400).json({
            ok: false,
            mensaje: "Error al crear usuario",
            errors: err,
          });
        } else {
          return res.status(201).json({
            ok: true,
          });
        }
      }
    );
  }
});
//Recuperar todos los productos
app.get("/reserva", function (req, res) {
  mc.query("SELECT * FROM reservas", function (error, results, fields) {
    if (error) throw error;
    return res.send({
      error: false,
      data: results,
      mensaje: "Lista de reservas",
    });
  });
});


/////////////////////////////////////////////////////////////
//HOME
/////////////////////////////////////////////////////////////

//CLiente
/*
GET = información de todos los tatuadores.
GET = información de portafolio de un tatuador en específico.
-Obteniendo el id del tatuador
-retorna Todas las fotografías perteneceisntes al portafolio.
Get = información de todos los tatuajes destacados.
*/


//Tatuador
/*
Todas las anteriores
POST = Crear portafolio propio
POST = agregar tatuaje a portafolio propio
DELETE = eliminar tatuaje del portafolio propio
*/


//Administrador
/*
Todas las anteriores (las peticiones de tatuadores son para todos los tatuadores)
Get = información de todos los tatuajes no destacados.
PUT = agregar tatuaje/ descripción de tatuaje realizado.
PUT = eliminar tatuaje/ descripción de tatuaje realizado.
PUT = editar tatuaje/ descripción de tatuaje realizado.
*/

/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////// CLiente
//GET = información de todos los tatuadores.
app.get('/Tatuadores', function (req, res) {
  mc.query('SELECT IdUsuario, Nombre, Apellido, AniosExperiencia, Fotografia FROM usuario WHERE usuario.idRol = 2', function (error, results, fields) {
      if (error) throw error;
      return res.send({
          error: false,
          data: results,
          message: 'Lista de tatuadores.'
      });
  });
});

//DELETE = información de las especialidad de los tatuadores.
app.get('/Tatuadores/especialidades/:id', function (req, res) {
  let id = req.params.id;
  if (mc) {

      mc.query("SELECT especialidad.NomEspecialidad FROM especialidad INNER JOIN especialidades ON especialidades.IdEspecialidad= especialidad.IdEspecialidad Where especialidades.IdUsuario = ?", id, function (error, results) {
        if (error) throw error;
        return res.send({
            error: false,
            data: results,
            message: 'Lista especialidades de tatuadores.'
        });
    });
  }
});

//GET = información de portafolio de un tatuador en específico.
app.get('/PortafolioTataudor/:id', (req, res, next) => {
  let id = req.params.id;
  mc.query("SELECT es.IdImagen, es.LinkImagen FROM usuario INNER JOIN ( SELECT portafolio.IdUsuarioT, imagenes.IdImagen,imagenes.LinkImagen FROM portafolio INNER JOIN imagenes ON portafolio.IdPortafolio= imagenes.IdPortafolio ) AS es ON es.IdUsuarioT = usuario.IdUsuario WHERE usuario.idRol = 2 AND usuario.IdUsuario = ?", id, function (err, result, fields) {
      return res.send({
          error: false,
          data: result,
          message: 'El portafolio existe.'
      });
  });
});


//GET = información de todos los tatuajes destacados.
app.get('/TatuajesDestacados', function (req, res) {
  mc.query('SELECT usuario.Nombre,usuario.Apellido,es.IdImagen,es.NomImagen,es.LinkImagen,es.Fecha,es.Descripcion FROM usuario INNER JOIN ( SELECT portafolio.IdUsuarioT,imagenes.IdImagen,imagenes.NomImagen,imagenes.LinkImagen,imagenes.Fecha,imagenes.Descripcion FROM imagenes INNER JOIN portafolio ON imagenes.IdPortafolio = portafolio.IdPortafolio WHERE imagenes.IdTipoImg = 2 ) AS es ON es.IdUsuarioT = usuario.IdUsuario WHERE usuario.IdRol=2', function (error, results, fields) {
      if (error) throw error;
      return res.send({
          error: false,
          data: results,
          message: 'Lista de tatuajes destacados.'
      });
  });
});



//////////////////////////////////////////////////////////////// Tatuador
//POST = Crear portafolio propio
app.post('/portafolio', function (req, res) {
  let datosPortafolio = {
    NomPortafolio:req.body.NomPortafolio,
    FechaPortafolio:req.body.FechaPortafolio,	
    IdUsuarioT:req.body.IdUsuarioT, 
  };

  if (mc) {
      mc.query("INSERT INTO portafolio SET ?", datosPortafolio, function (error, results) {
          if (error) {
              res.status(500).json({ "Mensaje": "Error" });
          }
          else {
              res.status(201).json({ "Mensaje": "Insertado" });
          }
      });
  }
});



//POST = agregar tatuaje a portafolio propio
app.post('/portafolio/Tatuaje', function (req, res) {
  let datosTatuajePortafolio = {
    NomImagen:req.body.NomImagen, 
    LinkImagen:req.body.LinkImagen, 
    Fecha:req.body.Fecha, 
    Descripcion:req.body.Descripcion, 
    IdPortafolio:req.body.IdPortafolio, 
    IdTipoImg:req.body.IdTipoImg,
  };
  console.log(datosTatuajePortafolio);
  if (mc) {
      mc.query("INSERT INTO imagenes SET ?", datosTatuajePortafolio, function (error, results) {
          if (error) {
              console.log(nofincona);
              res.status(500).json({ "Mensaje": "Error" });
          }
          else {
              res.status(201).json({ "Mensaje": "Insertado" });
          }
      });
  }
});



//DELETE = eliminar tatuaje del portafolio propio
app.delete('/portafolio/Tatuaje/:id', function (req, res) {
  let id = req.params.id;
  if (mc) {

      mc.query("DELETE FROM imagenes WHERE IdImagen = ?", id, function (error, results) {
          if (error) {
              return res.status(500).json({ "Mensaje": "Error" });
          }
          else {
              return res.status(200).json({ "Mensaje": "Fotografia de tatuaje con id= " + id + " Borrado" });
          }
      });
  }
});



//////////////////////////////////////////////////////////////// Administrador


//Get = información de las reservas
app.get('/TodasLasReservas', function (req, res) {
  mc.query('SELECT reservas.IdReserva, tatuador.Nombre AS Nombre_Tatuador, tatuador.Apellido AS Apellido_Tatuador, reservas.FechaInicio AS Fecha_Reserva, cliente.Nombre AS Nombre_Cliente, cliente.Apellido AS Apellido_Cliente, pago.Idpago, pago.Monto, pago.FechaPago FROM reservas JOIN (SELECT IdUsuario, Nombre, Apellido FROM usuario) AS tatuador ON reservas.IdUsuarioT = tatuador.IdUsuario JOIN (SELECT IdUsuario, Nombre, Apellido FROM usuario) AS cliente ON reservas.IdUsuario = cliente.IdUsuario JOIN (SELECT Idpago, FechaPago, Monto FROM pagos) AS pago ON reservas.IdPago = pago.IdPago', function (error, results, fields) {
      if (error) throw error;
      return res.send({
          error: false,
          data: results,
          message: 'Lista de tatuajes no destacados.'
      });
  });
});







//Get = información de todos los tatuajes no destacados.
app.get('/Tatuajes/NoDestacados', function (req, res) {
  mc.query('SELECT usuario.Nombre,usuario.Apellido,es.IdImagen,es.NomImagen,es.LinkImagen,es.Fecha,es.Descripcion FROM usuario INNER JOIN ( SELECT portafolio.IdUsuarioT,imagenes.IdImagen,imagenes.NomImagen,imagenes.LinkImagen,imagenes.Fecha,imagenes.Descripcion FROM imagenes INNER JOIN portafolio ON imagenes.IdPortafolio = portafolio.IdPortafolio WHERE imagenes.IdTipoImg = 1 ) AS es ON es.IdUsuarioT = usuario.IdUsuario WHERE usuario.IdRol=2', function (error, results, fields) {
      if (error) throw error;
      return res.send({
          error: false,
          data: results,
          message: 'Lista de tatuajes no destacados.'
      });
  });
});



//PUT = agregar tatuaje destacado/ descripción de tatuaje realizado.
app.put('/Tatuajes/DestacadosAgregar/:id', (req, res) => {
  let id = req.params.id;
  if (!id) {
      return res.status(400).send({ error: producto, message: 'Debe proveer un id de una fotografia de tatuajes' });
  }
  mc.query("UPDATE imagenes SET IdTipoImg=2 WHERE IdImagen = ?", id, function (error, results, fields) {
      if (error) throw error;
      return res.status(200).json({ "Mensaje": "Registro con id = " + id + " ha sido actualizado" });
  });
});



//PUT = eliminar tatuaje destacado/ descripción de tatuaje realizado.
app.put('/Tatuajes/DestacadosEliminar/:id', (req, res) => {
  let id = req.params.id;
  if (!id) {
      return res.status(400).send({ error: producto, message: 'Debe proveer un id de una fotografia de tatuajes' });
  }
  mc.query("UPDATE imagenes SET IdTipoImg=1 WHERE IdImagen = ?", id, function (error, results, fields) {
      if (error) throw error;
      return res.status(200).json({ "Mensaje": "Registro con id = " + id + " ha sido actualizado" });
  });
});



//PUT = editar tatuaje/ descripción de tatuaje realizado.
app.put('/Tatuajes/DestacadosEditar/:id', (req, res) => {
  let id = req.params.id;
  let Descripcion = req.params.Descripcion;

  if (!id || !Descripcion) {
      return res.status(400).send({ error: Descripcion, message: 'Debe proveer un id de una fotografia de tatuajes y una descripcion' });
  }
  mc.query("UPDATE imagenes SET Descripcion = ? WHERE IdImagen = ?", [Descripcion, id], function (error, results, fields) {
      if (error) throw error;
      return res.status(200).json({ "Mensaje": "Registro con id = " + id + " ha sido actualizado" });
  });
});




//PUT = editar tatuaje/ descripción de tatuaje realizado.



//PUT = agregar tatuaje destacado/ descripción de tatuaje realizado.
app.put('/Reservas/CambiarCosto/:costo', (req, res) => {
  let costo = req.params.costo;
  if (!costo) {
      return res.status(400).send({ error: producto, message: 'Debe proveer un id de una fotografia de tatuajes' });
  }
  mc.query("UPDATE CostoPago SET  costopago = ? WHERE IdCostoPago = 1", costo, function (error, results, fields) {
      if (error) throw error;
      return res.status(200).json({ "Mensaje": "Registro con id = " + costo + " ha sido actualizado" });
  });
});



//Get = obtner costo tarifa
app.get('/Reservas/Costo', function (req, res) {
  mc.query('SELECT CostoPago FROM costopago WHERE IdCostoPago = 1', function (error, results, fields) {
      if (error) throw error;
      return res.send({
        data: results,
      });
  });
});


//DELETE= eliminar tatuador
app.delete('/Tatuador/Eliminar/:id', (req, res) => {
  let id = req.params.id;

  mc.query("DELETE FROM usuario WHERE IdUsuario = ?", id, function (error, results, fields) {
      if (error) throw error;
      return res.status(200).json({ "Mensaje": "El tatuador con id = " + id + " ha sido eliminado" });
  });
});




//Rutass
app.get("/", (req, res, next) => {
  res.status(200).json({
    ok: true,
    mensaje: "Peticion realizada correctamente",
  });
});

app.listen(3000, () => {
  console.log("Express Server - puerto 3000 online");
});


