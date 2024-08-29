//Es necesario instalar en la carpeta del servidor los modulos cors y express


var rpc = require("./rpc.js"); //incorporamos la libreria

var mysql = require("mysql");
var database ={
  host:"localhost",
  user:"lopez huix",
  password:"mdlvahp",
  database :"datos",
  port:3306
};

var conexion = mysql.createConnection(database);
console.log("Conectando con la base de datos...");
conexion.connect(function(err){
    if(err){
        console.log("Se ha producido un error al conectar a la base de datos desde rpc",err);
        process.exit();
    }else{
        console.log("Base de datos conectada correctamente desde rpc!!!");
    }
});

//Función para hacer login del paciente
function login(codigoAcceso, callback) { //devuelve un objeto (por eso solo se usa find, si uso filter devuelve un array de objetos, en este caso devolveria un array de un objeto) 
    
  conexion.query("SELECT * FROM pacientes WHERE codigo_acceso = '" + codigoAcceso+"'", function(error, paciente){
    if(error){
        callback(null);
        console.log("No se ha podido hacer login");
    }
    else{
        if(paciente.length == 0){
            callback(null);
            console.log("No se ha encontrado al paciente")
        }
        else{
            callback(paciente[0]);
        }
    }
  })
  }

function listadoMedicamentos(callback){ //devuelve un array 
  conexion.query("SELECT * FROM medicamentos", function(error, medicamentos){
    if(error){
        callback(null);
        console.log("No se ha podido acceder a los medicamentos");
    }
    else{
        if(medicamentos.length == 0){
            callback(null);
            console.log("No se ha encontrado medicamentos")
        }
        else{
            callback(medicamentos);
        }
    }
  })
}

function medicacion(idPaciente, callback) { //devuelve un array 
  conexion.query("SELECT * FROM medicaciones WHERE paciente = " + idPaciente, function(error, medicacion){
    if(error){
        callback(null);
        console.log("No se ha podido acceder a las medicaciones");
    }
    else{
        if(medicacion.length == 0){
            callback(null);
            console.log("No se ha encontrado medicacion")
        }
        else{
            callback(medicacion);
        }
    }
  })

  }

function listadoTomas(idPaciente, idMedicamento, callback) { //devuelve un array 
  conexion.query("SELECT * FROM tomas WHERE paciente = " + idPaciente+" and medicamento="+idMedicamento, function(error, tomas){
    if(error){
        callback(null);
        console.log("No se ha podido acceder a las tomas");
    }
    else{
      callback(tomas);
    }
  })

  }

  function codigobarras(codigoBarras, idP, callback) {
    conexion.query("SELECT * FROM medicamentos WHERE codigo_barras = '" + codigoBarras + "'", function (error, medicamento) {
        if (error || medicamento.length==0) {
            callback("No existe el medicamento en la base de datos");
            console.log("No se ha podido acceder a los medicamentos");
            return;
        }
        conexion.query("SELECT * FROM medicaciones WHERE medicamento = " + medicamento[0].id + " and paciente=" + idP, function (error, medicacion) {
            if (error || medicacion.length == 0) {
                callback("No existe la medicacion para ese paciente y ese medicamento");
                console.log("No hay paciente con esa medicacion");
                return;
            }
            callback(true);
            console.log("Hay paciente con esa medicacion asignada");
            agregarToma(idP, medicamento[0].id, function(resultado) {});
        });
    });
}


  function agregarToma(idPaciente, idMedicamento, callback) {
    var nuevaToma = {
      medicamento: idMedicamento,
      paciente: idPaciente,
      fecha: new Date().toISOString()
    };

    conexion.query("INSERT INTO `tomas`(`medicamento`, `paciente`, `fecha`) VALUES ('"+ nuevaToma.medicamento+"','" +nuevaToma.paciente+"','" +nuevaToma.fecha+"')", function(error, tomaN){
      if(error){
          callback(null);
          console.log("No se ha podido agregar toma");
      }
      else{
          if(tomaN.length == 0){
              callback(null);
              console.log("No se ha agregado toma")
          }
          else{
              callback(tomaN[0]);
          }
      }
    })
  }

  function eliminarToma(idPaciente, idMedicamento, fecha, callback) {
    conexion.query("DELETE FROM `tomas` WHERE paciente='"+idPaciente+"' and medicamento='"+idMedicamento+"' and fecha='"+fecha+"'", function(error){
      if(error){
          callback(false);
          console.log("No se ha podido borrar la toma");
      }
      else{
        callback(true);
      }
    })
  }

var servidor = rpc.server(); // crear el servidor RPC
var app = servidor.createApp("gestion_pacientes"); // crear aplicación de RPC

function datosMedico(idMedico, callback){
  conexion.query("SELECT id, nombre, apellidos FROM medicos WHERE id = " + idMedico, function(error, infoMedico){
      if(error){
          callback(null);
          console.log("No se han podido mostrar los datos del médico");
      }
      else{
          if(infoMedico.length == 0){
              callback(null);
              console.log("No se ha encontrado al médico")
          }
          else{
              callback(infoMedico[0]);
          }
      }
  })
}
//////////////////////////////////////////////////////////////////////////////////////
//PRACTICA 3
//Funcion que devuelve todas las tomas de un paciente
function todasTomas(idPaciente, callback) { //devuelve un array 
  conexion.query("SELECT * FROM tomas WHERE paciente = " + idPaciente, function(error, tomas){
    if(error){
        callback(null);
        console.log("No se ha podido acceder a las tomas");
    }
    else{
      callback(tomas);
    }
  })

  }

//Registramos los procedimientos
app.registerAsync(login);
app.registerAsync(listadoMedicamentos);
//app.register(datosMedico);
app.registerAsync(medicacion);
app.registerAsync(listadoTomas);
app.registerAsync(agregarToma);
app.registerAsync(eliminarToma);
app.registerAsync(datosMedico);
app.registerAsync(codigobarras);
app.registerAsync(todasTomas);

