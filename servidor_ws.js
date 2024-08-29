//SERVIDOR WEB SOCKET
// Crear un servidor HTTP
var http = require("http");
var httpServer = http.createServer();

// Crear servidor WS
var WebSocketServer = require("websocket").server; // instalar previamente: npm install websocket
var wsServer = new WebSocketServer({
	httpServer: httpServer
});

// Iniciar el servidor HTTP en un puerto
var puerto = 4444;
httpServer.listen(puerto, function () {
	console.log("Servidor de WebSocket iniciado en puerto:", puerto);
});

var datos=require("./datos.js")
var pacientes = datos.pacientes;
var medicos = datos.medicos;
var medicaciones = datos.medicaciones;
var medicamentos = datos.medicamentos;
var tomas = datos.tomas;


var clientes = []; // listado de clientes (conexiones) conectados. Cada cliente es una conexión + su nombre

wsServer.on("request", function (request) {// este callback se ejecuta cuando llega una nueva conexión de un cliente
	// Obtener el protocolo deseado por el cliente
	var protocolo = request.requestedProtocols[0];
	
	if (protocolo === "pacientes" || protocolo === "medicos") {
		// Si el protocolo es "pacientes" o "medicos", aceptar la conexión
		var connection = request.accept(protocolo, request.origin);// aceptar conexión
		console.log("Conexión aceptada para el protocolo " + protocolo);
	} else {
		// Si el protocolo no es "pacientes" o "medicos", rechazar la conexión
		console.log("Protocolo no válido: " + protocolo);
		request.reject();
		return;
	}

	//connection.sendUTF(JSON.stringify(pacientes)); // enviar por primera vez la lista de pacientes
	//listaPacientes(connection); // enviar la lista de pacientes al nuevo cliente
	var cliente = { connection: connection }; // por cada cliente creo un objeto con su conexión y su nombre
	clientes.push(cliente);
	connection.on("message", function (message) { // cuando llega al servidor un mensaje del cliente
	console.log("Cliente conectado. Ahora hay ", clientes.length);
		if (message.type === "utf8") {
			console.log("Mensaje recibido de cliente: " + message.utf8Data);
			var mensaje = JSON.parse(message.utf8Data);
			switch (mensaje.operacion) {
				case "identificacion":  //aQUI AÑADO EL CAMPO TIPO E ID DEL CLIENTE QUE NO LOS TENGO AUN
					cliente.tipo = mensaje.tipo;
					cliente.id = mensaje.id;
					break;
				case "masMedicacion":
					for (let i = 0; i < clientes.length; i++) {
						if (clientes[i].tipo == "MED" && clientes[i].id == mensaje.idMedico) {
							const paciente = pacientes.find(p => p.id === mensaje.idPaciente); //para encontrar al paciente con el id correspondiente(antes tenía en cuenta que el primero era 0 y no correspondía el id con la posición en el array)
							var nombrePaciente= paciente.nombre;
							var apellidosPaciente= paciente.apellidos;
							nombreMedicacion= mensaje.medicamento;
							clientes[i].connection.sendUTF(JSON.stringify({
								message:"No tengo más medicación de "+nombreMedicacion+" y necesito una nueva receta",
								nombrePaciente: nombrePaciente + ' ' + apellidosPaciente
							}))
						//mensaje que envia el servidor a todos los clientes
						//Una vez hecho el bucle comparando el id del medico y el tipo M, hago esto: clientes[i] es el medico
						//clientes[i].conection.sendUTF("Falta medicacion")
						nombreMedicacion= mensaje.medicamento;
						cliente.connection.sendUTF(JSON.stringify({
							message:"No tengo más medicación de "+nombreMedicacion+" y necesito una nueva receta"
						}))
						}	
					}
					break; 
				case "sientaMal":
					for (let i = 0; i < clientes.length; i++) {
						if (clientes[i].tipo == "MED" && clientes[i].id == mensaje.idMedico) {
							const paciente = pacientes.find(p => p.id === mensaje.idPaciente);
							var nombrePaciente= paciente.nombre;
							var apellidosPaciente= paciente.apellidos;
							nombreMedicacion= mensaje.medicamento;
							clientes[i].connection.sendUTF(JSON.stringify({
								message:"Me sienta mal el medicamento "+ nombreMedicacion,
								nombrePaciente: nombrePaciente + ' ' + apellidosPaciente
							}))
							//mensaje que envia el servidor a todos los clientes
							//Una vez hecho el bucle comparando el iddel medico y el tipo M, hago esto: clientes[i] es el medico
							//clientes[i].conection.sendUTF("Falta medicacion")
							nombreMedicacion= mensaje.medicamento;
							cliente.connection.sendUTF(JSON.stringify({
								message:"El medicamento "+nombreMedicacion+" me sienta mal"
							}))
						}	
						
					}
					break;
				case "pedirCita":
					for (let i = 0; i < clientes.length; i++) {
						if (clientes[i].tipo == "MED" && clientes[i].id == mensaje.idMedico) {
							const paciente = pacientes.find(p => p.id === mensaje.idPaciente);
							var nombrePaciente= paciente.nombre;
							var apellidosPaciente= paciente.apellidos;
							fecha_cita=mensaje.fecha_cita;
							clientes[i].connection.sendUTF(JSON.stringify({
								message:"Necesito una cita con usted para la fecha  "+ fecha_cita,
								nombrePaciente: nombrePaciente + ' ' + apellidosPaciente
							}))
							//mensaje que envia el servidor a todos los clientes
							//Una vez hecho el bucle comparando el iddel medico y el tipo M, hago esto: clientes[i] es el medico
							//clientes[i].conection.sendUTF("Falta medicacion")
							fecha_cita=mensaje.fecha_cita;
							cliente.connection.sendUTF(JSON.stringify({
								message:"Necesito una cita con usted para la fecha "+fecha_cita
						}))
						}	
					}
					break;
				case "mensajeEscrito":
					for (let i = 0; i < clientes.length; i++) {
						if (clientes[i].tipo == "PAC" && clientes[i].id == mensaje.idPaciente) {
							const paciente = pacientes.find(p => p.id === mensaje.idPaciente);
							var nombrePaciente= paciente.nombre;
							console.log("Hola2")
							var apellidosPaciente= paciente.apellidos;
							clientes[i].connection.sendUTF(JSON.stringify({
								operacion:"mensajeEscrito",
								message:mensaje.mensaje
							}))
							
							//mensaje que envia el servidor a todos los clientes
							//Una vez hecho el bucle comparando el iddel medico y el tipo M, hago esto: clientes[i] es el medico
							//clientes[i].conection.sendUTF("Falta medicacion")
							cliente.connection.sendUTF(JSON.stringify({
								operacion:"mensajeEscrito",
								message:mensaje.mensaje,
								nombrePaciente: nombrePaciente + ' ' + apellidosPaciente
							}))
							
						}	
						/*
						if (clientes[i].tipo == "PAC" && clientes[i].id == mensaje.id){
							clientes[i].connection.sendUTF(JSON.stringify({
								message:mensaje.mensaje
							}))
						}*/
					}
					break;
				
			}
		}
	})
	connection.on("close", function (reasonCode, description) { // conexión cerrada
		clientes.splice(clientes.indexOf(connection), 1);
		console.log("Cliente desconectado. Ahora hay ", clientes.length);
});	
});			
				


/*
wsServer.on("request", function (request) { // este callback se ejecuta cuando llega una nueva conexión de un cliente
	var connection = request.accept("pacientes", request.origin); // aceptar conexión
	conexiones.push(connection); // guardar la conexión
	console.log("Cliente conectado. Ahora hay", conexiones.length);
	connection.sendUTF(JSON.stringify(pacientes)); // enviar por primera vez la lista de pacientes
	//listaPacientes(connection); // enviar la lista de pacientes al nuevo cliente
	connection.on("message", function (message) { // cuando llega al servidor un mensaje del cliente
		if (message.type === "utf8") {
			console.log("Mensaje recibido de cliente: " + message.utf8Data);
			var msg = JSON.parse(message.utf8Data);
			switch (msg.operacion) {
				case "anyadir":
					pacientes.push(msg.nombre);
					break;
				case "eliminar":
					pacientes.splice(msg.indice, 1);
					break;
				case "vaciar":
					pacientes = [];
					//pacientes.splice(0, pacientes.length);
					break;
			}
			console.log("Ahora los pacientes son:", pacientes);
			for (var i = 0; i < conexiones.length; i++) {
				conexiones[i].sendUTF(JSON.stringify(pacientes));
			}
		}
	});
	connection.on("close", function (reasonCode, description) { // conexión cerrada
		conexiones.splice(conexiones.indexOf(connection), 1);
		console.log("Cliente desconectado. Ahora hay", conexiones.length);
	});
});

el cliente envia un primer mensaje con; operacion(identificacion), tipo(medico) y id
conexion tipo: cliente o medico y id
cunado la operacion sea de tipo mas medicacion tenemos que buscar en clientes el id del medico para enviarle entonces el mensaje
*/ 
