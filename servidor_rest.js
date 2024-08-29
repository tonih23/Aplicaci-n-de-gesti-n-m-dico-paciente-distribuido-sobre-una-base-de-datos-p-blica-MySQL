//var express = require("express");
//var app = express();
//app.use(express.json());
var jwt = require('jwt-simple');
var mysql = require("mysql");
const { exec } = require('child_process');

var database ={
    host:"localhost",
    user:"lopez huix",
    password:"mdlvahp",
    database :"datos",
    port:3306
};
var clave = 'miSecreto';

var conexion = mysql.createConnection(database);
console.log("Conectando con la base de datos...");
conexion.connect(function(err){
    if(err){
        console.log("Se ha producido un error al conectar a la base de datos desde rest",err);
        process.exit();
    }else{
        console.log("Base de datos conectada correctamente desde rest!!!");
    }
});


var express = require("express");   //¿¿?Enseñarle donde tengo guarado lo ficheros, como sabe que index coger, que rest y que main coger?
var app = express();
app.use("/apiMedico", express.static("cliente_rest")); //Me coge de la carpeta "cliente_rest" todos los recuersos estáticos (html, una foto...). Esto hace que me coja el index.html .Me coge el index.html y no la foto ua.jpg porque por defecto coge siempre el html. 
app.use("/apiCliente", express.static("cliente_rpc"));
app.use(express.json());                           //Para ver la foto es localhost:3000/apiCliente/ua.jpg

  
const loggedUsers = {};

app.post('/api/medico/login', function(req, res) { 
    var credenciales = {
        login: req.body.login,
        password: req.body.password                   
    }
    var sql = "SELECT * FROM medicos WHERE login = " + credenciales.login + " and password = "+ credenciales.password;
    conexion.query(sql,function(err,medico){
      console.log(medico);
      if(err){
        console.log("Error al realizar la select",err);
        res.status(500).json("El médico no se encuentra en la base de datos"); //servidor al cliente hago un res.
      }else{
        // Solo ejecuta el exec si el usuario no ha iniciado sesión previamente
        if (!loggedUsers[credenciales.login]) {//Si es false , abre la pagina
          exec('start https://www.aemps.gob.es/');
          loggedUsers[credenciales.login] = true; // Marcar como ya loggeado
        }

        var contenido = {
            usuario: medico[0].id,
            expira: Date.now() + 60 * 60 * 1000 // expira dentro de 1 hora (en ms)
        };
        var token = jwt.encode(contenido, clave);
        console.log(token);
        res.status(201).json({token:token,idMedico:contenido.usuario});
      }
    });
});


// Antes de este use, los servicios son públicos (no necesitan token)
// Con esta función intermedia validamos el token. Si no es correcto terminamos con un error. Si es correcto continuamos.
app.use("/api", function (req, res, next) {
    var token = req.query.token; // obtengo el token de una query de la URL: http://MI_SERVIDOR/MI_RUTA?token=XXXXXXXX
   
    if (!token) { // no se ha pasado un token
        res.status(301).json("No se ha encontrado token");
        return;
    }
    // Decodificar el token
    try { // capturamos el error por si el token no es correcto
        var contenidoToken = jwt.decode(token, clave); // decodificamos el token para obtener su contenido con la misma clave que se codificó
    } catch (error) {
        res.status(301).json("El token es incorrecto");
        return;
    }
    console.log("El contenido del token es:", contenidoToken);
    // Validar el token
    if (!contenidoToken || !contenidoToken.expira || !contenidoToken.usuario) { // validamos el formato del token
        res.status(301).json("El formato del token no es adecuado")
        return;
    }
    // Comprobar la fecha de expiración
    if (contenidoToken.expira < Date.now()) {
        res.status(301).json("El token ha expirado");
        return
    }
    // Todo ha ido bien. con next hago que express continue con el procesado
    next();
});


// Servicio para obtener todos los medicamentos / BIEN
app.get("/api/medicamento", function(req, res) {
    var sql = "SELECT * FROM medicamentos";
    conexion.query(sql,function(err,medica){
      if(err){
        console.log("Error al realizar la select",err);
        res.status(500).json("Error al realizar la consulta"); //servidor al cliente hago un res.
      }else{
          res.json(medica);
      }
    })
    });

  // Servicio para obtener los datos de un paciente / BIEN  -->pero si busco un paciente nuevo creado no me sale , me dice "El id del paciente no existe" . Esto con el postman
  app.get('/api/paciente/:id', function(req, res){
    var id = req.params.id;
    // Using parameterized query to avoid SQL injection
    var sql = "SELECT `id`, `nombre`, `apellidos`, `fecha_nacimiento`, `genero`, `medico`, `observaciones` FROM pacientes WHERE id = "+id;
    
    conexion.query(sql, function(err, paci) {
        if(err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error interno del servidor");
            return;
        }
        if(paci.length === 1) {
            console.log("Paciente:", paci[0]);
            res.status(200).json(paci[0]);
        } else {
            console.log("No se ha encontrado el paciente con id:", id);
            res.status(404).json("No se han encontrado el paciente");
        }
    });
});

  
  // Servicio para obtener los datos de un médico / BIEN
  app.get('/api/medico/:id', function(req, res){
    var medicoId = req.params.id;
    // La consulta SQL obtiene el médico con un ID específico
    var sql = "SELECT * FROM medicos WHERE id = " + medicoId;
    conexion.query(sql, function(err, medico) {
        if (err) {
            console.log("Error al realizar la consulta", err);
            res.status(500).json("Error al realizar la consulta");
            return;
        } else {
            if (medico.length === 1) {
                console.log("Datos del médico: ", medico[0]);
                res.status(200).json(medico); // Devolvemos el objeto médico directamente (no un array)
            } else {
                console.log("No se encontró el médico con id:", medicoId);
                res.status(404).json("No se encontró el médico con ese ID");
            }
        }
    });
});

  // Servicio para obtener un array con los datos de sus pacientes / BIEN
  app.get('/api/medico/:id/pacientes', function(req, res) {
    var medicoId = req.params.id;

    // La consulta SQL obtiene todos los pacientes asociados a un médico con un ID específico
    var sql = "SELECT * FROM pacientes WHERE medico = " + medicoId;

    conexion.query(sql, function(err, pacientesDelMedico) {
        if (err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            if (pacientesDelMedico.length >= 1) {
                res.status(200).json(pacientesDelMedico);
            } else {
                console.log("No se encontraron pacientes para el médico con id:", medicoId);
                res.status(404).json("No se encontraron pacientes para este médico");
            }
        }
    });
  });

  // Servicio para crear un paciente / BIEN
app.post('/api/medico/:id/pacientes', function(req, res) {
  // Construcción del objeto paciente
  var pac = {
      nombre: req.body.nombre,                   
      apellidos: req.body.apellidos,              
      fecha_nacimiento: req.body.fecha_nacimiento,
      genero: req.body.genero,
      medico: req.body.medico,
      codigo_acceso: req.body.codigo_acceso,
      observaciones: req.body.observaciones 
  };
  // Consulta SQL para insertar el paciente usando concatenación
  var sql = "INSERT INTO pacientes (nombre, apellidos, fecha_nacimiento, genero, medico, codigo_acceso, observaciones) VALUES('" 
    + pac.nombre + "','" 
    + pac.apellidos + "','" 
    + pac.fecha_nacimiento + "','" 
    + pac.genero + "','" 
    + pac.medico + "','" 
    + pac.codigo_acceso + "','" 
    + pac.observaciones + "')";

  conexion.query(sql, function(err, resultado) {
      if (err) {
          console.log("Error al realizar la inserción", err);
          res.status(500).json("Error al agregar el paciente");
          return;
      } else {
          console.log("Paciente nuevo agregado con ID:", resultado.insertId);//Cuando se hace un INSERT siempre se hace el .insertId
          res.status(201).json("Paciente nuevo agregado con ID: " + resultado.insertId);
      }
  });
});

// Servicio para modificar los datos del paciente 
app.put("/api/paciente/:id", function (req, res) {
  var pacienteId = req.params.id; // Obtener el ID del paciente de los parámetros de la URL

  // Consulta SQL para actualizar el paciente usando concatenación
  var sql = "UPDATE pacientes SET " +
            "nombre = '" + req.body.nombre + "', " +
            "apellidos = '" + req.body.apellidos + "', " +
            "fecha_nacimiento = '" + req.body.fecha_nacimiento + "', " +
            "genero = '" + req.body.genero + "', " +
            //"medico = '" + req.body.medico + "', " +
            //"codigo_acceso = '" + req.body.codigo_acceso + "', " +
            "observaciones = '" + req.body.observaciones + "' " +
            "WHERE id = " + pacienteId;

  conexion.query(sql, function(err, resultado) {
      if (err) {
          console.log("Error al realizar la actualización", err);
          res.status(500).json("Error al modificar el paciente");
          return;
      } else {
          if (resultado.affectedRows == 1) {
              console.log("Paciente modificado con ID:", pacienteId);
              res.status(200).json("Paciente modificado");
          } else {
              console.log("No se encontró el paciente con ID:", pacienteId);
              res.status(404).json("No se encontró el paciente");
          }
      }
  });
});


// Servicio para crear una medicacion / 
app.post('/api/paciente/:id/medicacion', function(req, res) {
  var medicacionNueva = {
      medicamento: req.body.medicamento,
      paciente: req.params.id,   // Tomamos el id del paciente directamente de los parámetros de la URL                   
      fecha_asignacion: new Date().toISOString().slice(0,10),
      dosis: req.body.dosis,
      tomas: req.body.tomas,
      frecuencia: req.body.frecuencia,
      observaciones: req.body.observaciones
  };

  // Comprobar si la medicación ya está asignada
  var sqlCheck = "SELECT * FROM medicaciones WHERE medicamento = '" + medicacionNueva.medicamento + "' AND paciente = " + medicacionNueva.paciente;
  conexion.query(sqlCheck, function(err, resultado) {
      if (err) {
          console.log("Error al realizar la comprobación", err);
          res.status(500).json("Error al comprobar la medicación");
          return;
      }

      if (resultado.length > 0) {
          res.status(404).json("El paciente ya tiene esa medicación asignada");
          return;
      } else {
          // Consulta SQL para insertar la medicación usando concatenación
          var sql = "INSERT INTO medicaciones (medicamento, paciente, fecha_asignacion, dosis, tomas, frecuencia, observaciones) VALUES('" 
              + medicacionNueva.medicamento + "'," 
              + medicacionNueva.paciente + ",'" 
              + medicacionNueva.fecha_asignacion + "','" 
              + medicacionNueva.dosis + "','" 
              + medicacionNueva.tomas + "','" 
              + medicacionNueva.frecuencia + "','" 
              + medicacionNueva.observaciones + "')";

          conexion.query(sql, function(err, resultadoInsert) {
              if (err) {
                  console.log("Error al realizar la inserción", err);
                  res.status(500).json("Error al agregar la medicación");
                  return;
              } else {
                  res.status(201).json("Medicación nueva agregada");
              }
          });
      }
  });
});



// Servicio que devuelve array con la medicación de un paciente
app.get("/api/paciente/:id/medicacion", function(req, res) {
  var pacienteId = req.params.id;

  // Consulta SQL para obtener la medicación del paciente
  var sqlMedicacion = "SELECT * FROM medicaciones WHERE paciente = " + pacienteId;
  var sqlMedicamentos = "SELECT * FROM medicamentos";
  conexion.query(sqlMedicacion, function(err, medicacion) {
    if (err) {
          console.log("Error al obtener la medicación", err);
          res.status(500).json("Error al obtener la medicación");
          return;
      }
    conexion.query(sqlMedicamentos, function(err, medicamentos) {
        if (err) {
            console.log("Error al obtener la medicación", err);
            res.status(500).json("Error al obtener la medicación");
            return;
        }

      // Transformación de la frecuencia a texto legible
      for (var i = 0; i < medicacion.length; i++) { 
          if(medicacion[i].frecuencia == 1){ medicacion[i].frecuencia = "Tomar cada día"; }
          if(medicacion[i].frecuencia == 2){ medicacion[i].frecuencia = "Tomar cada 2 días"; }
          if(medicacion[i].frecuencia == 0.5){ medicacion[i].frecuencia = "Tomar 2 veces al día"; }
          if(medicacion[i].frecuencia == 0.25){ medicacion[i].frecuencia = "Tomar 4 veces al día"; }
          if(medicacion[i].frecuencia == 0){ medicacion[i].frecuencia = "Usar para tomas únicas"; }
      }
      console.log(medicacion);
      // Si no se encuentra medicación para el paciente
      if(medicacion.length === 0){
          res.status(404).json({ error: "No se ha encontrado medicación para el paciente o el paciente no existe." });
          return;
      }
      res.status(200).json({ medicacion: medicacion, medicamentos:medicamentos });
      return;
    });
  });
});




// Servicio que devuelve las tomas (array de tomas) de ese paciente (id) para un medicamento (idm). Osea 2 filtros / BIEN
app.get("/api/paciente/:id/medicacion/:idm", function(req, res) {
  var pacienteId = req.params.id;
  var medicamentoId = req.params.idm;

  // Consulta SQL para obtener las tomas que cumplan con ambos criterios: paciente y medicamento
  var sqlTomas = `SELECT * FROM tomas WHERE paciente = ${pacienteId} AND medicamento = ${medicamentoId}`;
  conexion.query(sqlTomas, function(err, tomasResultado) {
      if (err) {
          console.log("Error al obtener las tomas", err);
          res.status(500).json("Error al obtener las tomas");
          return;
      }

      // Verificación de que existan tomas para ese paciente y medicamento
      /*
      if (tomasResultado.length === 0) {
          res.status(404).json({ error: "No se ha encontrado tomas para ese paciente y medicamento" });
          return;
      }*/

      // Consulta adicional para obtener todos los medicamentos (aunque no estoy seguro de por qué lo necesitarías en esta función específica)
      var sqlMedicamentos = "SELECT * FROM medicamentos";
      conexion.query(sqlMedicamentos, function(err, medicamentosResultado) {
          if (err) {
              console.log("Error al obtener los medicamentos", err);
              res.status(500).json("Error al obtener los medicamentos");
              return;
          }

          res.status(200).json({ tomas: tomasResultado, medicamentos: medicamentosResultado });
          return;
      });
  });
});



  //EXAMEN//////////////////////////////////////////////////////////////////////////////////////////////////7
//http://localhost:3000/api/mostrarHospitales/IMED
/*
app.get('/api/mostrarHospitales/:nombreHospital', function(req, res){
    var nombreHospital = req.params.nombreHospital;
    console.log(nombreHospital)
    var sql = "SELECT id FROM hospi WHERE hospital = '"+ nombreHospital +"'";
    conexion.query(sql, function(err, idH) {
        if(err) {
            console.log("Error al realizar EL PRIMER select", err);
            res.status(500).json("Error interno del servidor");
            return;
        }
        else {
            console.log(idH[0].id) 
            var sql2 = "SELECT nombre,apellidos FROM medicos WHERE hospital = "+idH[0].id;
            conexion.query(sql2, function(err, nombresMed) {
                if(err) {
                    console.log("Error al realizar EL SEGUNDO select", err);
                    res.status(500).json("Error interno del servidor");
                    return;
                }
                 else {
                    console.log("Medicos: ", nombresMed);
                    res.status(200).json(nombresMed);
                }
            })
        }
    });
});
*/
app.listen(3000);