const express =  require('express');
const authRouter = express.Router();

const {
  register,
  login,
  socialLogin,
  sendOTP,
  verifyOTP
} = require('../controllers/authController');

//register api
authRouter.post('/register', register);

//email or phone login
authRouter.post('/login' , login);
authRouter.post('/social-login', socialLogin);

//otp verification
// authRouter.post('/send-otp' , sendOTP);



module.exports =  authRouter;
