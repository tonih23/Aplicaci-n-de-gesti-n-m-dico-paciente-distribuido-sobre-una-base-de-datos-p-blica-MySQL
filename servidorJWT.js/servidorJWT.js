var express = require("express");
var jwt = require('jwt-simple');
var clave = 'miSecreto'; // clave para codificar / decodificar el token

var app = express(); // crear servidor express
app.use("/", express.json()); // interpretar el body (req.body) cuando está en formato JSON

var pacientes = [ // ejemplo de array de pacientes
    { id: 1, nombre: "Juan" },
    { id: 2, nombre: "María" }
];

// Valida las credenciales y retorna el token si es correcto
app.post("/api/login", function (req, res) {
    
    // Ejemplo sin sin base de datos 
    if (req.body.usuario == "alberto" && req.body.password == "secreto") {
        // Crear un token
        var contenido = { // contenido del token (se puede incluir la información que necesitemos)
            usuario: 1, //id
            expira: Date.now() + 60 * 60 * 1000 // expira dentro de 1 hora (en ms)
        };
        var token = jwt.encode(contenido, clave);
        res.status(200).json(token); //captura contenido respuesta
    } else {
        res.status(301).json("Usuario Incorrecto");
    }
});


// Antes de este use, los servicios son públicos (no necesitan token)
// Con esta función intermedia validamos el token. Si no es correcto terminamos con un error. Si es correcto continuamos.
app.use("/api", function (req, res, next) { ///ahora todas las que tengan api requieren del token
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
    if (!contenidoToken || !contenidoToken.expira || !contenidoToken.usuario) { // validamos el formato del token. Si existe usuario y si existe expira
        res.status(301).json("El formato del token no es adecuado")
        return;
    }

    // Comprobar la fecha de expiración
    if (contenidoToken.expira < Date.now()) {//Si es meor que la fehca actual es que ha caducado
        res.status(301).json("El token ha expirado");
        return
    }
    // Todo ha ido bien. con next hago que express continue con el procesado
    next();
});
// Después de este use, los servicios son privados (necesitan el token). Todo lo de aqui abajo requiere del token. Hay que hacerlo asi, ponerlo debajo

// GET /api/pacientes?token=sdlkfjasdlkjflñasdjfk
app.get("/api/pacientes", function (req, res) { //Si cojo de la linea 67-69 lo corto y lo pego por encima del api(linea 33) ya no requiere el token y me devuelve los dos pacientes. Si lo dejamos asi nos dice que requiere el token 
    res.json(pacientes)
});

app.post("/api/pacientes2", function (req, res) {
    var nuevoPaciente={ 
        id: req.body.id,
        nombre:req.body.nombre 
    };
    pacientes.push(nuevoPaciente)
    res.json(pacientes)
});

// Si pongo más servicios aquí también estarán protegidos con token

app.listen(8080); // escuchar en el puerto 8080