//MAIN PACIENTE
//Vinculamos cliente - servidor. Obtener una referencia a la app RPC (instancia de la aplicación gestion pacientes del servidor localhost)
var app = rpc("localhost", "gestion_pacientes");

//Obtener referencias a los procedimientos remotos registrados por el servidor.
var login = app.procedure("login");
var listadoMedicamentos = app.procedure("listadoMedicamentos");
var datosMedico = app.procedure("datosMedico");
var medicacion = app.procedure("medicacion");
var listadoTomas = app.procedure("listadoTomas");
var eliminarToma = app.procedure("eliminarToma");
var agregarToma = app.procedure("agregarToma");
var todasTomas = app.procedure("todasTomas");
//?var enviarDatosMedicacion = app.procedure("enviarDatosMedicacion");

//Primera pagina
var conexion;

// Función de cerrarConexion
function cerrarConexion() {
  if(conexion) {
    conexion.close();
    console.log("La conexión WebSocket ha sido cerrada.");
    document.getElementById('chatPaciente').innerHTML = "";  // Línea agregada para limpiar el chat

  } else {
    console.log("La conexión WebSocket ya está cerrada o nunca fue abierta.");
  }
}
function log() {
  var codigoAcceso = document.getElementById("cod").value;
  login(codigoAcceso, function(pac) {
    if (pac == null) {
      alert("El código no es correcto");
      return;
    }
    cambiarSeccion('bienvenido');
    idM = "";
    cargar(pac);
    //SOCKET
    conexion = new WebSocket("ws://localhost:4444", "pacientes");
    // Connection opened
    conexion.addEventListener('open', function (event) {
      console.log("Paciente con id: " + pac.id + " conectado!!!");
      identificacion(pac.id);

      // Listen for messages
    conexion.addEventListener('message', function (event) {
      console.log("Mensaje del servidor:", event.data);
      var mensajeRecibido = JSON.parse(event.data);
      var chatPaciente = document.getElementById('chatPaciente');
      if (mensajeRecibido.message) {
        var today = new Date();
        var now = today.toLocaleString();// obtener la fecha y la hora
        if(mensajeRecibido.operacion=="mensajeEscrito"){
          chatPaciente.innerHTML += "<li id=\"mensajeMedico\"><strong>["+now+"] Médico: </strong>"+ mensajeRecibido.message+"</li>";
        }
        else{
          chatPaciente.innerHTML += "<li id=\"mensajePaciente\"><strong>["+now+"] Tú :</strong> "+ mensajeRecibido.message+"</li>";
        }
      }
    });
    function identificacion(idPaciente) {
      conexion.send(JSON.stringify({ operacion: "identificacion", tipo: "PAC", id: idPaciente ,idMedico:pac.medico}));
    }

  });
  }
  )}

var patient;
//Segunda pagina
function cargar(pac) {
  patient=pac;//Para practica 3 TELEMEDICINA
  datosMedico(pac.medico, function(med) {
    var lista = document.getElementById("datos_paciente");
    lista.innerHTML = "<h2>¡Bienvenido/a " + pac.nombre + " " + pac.apellidos + "!</h2><br><p><b>Médico:</b> " + med.nombre + " " + med.apellidos + "</p><p><b>Observación del médico:</b> " + pac.observaciones + "</p>";
    medicacion(pac.id, function(medicaciones) {//array con las medicaciones del paciente
      listadoMedicamentos(function(medicamentos) {//array de todos los medicamentos
        var list = document.getElementById("lista_medicamentos");
        list.innerHTML="";
        console.log(medicaciones);
        if(medicaciones.length==0){
          list.innerHTML="<p>No tiene que tomar ninguna medicación</p><br>";
        }
        else{
          medicaciones.forEach(function (medicacion){
          var medicamento = medicamentos.find(m => m.id == medicacion.medicamento);
          var frecuencia = medicacion.frecuencia;
          var color = "red";
          var hoy = new Date();
          var diasPasados;
          listadoTomas(pac.id, medicamento.id, function(tomas){
            for(var k = 0; k < tomas.length; k++){
              var tiempoPasado = hoy - new Date(tomas[k].fecha); //tiempo transcurrido en ms
              diasPasados = tiempoPasado / (24 * 60 * 60 * 1000); //tiempo transcurrido en días
            }
            if(frecuencia==0){
              color="green";
              if (tomas.length==0){
                color="red";
              }
            }
            else if(diasPasados < frecuencia){
              color = "green";
            }
            else{
              color="red";
            }
            if(medicacion.frecuencia==1){medicacion.frecuencia="Tomar cada día"};
            if(medicacion.frecuencia==2){medicacion.frecuencia="Tomar cada 2 días"};
            if(medicacion.frecuencia==0.5){medicacion.frecuencia="Tomar 2 veces al día"};
            if(medicacion.frecuencia==0.25){medicacion.frecuencia="Tomar 4 veces al día"};
            if(medicacion.frecuencia==0){medicacion.frecuencia="Usar para tomas únicas"};
            list.innerHTML +="<br><li> <details><summary><b><span style='color:" + color + "'>" + medicamento.nombre + "</span></b>  <ul><li><button onclick=\"cambiarSeccion('ver_tomas');verTomas('" + medicamento.nombre + "'," + pac.id + "," + medicamento.id+")\"> Ver tomas </button></li> <li><button onclick=\"masMedicacion('" + medicamento.nombre + "', " + pac.medico + ", " + pac.id + ")\">No tengo más medicación</button></li> <li><button onclick=\"sientaMal('" + medicamento.nombre + "', " + pac.medico + ", " + pac.id + ")\">Me sienta mal</button></li></ul></summary><p>Descripción del medicamento: "+medicamento.descripcion+"</p><p>Fecha de asignación: "+medicacion.fecha_asignacion+"</p><p>Dosis por toma: "+medicacion.dosis+" comprimido/s</p><p>Frecuencia: "+medicacion.frecuencia+"</p><p>Mensaje del médico: "+medicacion.observaciones+"</p></details></li>";
      

            //pedir.innerHTML = "<h1>CHAT</h1><ul id=\"chatPaciente\"></ul>";
            //<input id=\"mensaje_texto\" type=\"text\" /><button onclick=\"saludar(" + pac.medico + ", " + pac.id + ")\">Enviar</button><br></br>";
          });
        
        }); 
        }
        
      var pedir = document.getElementById("pedir_cita");
      pedir.innerHTML = "Solicitar cita para el día: <input id=\"fecha_cita\" type=\"date\"/><button onclick=\"solicitarCita(" + pac.medico + ", " + pac.id + ")\">Pedir cita a mi médico</button>";
            
    });
  });
})
}

//SOCKET
function masMedicacion(medicamen,idMed,idPac){
  conexion.send(JSON.stringify({
    operacion:"masMedicacion",
      medicamento:medicamen,
      idMedico:idMed,
      idPaciente:idPac
  }))
  //console.log('Mas medicacion medico: '+idMed+' Paciente: '+idPac);
}

function sientaMal(medicamen,idMed,idPac){
  conexion.send(JSON.stringify({
    operacion:"sientaMal",
    medicamento:medicamen,
    idMedico:idMed,
    idPaciente:idPac
}))
}

function solicitarCita(idMed,idPac) {
  var fecha_cita = document.getElementById('fecha_cita').value;
  pedirCita(idMed,idPac, fecha_cita);
}

function pedirCita(idMed, idPac, fecha_cita) {
  conexion.send(JSON.stringify({
    operacion: "pedirCita",
    fecha_cita: fecha_cita,
    idMedico: idMed,
    idPaciente: idPac
  }))
}
/*
function saludar(idMed,idPac){
  var mensaje = document.getElementById('mensaje_texto').value;
  conexion.send(JSON.stringify({
      operacion:"mensajeEscrito",
      mensaje:mensaje,
      idMedico:idMed,
      idPaciente:idPac
  }))
}
*/

//Tercera pagina

function verTomas(nombreMedicamento, idPaciente, idMedicamento) {
  var tomasElement = document.getElementById("tomas");
  listadoTomas(idPaciente, idMedicamento, function(toma) {
    tomasElement.innerHTML = "<h2>Tomas de " + nombreMedicamento + ": </h2>";
    tomasElement.innerHTML +="<button onclick=\"agregarToma("+idPaciente+","+idMedicamento+");verTomas('"+nombreMedicamento+"', "+idPaciente+", "+idMedicamento+")\"> Nueva toma </button>";   
    for (var i = 0; i < toma.length; i++) {
      var fecha = new Date(toma[i].fecha);
      var dia = fecha.getDate();
      var mes = fecha.getMonth() + 1;
      var año = fecha.getFullYear();
      var hora = fecha.getHours().toString().padStart(2, '0'); //Si tiene menos de dos dígitos añade un 0 a la izquierda
      var minutos = fecha.getMinutes().toString().padStart(2, '0');
      var segundos = fecha.getSeconds().toString().padStart(2, '0');
      var fechaFormateada = dia + '/' + mes + '/' + año;
      var horaFormateada = hora + ':' + minutos + ':' + segundos;
      tomasElement.innerHTML += "<li><b>Día:</b> " + fechaFormateada + " <b>Hora:</b> " + horaFormateada + "<button onclick=\"eliminarToma(" + idPaciente + " ," + idMedicamento + ",'" + toma[i].fecha + "'),verTomas('"+nombreMedicamento+"',"+idPaciente+","+idMedicamento+")\">Eliminar toma </button></li>";
    }
  });
}

/////////////////////////////////////////////////////////////////////////////////////
//PRACTICA 3
function enviarDatosMedicacion() {
  todasTomas(patient.id, function(tomas) {
    if (!tomas) {
      console.error("No se han recibido tomas.");
      return;
    }
    var fechaSubida = new Date().toISOString().split('T')[0];
    var InfoTomas = [];
    listadoMedicamentos(function(medicamentos){
      for(var toma of tomas) {
        var medicamento = medicamentos.find(m => m.id == toma.medicamento);//Lo guarda si coincide el id del medicamento con el medicamento de la toma
        var fecha = new Date(toma.fecha);
        var fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()} ${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}:${fecha.getSeconds().toString().padStart(2, '0')}`;
        InfoTomas.push({
          "paciente": patient.nombre,
          "medicamento": medicamento.nombre,
          "fecha": fechaFormateada
        })
      }
      var datos = {
        id_area: "7",
        fecha: fechaSubida,
        datos: InfoTomas
      };
      rest.post("https://undefined.ua.es/telemedicina/api/datos", datos, function(estado, respuestaTexto) {
        if (estado != 201) {
          console.error("Error al enviar datos:", respuestaTexto);
        } else {
          console.log("Datos enviados con éxito, envio número:", respuestaTexto);
        }
      });
    });
  });
}


  






