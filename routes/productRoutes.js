const express = require('express')
const Cart = require('../models/cart');  
const Product = require('../models/product');  
const User = require('../models/user'); 
const Order = require("../models/order");
// const multer = require('multer')

// const upload = multer({ dest: 'uploads/' })

const stripe = require("stripe")("sk_test_51Qp9JBRrdmcN18A9pVr7SOwkwDF8fG8sxccx47hdtTsRy9DCoyOPfZcRGKv55ZcxocrNCrUGauSucJqu24ICMK8E00vdhEGcS9")

const router = express.Router()

router.get('/', (req, res)=>{
    res.send("This is the Product Section")
})


router.post('/create', async (req, res)=>{
  

   try {
    const product = await Product.create(req.body)
    res.status(201).json({
        "Success" : true,
        product
    })
    
   } catch (error) {
        console.log(error);
        
   }
})


// const express = require('express');
// const multer = require('multer');
// const Product = require('./models/Product'); // Replace with your Product model path

// const router = express.Router();

// Configure multer
// const upload = multer({ dest: 'uploads/' }); // Adjust the destination as needed

// router.post('/upload', upload.single('file'), async (req, res) => {
//   try {
//     const { name, description, price } = req.body;

//     // Validate file
//     if (!req.file) {
//       return res.status(400).json({ success: false, message: 'File is required' });
//     }

//     const filePath = req.file.path;

//     // Validate required fields
//     if (!name || !description || !price) {
//       return res.status(400).json({ success: false, message: 'All fields are required' });
//     }

//     // Validate price
//     if (isNaN(price) || Number(price) <= 0) {
//       return res.status(400).json({ success: false, message: 'Price must be a positive number' });
//     }

//     // Create the product
//     const product = await Product.create({
//       name,
//       description,
//       price: Number(price), // Ensure price is stored as a number
//       filePath,
//     });

//     res.status(200).json({
//       success: true,
//       product,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//     });
//   }
// });


router.get("/allproducts", async(req, res)=>{
  const products = await Product.find()

  res.status(200).json({
    "success" : true,
    products
  })
})


router.get("/:id", async (req, res) => {
  try {
    const productId = req.params.id;  // Extract the product ID from the request parameters
    const product = await Product.findById(productId);  // Find the product by its ID

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);  // Return the product details
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});




router.post('/cart/:userId/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity } = req.body;

    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the cart for the user or create one if it doesn't exist
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, products: [], totalPrice: 0 });
    }

    // Check if the product is already in the cart
    const existingProductIndex = cart.products.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingProductIndex !== -1) {
      // If product exists, update the quantity
      cart.products[existingProductIndex].quantity += quantity;
    } else {
      // If product doesn't exist, add it to the cart
      cart.products.push({ productId, quantity, price: product.price });
    }

    // Recalculate the total price
    cart.totalPrice = cart.products.reduce((total, item) => {
      return total + item.quantity * item.price;
    }, 0);

    // Save the cart
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove a product from the cart
router.delete('/cart/:userId/remove/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;

    // Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Remove the product from the cart
    const updatedProducts = cart.products.filter(
      (item) => item.productId.toString() !== productId
    );

    // Recalculate the total price
    cart.products = updatedProducts;
    cart.totalPrice = updatedProducts.reduce((total, item) => {
      return total + item.quantity * item.price;
    }, 0);

    // Save the updated cart
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Update quantity (increase or decrease)
router.put("/cart/update", async (req, res) => {
  const { userId, productId, type } = req.body;

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const productIndex = cart.products.findIndex((item) => item.productId.toString() === productId);

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    if (type === "increase") {
      cart.products[productIndex].quantity += 1;
    } else if (type === "decrease") {
      if (cart.products[productIndex].quantity > 1) {
        cart.products[productIndex].quantity -= 1;
      } else {
        cart.products.splice(productIndex, 1); // Remove product if quantity reaches 0
      }
    }

    // Recalculate total price
    cart.totalPrice = cart.products.reduce((total, item) => total + item.price * item.quantity, 0);

    await cart.save();
    return res.json(cart);
  } catch (err) {
    console.error("Error updating cart:", err);
    return res.status(500).json({ message: "Server error" });
  }
});



// Get the user's cart
router.get('/cart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the cart for the user
    const cart = await Cart.findOne({ userId }).populate('products.productId');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




// Route for the owner to get all orders
router.get("/owner/orders", async (req, res) => {
  try {
      const orders = await Cart.find()
          .populate("userId", "name email")
          .populate("products.productId", "name price");
      if (!orders.length) {
          return res.status(404).json({ error: "No orders found" });
      }
      res.status(200).json(orders);
  } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to retrieve orders", details: error.message });
  }
});



router.post("/create-checkout-session", async (req, res) => {
  try {
    const { products } = req.body;

    console.log("Received products:", products); // Check what is being received

    if (!products || products.length === 0) {
      return res.status(400).json({ error: "No products provided" });
    }

    const lineItems = products.map((product) => {
      if (!product.productId || !product.productId.name || !product.productId.price) {
        throw new Error("Invalid product data");
      }
      return {
        price_data: {
          currency: "usd",
          product_data: { name: product.productId.name },
          unit_amount: product.productId.price * 100,
        },
        quantity: product.quantity || 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: "http://localhost:5173/buy",
      cancel_url: "http://localhost:3000/cancel",
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error.message, error);
    res.status(500).json({ error: error.message });
  }
});





// Update order status
// router.put('/update/:orderId', async (req, res) => {
//   try {
//       const { orderId } = req.params;
//       const { status } = req.body;

//       // Find and update the order
//       const updatedOrder = await Cart.findByIdAndUpdate(orderId, { status }, { new: true });

//       if (!updatedOrder) {
//           return res.status(404).json({ success: false, message: 'Order not found' });
//       }

//       res.json({ success: true, message: 'Order status updated successfully', order: updatedOrder });
//   } catch (error) {
//       console.error('Error updating order:', error);
//       res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });


module.exports = router;

