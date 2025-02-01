
const express = require('express')

const mongoose = require('mongoose')
const http = require('http');
const socketIO = require('socket.io');
const userRoutes = require('./routes/userRoutes')
const productRoutes = require('./routes/productRoutes')
const orderRoutes = require('./routes/orderRoutes')
const socketRoutes = require("./routes/socketRoutes")
const cors = require('cors')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload')
const path = require('path')

 


require('dotenv').config(); 

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("mongo db is connected Successfully")
).catch((err)=>{
    console.log(err); 
    
})  

const app = express()

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'https://oasifront.onrender.com', // Client URL (adjust as needed)
    methods: ['GET', 'POST'],
  },
});

// Socket connection setup
io.on('connection', (socket) => {
  console.log('A client connected');
  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});

// const _dirname = path.resolve();
app.set('trust proxy', 1); // Trust Render's proxy

app.use(cookieParser())
app.use(express.json())
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // For form URL-encoded data
app.use(fileUpload({ useTempFiles: true })); // For file uploads



app.use(cors({
  origin: ['https://oasifront.onrender.com'], // Only allow frontend
  credentials: true, // Allow cookies to be sent
}));

 


 
  




app.use('/', userRoutes) 
app.use('/socket', socketRoutes(io));
app.use('/product', productRoutes)
app.use('/order', orderRoutes);





const PORT = process.env.PORT || 7070;
const HOST = '0.0.0.0';

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});







