const express = require('express');

const { optionsMariaDB } = require('./options/mariaDB');
const knexMDB = require('knex')(optionsMariaDB);
const { optionsSqliteDB } = require('./options/sqliteDB');
const knexSDB = require('knex')(optionsSqliteDB);

const { Contenedor } = require('./Contenedor');

//Script para crear tabla productos en la db_productos
const createTableProductos = async () => {
  try {
    await knexMDB.schema.createTable('products', (table) => {
      table.increments('id');
      table.string('title', 15);
      table.float('price');
      table.string('thumbnail');
    });
    console.log('Table products created');
  } catch (err) {
    console.log(err);
  }
};

createTableProductos();

//Script para crear tabla mensajes en la db ecommerce
const createTableMensajes = async () => {
  try {
    await knexSDB.schema.createTable('messages', (table) => {
      table.increments('id');
      table.string('name', 15);
      table.string('message', 80);
      table.string('date', 25);
    });
    console.log('Table messages created');
  } catch (err) {
    console.log(err);
  }
};
createTableMensajes();

//Lista inicial de productos para cargar en la base de datos
const productos = [
    { title: 'Lechuga Hidroponica', price: 250, thumbnail: 'https://cdn4.iconfinder.com/data/icons/food-4-9/128/food_Cabbage-Vegetable-Organic-Lettuce-256.png', id: 1 },
    { title: 'Rucula Hidroponica', price: 450, thumbnail: 'https://cdn3.iconfinder.com/data/icons/arugula-1/500/vab1055_1_arugula_isometric-128.png', id: 2 },
    { title: 'Tomatitos Cherry', price: 500, thumbnail: 'https://cdn2.iconfinder.com/data/icons/fruits-vegetables-2/83/cherry_tomato-128.png', id: 3 },
  ];

//Lista inicial de mensajes para cargar en la base de datos
const mensajes = [
  { name: 'carlos@hotmail.com', message: 'Hola!', date: '[03/08/2022 18:08:76]' },
  { name: 'juan@gmail.com', message: 'Bien! Vos?', date: '[03/08/2022 18:08:76]' },
  { name: 'carlos@hotmail.com', message: 'Todo bien por suerte!', date: '[03/08/2022 18:08:76]' },
];

const myContenedorProducts = new Contenedor(optionsMariaDB, 'products'); // creo un objeto contenedor para los productos en la db_products
const myContenedorMensajes = new Contenedor(optionsSqliteDB, 'messages'); // creo un objeto contenedor para los productos en la productsDB

//Script inicial para insertar los productos en la DB
const execute = async () => {
  await myContenedorProducts.save(productos);
  const articulos = await myContenedorProducts.getAll();

};
execute();

//Script inicial para insertar los mensajes en la DB
// const execute = async () => {
//   // await myContenedorMensajes.save(mensajes);
//   const mensajes = await myContenedorMensajes.getAll();
//   console.log(mensajes);
// };
// execute();

const { Server: HttpServer } = require('http');
const { Server: IOServer } = require('socket.io');

const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('./public'));

const PORT = 8080;

httpServer.listen(PORT, function () {
  console.log('Servidor corriendo en http://localhost:8080');
});

io.on('connection', async (socket) => {
  console.log('Un cliente se ha conectado');
  const productos = await myContenedorProducts.getAll();
  socket.emit('productos', productos);

  const mensajes = await myContenedorMensajes.getAll();
  socket.emit('mensajes', mensajes);

  socket.on('new-product', async (newProduct) => {
    await myContenedorProducts.save(newProduct);
    const productos = await myContenedorProducts.getAll();

    io.sockets.emit('productos', productos);
  });
  socket.on('new-message', async (newMessage) => {
    await myContenedorMensajes.save(newMessage);
    const mensajes = await myContenedorMensajes.getAll();

    io.sockets.emit('mensajes', mensajes);
  });
});

httpServer.on('error', (error) => console.log(`Error en el servidor: ${error}`));

