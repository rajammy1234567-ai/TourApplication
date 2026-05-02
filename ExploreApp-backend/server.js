const express = require('express')
const connectDataBase = require('./config/db')
require('dotenv').config();
const dns = require('dns');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes')
const bookingRoutes = require('./routes/bookingRoutes')
const userRoutes = require('./routes/userRoutes')
const tourRoutes = require('./routes/tourRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const eventRoutes = require('./routes/eventRoutes')

dns.setServers([
  '0.0.0.0',
  '1.1.1.1'
])


connectDataBase();



const app =  express();
app.use(cors());
app.use(express.json());


//Routes
app.use('/api/auth', authRoutes)
app.use('/api/auth', tourRoutes)
app.use('/api/auth' , userRoutes)

app.use("/api/bookings", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/invoice", require("./routes/invoiceRoutes"));
// app.use("/api/payment", paymentRoutes);



const PORT = process.env.PORT || 3000
app.listen((PORT), '0.0.0.0' , () =>{
  console.log(`Server is running on http://localhost:${PORT}`)
})
