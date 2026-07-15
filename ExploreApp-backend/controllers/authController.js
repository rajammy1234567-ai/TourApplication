const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const {sendEmailOTP} = require('../utils/email');
const {sendPhoneOTP} = require('../utils/sms')
const otpStore = {};

const createToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "7d" }
  );

  const toSafeUser = (user) => ({
  _id: user._id,
  fullname: user.fullname,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  authProvider: user.authProvider,
});

const normalizePhone = (value) =>
  value == null ? "" : String(value).replace(/[\s\-()]/g, "").trim();

// register controller
exports.register = async (req, res) => {
  try {
    const fullname = req.body.fullname ? String(req.body.fullname).trim() : "";
    const password = req.body.password;
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : "";
    const phone = normalizePhone(req.body.phone);

    if (!fullname || !password || (!email && !phone)) {
      return res.status(400).json({
        msg: "Name, password and email or phone required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });

    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Avoid empty-string unique collisions (sparse index only skips null/undefined)
    const user = await User.create({
      fullname,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      password: hashed,
      authProvider: "local",
    });

    const token = createToken(user._id);

    res.json({
      success: true,
      msg: "User registered successfully",
      token,
      user: toSafeUser(user),
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ msg: "User already exists" });
    }
    res.status(500).json({ msg: err.message });
  }
};

// email / phone login
exports.login = async (req, res) => {
  try {
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : "";
    const phone = normalizePhone(req.body.phone);
    const password = req.body.password;

    if ((!email && !phone) || !password) {
      return res.status(400).json({ msg: "Email/Phone and password required" });
    }

    const query = email ? { email } : { phone };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({
        msg: `Please continue with ${user.authProvider || "social login"}`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Wrong password" });
    }

    const token = createToken(user._id);

    res.json({
      success: true,
      msg: "Login success",
      token,
      user: toSafeUser(user),
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


//send-otp routes
// exports.sendOTP = async(req, res)=>{
//   try{
//     const {email , phone} =  req.body;
    
//     if(!email && !phone){
//       return res.status(400).json({message : "Email or Phone is required"})
//     }

//     let user;
//     if(email){
//       user = await User.findOne({ email });
//       if(!user) user = new User({email});
//     }

//     if(phone){
//       user = await User.findOne({phone});
//       if(!user) user = new User({phone});
//     }

//     // const otp = Math.floor(1000 + Math.random() * 9000).toString();
//     // user.otp = otp;
//     // user.otpExpiry = Date.now() + 5 * 60 * 1000;

//     const otp = otpGenerator.generate(6,{
//       upperCaseAlphabets : false,
//       specialChars : false,
//       lowerCaseAlphabets : false,
      
//     });

//     otpStore[email] = {
//       otp,
//       expiresAt: Date.now() + 5*60*1000 , // Otp will expire in % minutes
//     };

//     await user.save();

//     if (email) {
//       await sendEmailOTP(email, otp);
//     }

//     if (phone) {
//       await sendPhoneOTP(phone, otp);
//     }

//     console.log("OTP", otp);

//     res.json({message : "OTP sent successfully"})
//   }
//   catch(error){ 
//     res.status(500).json({message:  error.message});
//   }

// }


exports.socialLogin = async (req, res) => {
  try {
   const { provider, providerId, fullname, avatar } = req.body;
    const email = req.body.email ? String(req.body.email).toLowerCase() : "";

    if (!["google", "apple"].includes(provider)) {
      return res.status(400).json({ msg: "Invalid social login provider" });
    }

    if (!providerId && !email) {
      return res.status(400).json({ msg: "Social profile is incomplete" });
    }

    let user = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(providerId ? [{ providerId, authProvider: provider }] : []),
      ],
    });

    if (user) {
      user.fullname = user.fullname || fullname || "Traveller";
      user.email = user.email || email;
      user.authProvider = user.authProvider || provider;
      user.providerId = user.providerId || providerId;
      user.avatar = avatar || user.avatar;
      await user.save();
    } else {
      user = await User.create({
        fullname: fullname || "Traveller",
        email,
        authProvider: provider,
        providerId,
        avatar,
      });
    }

    const token = createToken(user._id);

   return res.json({
      msg: "Login success",
      token,
      user: toSafeUser(user),
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};