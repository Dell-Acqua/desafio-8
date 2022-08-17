const fs = require('fs');
const express = require('express');

async function readFile(file) {
  if (fs.existsSync(file)) {
    const content = await fs.promises.readFile(file, 'utf-8');
    const mensajes = await JSON.parse(content);
    return mensajes;
  } else {
    console.log('No existe el archivo');
    return null;
  }
}

const { Server: HttpServer } = require('http');
const { Server: IOServer } = require('socket.io');

const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('./public'));

const PORT = 8080;

const mensajes = [];

const productos = [
    { title: 'Lechuga Hidroponica', price: 250, thumbnail: 'https://cdn4.iconfinder.com/data/icons/food-4-9/128/food_Cabbage-Vegetable-Organic-Lettuce-256.png', id: 1 },
    { title: 'Rucula Hidroponica', price: 450, thumbnail: 'https://cdn3.iconfinder.com/data/icons/arugula-1/500/vab1055_1_arugula_isometric-128.png', id: 2 },
    { title: 'Tomatitos Cherry', price: 500, thumbnail: 'https://cdn2.iconfinder.com/data/icons/fruits-vegetables-2/83/cherry_tomato-128.png', id: 3 },
  ];



httpServer.listen(PORT, function () {
  console.log('Servidor corriendo en http://localhost:8080');

  fs.promises
    .readFile('mensajes.txt', 'utf-8')
    .then((data) => JSON.parse(data))
    .then((data) => {
      for (const mensaje of data) {
        mensajes.push(mensaje);
      }
    });
});

io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado');

  socket.emit('productos', productos);

  socket.emit('mensajes', mensajes);

  socket.on('new-product', (newProduct) => {
    const id = productos.length !== 0 ? productos[productos.length - 1].id + 1 : 1;

    const productoAGuardar = { ...newProduct, id: id };
    productos.push(productoAGuardar);

    io.sockets.emit('productos', productos);
  });
  socket.on('new-message', (newMessage) => {
    mensajes.push(newMessage);
    fs.promises.writeFile('mensajes.txt', `${JSON.stringify(mensajes)}`).then(io.sockets.emit('mensajes', mensajes));
  });
});

httpServer.on('error', (error) => console.log(`Error en el servidor: ${error}`));