const mongoose = require('mongoose');

const connectDataBase = async ()=>{
  try{
   await mongoose.connect(process.env.MONGODB_URI);
   console.log("Database connected successfully ");
  }
  catch(error){
    console.log("Failed to connect with Database " , error);
    process.exit(1);
  }
}

module.exports = connectDataBase;