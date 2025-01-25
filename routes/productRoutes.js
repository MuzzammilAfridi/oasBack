const express = require('express')
const Product = require('../models/product')
// const multer = require('multer')

// const upload = multer({ dest: 'uploads/' })

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

module.exports = router;

