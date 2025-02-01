const express = require('express');
const router = express.Router();
const socketIo = require('socket.io');
const Product = require('../models/product'); 
module.exports = (io) => {
  // WebSocket connection setup
  io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // POST route to add a new product and send push notifications
  router.post('/addProduct', async (req, res) => {
    const { name, price, description, img } = req.body;

    try {
      const newProduct = new Product({ name, price, description, img });
      await newProduct.save(); // Save the new product to the database

      // Emit the notification to all connected clients
      io.emit('newProductNotification', newProduct);

      res.status(201).send({
        message: 'Product added successfully!',
        product: newProduct,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: 'Error adding product.' });
    }
  });


  // GET route for testing (optional)
  router.get("/", (req, res) => {
    res.send("Hiii How are You");
  });

  // POST route to send order status notifications
  router.post('/sendOrderStatus', (req, res) => {
    const { orderStatus, message } = req.body;

    // Validate the input
    if (!orderStatus || !message) {
      return res.status(400).send({ message: 'Order status and message are required.' });
    }

    console.log('Order Status:', orderStatus);
    console.log('Message:', message);

    // Emit the notification to all connected clients
    io.emit('orderNotification', { orderStatus, message });

    // Send success response
    res.status(200).send({
      message: 'Order status sent successfully!',
    });
  });

  return router;
};
