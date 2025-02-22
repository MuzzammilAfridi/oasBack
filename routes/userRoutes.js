const express = require('express')
const bcrypt = require('bcryptjs');
const User = require('../models/user')
const Product = require('../models/product')
const Address = require('../models/address')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const cloudinary = require('cloudinary').v2

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET 
});

const router = express.Router()




const isAuthenticated = (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            throw new Error("Authentication token is missing");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error(error.message);
        return res.status(401).json({
            success: false,
            message: error.message || "Authentication error",
        });
    }
};






// isAdmin middleware


const isAdmin = (req, res, next) => {
    try {
        const { token } = req.cookies;
console.log(token);

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is not present",
            });
        }

        // Decode the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
// console.log(decoded);

        // Check if the user's email matches the admin email
        if (decoded.email !== 'muzzammil@gmail.com') {
            return res.status(403).json({
                success: false,
                message: "Access denied. You are not an admin",
            });
        }

        // Proceed to the next middleware or route
        next();
    } catch (error) {
        console.error("Error in isAdmin middleware:", error);

        // Handle token verification errors
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token",
            });
        }

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Authentication token has expired",
            });
        }

        // Handle other errors
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};



router.get('/', (req, res)=>{
    res.send("hii this is Lassun fassun")
})
router.get('/lassun', (req, res)=>{
    res.send("hii this is Lassun  bhai tere nhi pta hoga")
})


router.post('/register', async (req, res) => {
    try {
      const {email, password, name, phone } = req.body;
  
      if (!email || !password || !name || !phone) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }
  
      const hash = await bcrypt.hash(password, 10);
  
      const user = await User.create({email, password: hash, name, phone });
      const token = jwt.sign({ email }, process.env.JWT_SECRET);
  
      res.cookie("token", token, { httpOnly: true });
  
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });
  



  

  
  // Secret key for JWT
//   const JWT_SECRET = "your_secret_key"; // Replace this with a secure, random string in production
  
  
  router.post('/login', async (req, res) => {
      try {
          const { email, password } = req.body;
  
          // Validate input
          if (!email || !password) {
              return res.status(400).json({
                  success: false,
                  message: "Email and password are required",
              });
          }
  
          // Find the user in the database
          const user = await User.findOne({ email });
          if (!user) {
              return res.status(404).json({
                  success: false,
                  message: "User not found",
              });
          }
  
          // Compare the entered password with the hashed password
          const isPasswordMatch = await bcrypt.compare(password, user.password);
          if (!isPasswordMatch) {
              return res.status(401).json({
                  success: false,
                  message: "Invalid credentials",
              });
          }
  
          // Generate JWT token
          const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
              expiresIn: '1h', // Token expires in 1 hour
          });
  
          // Store the token as a cookie
        //   res.cookie("token", token, {
        //     //   httpOnly: true, // Prevent access to the cookie via JavaScript
        //     //   secure: process.env.NODE_ENV === 'production', // Only send the cookie over HTTPS in production
        //     //   sameSite: 'Strict', // Prevent CSRF
        //     //   maxAge: 3600 * 1000, // Cookie expires in 1 hour
        //   });



res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  maxAge: 3600 * 1000,
});

          if(email == 'muzzammil@gmail.com' && password == 'muzz'){
            return res.status(200).json({
                "success" : true,
                "admin" : true
            })
          }
  
          // Send a success response
          res.status(200).json({
              success: true,
              message: "Login successful",
          });
      } catch (error) {
          console.error(error);
          res.status(500).json({
              success: false,
              message: "Internal server error",
          });
      }
  });
  

  
  
  

  
// router.get('/logout', (req, res)=>{
//     res.clearCookie("token")

//      res.status(200).json({
//         "success" : true,
//         "message" : "You are loggout now"
//     })
// })



router.get('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true, // Ensures the cookie is only accessible by the server
        secure: true, // Ensures the cookie is sent over HTTPS
        sameSite: 'None', // Required for cross-origin cookie usage
        path: '/', // Ensure it clears the cookie for the root path
    });

    res.status(200).json({
        success: true,
        message: 'You are logged out now',
    });
});


router.post('/admin', isAdmin, async (req, res) => {
    const { name, price, description, category } = req.body;
    const file = req.files?.file; // Ensure file is present
  
    console.log(file, name, price, category);
  
    // Allowed categories (ensure they match your Product model)
    const allowedCategories = ['Furniture', 'Electronics', 'Fashion', 'Beauty', 'Home Appliances', 'Sports', 'Toys', 'Books'];
  
    // Validate required fields
    if (!file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }
    if (!category || !allowedCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing category' });
    }
  
    try {
      // Upload the file to Cloudinary
      const result = await cloudinary.uploader.upload(file.tempFilePath);
  
      // Create the product using the Cloudinary file URL
      const product = await Product.create({
        name,
        price,
        description,
        img: result.secure_url, // Save Cloudinary URL
        category, // Save category
      });
  
      // Respond with success and product details
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });
  
// })


router.get('/isadmin',isAdmin, async(req, res)=>{

  return res.json({
    "success": true,
    } )
})

router.get('/isAuthenticated', isAuthenticated, (req, res)=>{
   try {
    return res.json({
        "success": true,
        } )
   } catch (error) {
    console.log(error);

    return res.json({
        "success": false,
        } )

    
   }
})

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(400).json({
              success: false,
              message: "Your email is not registered"
          });
      }

      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Add token expiration for security
      if(!token){
        return res.json({
          "message" : "Token nahi h yr"
        })
      }
      var nodemailer = require('nodemailer');

      var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: 'rohit860049@gmail.com',
              pass: 'nzjsjfjripkrtlxh', // Use environment variables for sensitive data
          }
      });

      var mailOptions = {
          from: 'rohit860049@gmail.com',
          to: `${user.email}`,
          subject: 'Reset Your Password',
          text: `Click here to reset your password: https://oasback.onrender.com/reset-password/${token}`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
              console.log(error);
              return res.status(500).json({
                  success: false,
                  message: "Failed to send email",
                  error: error.message,
              });
          } else {
              console.log('Email sent: ' + info.response);
              return res.status(200).json({
                  success: true,
                  message: 'Email sent successfully',
                  token
              });
          }
      });
  } catch (error) {
      console.log(error);
      return res.status(500).json({
          success: false,
          message: "Internal Server Error",
          error: error.message,
      });
  }
});

router.post('/reset-password/:token', async (req, res) => { // Corrected the route
  try {
      const { token } = req.params; // Ensure token is fetched correctly
      const { password } = req.body;

      if (!password) {
          return res.status(400).json({
              message: "Provide a password"
          });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode the token
      const user = await User.findOne({ email: decoded.email });

      if (!user) {
          return res.status(400).json({
              message: "Invalid token or user does not exist"
          });
      }

      const newhash = await bcrypt.hash(password, 10);
      user.password = newhash;

      await user.save(); // Save the updated user document

      return res.status(200).json({
          message: "Password has been reset successfully",
          "success" : true
      });

  } catch (error) {
      console.log(error);
      return res.status(500).json({
          success: false,
          message: "Internal Server Error",
          error: error.message,
      });
  }
});


router.post("/user/address", async (req, res) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
        }

        // Verify the token
        const decoded = await jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ email: decoded.email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Create a new address
        const newAddress = new Address({
            fullName: req.body.fullName,
            phone: req.body.phone,
            street: req.body.street,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
        });

        await newAddress.save();

        // Update the user with the address ObjectId
        user.address = newAddress._id;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Address added successfully",
            address: newAddress,
        });
    } catch (error) {
        console.error("Error adding address:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});



router.get("/user", async (req, res) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
        }

        // Verify the token
        const decoded = await jwt.verify(token, process.env.JWT_SECRET);

        // Find user and populate address
        const user = await User.findOne({ email: decoded.email }).populate("address");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});




 


module.exports = router