//MAIN MEDICO

var x;
var conexion;
var token;
// Función de cerrarConexion
function cerrarConexion() {
    if(conexion) {
      conexion.close();
      console.log("La conexión WebSocket ha sido cerrada.");
      document.getElementById('chatMedico').innerHTML = "";  // Línea agregada para limpiar el chat

    } else {
      console.log("La conexión WebSocket ya está cerrada o nunca fue abierta.");
    }
  }
function loginMedico() { //POST realiza un login para médico
    var credenciales={
        login: document.getElementById("user").value,
        password: document.getElementById("password").value
    }
    if (credenciales.login === "" || credenciales.password === "" ) {
        alert("Hay campos vacíos");
        return;
      }
    rest.post("/api/medico/login", credenciales, function(estado, respuesta){
        if (estado!=201){
            alert("Usuario o contraseña incorrectos");
            return
        }
            var idMedico=respuesta.idMedico;
            token=respuesta.token;
            console.log(idMedico);
            console.log(token);
            datosMedico(idMedico);
            pacientesMedico(idMedico);
            cambiarSeccion("menu-principal");
            contadorTomas();
            contadorTomasI();
            //SOCKET
            conexion = new WebSocket("ws://localhost:4444", "medicos");
            // Connection opened
            conexion.addEventListener('open', function (event) {
                console.log("Medico con id: " , idMedico , " conectado!!!");
                identificacion(idMedico);
              
            // Listen for messages
            conexion.addEventListener('message', function (event) {
                var mensajeRecibido = JSON.parse(event.data);
                console.log("Mensaje del servidor:", event.data);
                var chatMedico = document.getElementById('chatMedico');
                var today = new Date();
                var now = today.toLocaleString();// obtener la fecha y la hora
                if (mensajeRecibido.message) {
                    if(mensajeRecibido.operacion=="mensajeEscrito"){
                        chatMedico.innerHTML += "<li id=\"mensajeMedico\"><strong>["+now+"] Para "+mensajeRecibido.nombrePaciente+":</strong> "+ mensajeRecibido.message+"</li>";
                    }
                    else{
                        chatMedico.innerHTML += "<li id=\"mensajePaciente\"><strong>["+now+"] "+mensajeRecibido.nombrePaciente+":</strong> "+ mensajeRecibido.message+"</li>";
                    }
                }
            });
            function identificacion(idMedico) {
            conexion.send(JSON.stringify({ operacion: "identificacion", tipo: "MED", id: idMedico }));
            }

              
            x=idMedico;
        });
    })
}

function medicamentos(){ //GET obtiene un array con los medicamentos
    rest.get("/api/medicamento?token="+token, function(estado, medicamentos) {
        if (estado != 200){
            alert("Error cargando la lista de medicamentos");
            return;
        }
        var list = document.getElementById("posibles_medicamentos");
        list.innerHTML="<option selected=\"selected\">Seleccione el medicamento</option>";
        for (var i = 0; i < medicamentos.length; i++) {
            list.innerHTML += "<option value="+medicamentos[i].id+">"+medicamentos[i].nombre+"</option>";
        }
    });
}

function saludar(){
    var mensaje = document.getElementById('mensaje_texto').value;
    conexion.send(JSON.stringify({
        operacion:"mensajeEscrito",
        mensaje:mensaje,
        idMedico:idMed,
        idPaciente:idPac
    }))
    //console.log('Mas medicacion medico: '+idMed+' Paciente: '+idPac);
  }

var r; //id del paciente
function datosPaciente(idPaciente) {
    rest.get("/api/paciente/" + idPaciente+"?token="+token, function(estado, paciente) {
        console.log(estado);
        if(estado==200){
            var lista = document.getElementById("info_paciente");
            lista.innerHTML = "";
            lista.innerHTML += "<li><p>Nombre: " + paciente.nombre + " " + paciente.apellidos + " </p><p>Nacimiento: " + paciente.fecha_nacimiento +"</p><p>Género: " + paciente.genero +"</p><p>Observaciones: " + paciente.observaciones +"</p></li>";
            r = paciente.id;
        }
        else {
            alert("Error cargando los datos del paciente");
            return;
        }
    });
}

function datosMedico(idMedico){ //GET mostrar los datos del médico sin la contraseña
    rest.get("/api/medico/"+idMedico+"?token="+token, function(estado, datosMedico){
        console.log(estado);
        if (estado != 200) {
            alert("Error cargando los datos del médico");
            return;
        }
        var lista=document.getElementById("datos_medico");
        for(var i=0;i<datosMedico.length;i++){
            lista.innerHTML = "<b>" + datosMedico[0].nombre + " " + datosMedico[0].apellidos + "</b>";
        }
    });
}

function pacientesMedico(idMedico){ //GET array con los datos de los pacientes de un médico
    rest.get("/api/medico/"+idMedico+"/pacientes?token="+token, function(estado, pacientes){
        if (estado != 200) {
            alert("Error cargando los datos de los pacientos");
            return;
        }
        var lista=document.getElementById("datos_pacientes");
        lista.innerHTML="";                                                                                                                                                                                                                //" <button onclick='infoPaciente(" + pacientes[i].id + ")'>Info</button></li>";  //<button onclick="cambiarSeccion('añadir-paciente')"> Añadir paciente</button>                                             
        for(var i=0;i<pacientes.length;i++){                                                                                                                                                                                                       //<button onclick='cambiarSeccion('añadir-paciente')'> Añadir paciente</button>
            lista.innerHTML += "<li>"+ pacientes[i].nombre + " " + pacientes[i].apellidos + "  <button onclick='datosPaciente(" + pacientes[i].id + ");medicacionPaciente(" + pacientes[i].id + ");cambiarSeccion(\"informacion-paciente\")'>Info</button></li>";    
        } 
        //lista.innerHTML = "<h1>CHAT</h1><ul id=\"chatMedico\"></ul><input id=\"mensaje_texto\" type=\"text\" /><button onclick=\"saludar(" + pac.medico + ", " + pac.id + ")\">Enviar</button><br></br>";
              
    });



    //los pacientes del medico tienen que ponerse por individual 
}


function nuevoPaciente() {
    var pac = {
      nombre: document.getElementById("nuevo_nombre").value,
      apellidos: document.getElementById("nuevo_apellidos").value,
      fecha_nacimiento: document.getElementById("nueva_fecha").value,
      genero: document.getElementById("select_género").value,
      medico: x,
      codigo_acceso: document.getElementById("nuevo_codigo").value,
      observaciones: document.getElementById("nuevo_observaciones").value
    };
    if (pac.nombre === "" || pac.apellidos === "" || pac.fecha_nacimiento === "" || pac.genero === "Seleccione el sexo" || pac.codigo_acceso === ""|| pac.observaciones === "") {
      alert("Debe completar todos los campos");
      return ;
    } else {
      rest.post("/api/medico/"+x+"/pacientes?token="+token, pac, function(estado, Listapacientes){
        if (estado != 201) {
          alert("Error al crear el paciente. El médico no existe");
          return;
        } else {
          datosMedico(x);
          pacientesMedico(x);
          cambiarSeccion('menu-principal');
        }
      });
     
    }
  }
function CambiarDatosPaciente() {
    var pac = {
        id: r,
        nombre: document.getElementById("nombre_modificado").value,
        apellidos: document.getElementById("apellidos_modificado").value,
        fecha_nacimiento: document.getElementById("fecha_modificado").value,
        genero: document.getElementById("género_modificado").value,
        observaciones: document.getElementById("observaciones_modificado").value
    };
    if (pac.nombre === "" || pac.apellidos === "" || pac.fecha_nacimiento === "" || pac.genero === "Seleccione el sexo" ||  pac.observaciones === "") {
        alert("Debe completar todos los campos");
        return;
      }
    rest.put("/api/paciente/" + r+"?token="+token, pac, function(estado, Listapacientes) {
        if (estado != 200) {
            alert("Error al modificar los datos del paciente");
            return;
        }
        cambiarSeccion('informacion-paciente');
        datosPaciente(r);
        medicacionPaciente(r);
    });
}

function nuevaMedicacion(){ //POST crea una nueva medicacion a un paciente
    var medicacionNueva = {
        medicamento: document.getElementById("posibles_medicamentos").value,
        paciente: r,
        dosis: document.getElementById("dosis").value,
        tomas: document.getElementById("tomas").value,
        frecuencia: document.getElementById("frecuencia").value,
        observaciones: document.getElementById("observaciones_medicacion").value
    };
    if (medicacionNueva.medicamento === "Seleccione el medicamento" || medicacionNueva.dosis === "" || medicacionNueva.tomas === "" || medicacionNueva.frecuencia === "Seleccione la frecuencia" ||  medicacionNueva.observaciones === "") {
        alert("Debe completar todos los campos");
        return;
      }
    rest.post("/api/paciente/"+r+"/medicacion?token="+token, medicacionNueva, function(estado, respuesta){
        if (estado != 201) {
            alert(respuesta);
            return;
        }
        cambiarSeccion('informacion-paciente');
        datosPaciente(r);
        medicacionPaciente(r);
    });
}
function medicacionPaciente(idPaciente){ // GET obtiene un array con la medicación de un paciente
    rest.get("/api/paciente/"+idPaciente+"/medicacion?token="+token, function(estado, respuesta){
        var lista=document.getElementById("info_medicacion");
        lista.innerHTML="";
        if (estado != 200) {
            
            alert("Error cargando la medicacion del paciente");
            return;
        }
        var medicacion = respuesta.medicacion;
        var medicamentos = respuesta.medicamentos;
        
        for (var i = 0; i < medicacion.length; i++) { 
            var medicamento = medicamentos.find(m => m.id == medicacion[i].medicamento);
            if (medicamento) {
              IdMedicamento=medicacion[i].medicamento //Me guardo el id del medicamento antes de cambiarlo por el nombre
              medicacion[i].medicamento = medicamento.nombre;
            }
            var dosi="";
            if(medicacion[i].dosis==1 || medicacion[i].dosis==0){dosi="comprimido"}
            if(medicacion[i].dosis>1){dosi="comprimidos"}

            const opcionesDeFormato = {
                year: "numeric",
                month: "long", // Puedes usar "short" o "numeric" para abreviar o mostrar el número del mes
                day: "numeric",
                weekday: "long", // Puedes usar "short" para abreviar el día de la semana
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
              };
              
              var medicacionFecha = new Date(medicacion[i].fecha_asignacion); // Convierte la fecha a un objeto Date
              var medicacionFech = medicacionFecha.toLocaleDateString("es-ES", opcionesDeFormato);

            lista.innerHTML += "<li><p><strong>" + medicacion[i].medicamento+ "</strong> <button onclick='tomas("+ medicacion[i].paciente +","+ IdMedicamento +");cambiarSeccion(\"consultar-tomas\")'>Consultar tomas</button></p> <p>Fecha de Asignación: " + medicacionFech + "</p><p>Dosis: " + medicacion[i].dosis +" "+ dosi +" </p><p>Tomas: " + medicacion[i].tomas +"</p><p>Frecuencia: " + medicacion[i].frecuencia +"</p><p>Observaciones: " + medicacion[i].observaciones +"</p></li>";
        }
        //" <button onclick='infoPaciente(" + pacientes[i].id + ")'>Info</button></li>";  //<button onclick="cambiarSeccion('añadir-paciente')"> Añadir paciente</button>  
        var listita=document.getElementById("mensajito");
        //listita.innerHTML="<input id=\"mensaje_texto\" type=\"text\"/><button onclick=\"saludar("+x+","+idPaciente+")\">Enviar</button><br>";                                       
        listita.innerHTML = "<h3>Enviar mensaje</h3><p id=\"chatPaciente\"></p><input id=\"mensaje_texto\" type=\"text\" /><button onclick=\"saludar(" + x + ", " + idPaciente + ")\">Enviar</button><br></br>";
      
    });
}

function saludar(idMed,idPac){
    var mensaje = document.getElementById('mensaje_texto').value;
    conexion.send(JSON.stringify({
        operacion:"mensajeEscrito",
        mensaje:mensaje,
        idMedico:idMed,
        idPaciente:idPac
    }))
  }

  function tomas(IdPaciente, IdMedicamento) {
    rest.get("/api/paciente/" + IdPaciente + "/medicacion/" + IdMedicamento+"?token="+token, function(estado, respuesta) {
        if (estado != 200) {
            alert("Error cargando la lista de tomas");
            return;
        }
        var tomas = respuesta.tomas;
        var medicamentos = respuesta.medicamentos;
        var lista = document.getElementById("info_tomas");
        lista.innerHTML="<h2>Tomas realizadas de "+medicamentos[IdMedicamento-1].nombre+"</h2><br>";
        if(tomas.length==0){
            lista.innerHTML += "<p>El medicamento de "+medicamentos[IdMedicamento-1].nombre+" se le acaba de recetar al paciente recientemente, por lo que aun no hay tomas";
        }
        for (var i = 0; i < tomas.length; i++) {
            var fecha = new Date(tomas[i].fecha);
            var dia = (fecha.getDate() + 1).toString().padStart(2, '0');
            var mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
            var año = fecha.getFullYear();
            var hora = fecha.getHours().toString().padStart(2, '0');
            var minutos = fecha.getMinutes().toString().padStart(2, '0');
            var segundos = fecha.getSeconds().toString().padStart(2, '0');
            var fechaFormateada = dia + '/' + mes + '/' + año;
            var horaFormateada = hora + ':' + minutos + ':' + segundos;
            lista.innerHTML += "<li><p><strong>Toma "+(i+1)+" &rarr;</strong> " + fechaFormateada + " " + horaFormateada + "</p></li>";
        }
    });
}

function buscador() {
    var terminoBusqueda = document.getElementById("busqueda").value;
    rest.get("https://cima.aemps.es/cima/rest/medicamentos?nombre=" + terminoBusqueda, function(estado, respuestaTexto) {
        if (estado != 200) {
            alert("Error cargando los datos del medicamento");
            return;
        }
        var medicamentos = respuestaTexto.resultados;
        var lista = document.getElementById("listaMedicamentos");
        lista.style.fontWeight = "normal"; //Para quitar la negrita
        lista.innerHTML = "";
        for(var i = 0; i < 10; i++) {
            lista.innerHTML += "<li>" + medicamentos[i].nombre + "</li>";
        }
    });
}


function contadorTomas() {
    rest.get("https://undefined.ua.es/telemedicina/api/datos", function(estado, tomas) {
        if (estado != 200) {
            alert("Error cargando los datos del Ministerio de Salud");
            return;
        }
        var num = 0;
        for (var i = 0; i < tomas.length; i++) {
            num += tomas[i].datos.length;  // Suma directamente la longitud de 'datos' a 'num'
        }
        document.getElementById("cuenta_tomas").innerHTML = num;
    });
}

//EXAMEN NUESTRO P3
function contadorTomasI() {
    rest.get("https://undefined.ua.es/telemedicina/api/datos", function(estado, tomas) {
        if (estado != 200) {
            alert("Error cargando los datos del Ministerio de Salud");
            return;
        }
        var validTomas = 0;
        var totalTomas = 0;

        for (var i = 0; i < tomas.length; i++) {
            for (var j = 0; j < tomas[i].datos.length; j++) {
                totalTomas++;  //total tomas
                if (tomas[i].datos[j].fecha && tomas[i].datos[j].medicamento && tomas[i].datos[j].paciente) {
                    validTomas++; //tomas validas
                }
            }
        }
        var percentageValidTomas;
        if (totalTomas == 0) {
            percentageValidTomas = 0; 
        } else {
            percentageValidTomas = (validTomas / totalTomas) * 100;
        }
        document.getElementById("cuenta_tomas").innerHTML += "<p><b>Porcentaje de tomas válidas: </b>" + percentageValidTomas + "</p>";
    });
}
/* Examen grupo 1 P3   
function buscador() {
    var terminoBusqueda = document.getElementById("busqueda").value;
    // Cambiando la URL de la petición
    rest.get("https://cima.aemps.es/cima/rest/medicamento?nregistro=" + terminoBusqueda, function(estado, respuestaTexto) {
        if (estado != 200) {
            alert("Error cargando los datos del medicamento");
            return;
        }
        var lista = document.getElementById("listaMedicamentos");
        lista.style.fontWeight = "normal"; //Para quitar la negrita
        lista.innerHTML = "";
        var pactivos = respuestaTexto.pactivos;
        lista.innerHTML += "<li>" + pactivos + "</li>";
    });
}
*/

/*
function contadorTomasIbu() {
    rest.get("https://undefined.ua.es/telemedicina/api/datos", function(estado, tomas) {
        if (estado != 200) {
            alert("Error cargando los datos del Ministerio de Salud");
            return;
        }
        var num = 0;
        for (var i = 0; i < tomas.length; i++) {
            if(tomas[i].id_area == 7) { 
                for (var j = 0; j < tomas[i].datos.length; j++) {
                    if (tomas[i].datos[j].medicamento == "ibuprofeno") { 
                        num++;
                        if(paciente)
                    }
                }
            }
        }
        document.getElementById("cuenta_tomas").innerHTML += "<p><b>Número de ibuprofenos: </b>"+num+"</p>";
    });
}
*/