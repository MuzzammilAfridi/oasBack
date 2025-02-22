const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
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
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: ['Furniture', 'Electronics', 'Fashion', 'Beauty', 'Home Appliances', 'Sports', 'Toys', 'Books'], // Define allowed categories
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
