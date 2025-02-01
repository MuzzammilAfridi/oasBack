const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price must be a positive number'],
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
  },
  img: {
    type: String,
    required: [true, 'File path is required'],
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Add middleware to send notification when a new product is created
productSchema.post('save', function (doc) {
  // Emit a push notification here after a new product is added to the database
  if (doc) {
    // Emit event to notify clients via WebSocket
    doc.constructor.model('Product').emit('newProductNotification', doc);
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
