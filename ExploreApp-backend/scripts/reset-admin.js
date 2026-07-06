require("dotenv").config();
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

const email = process.env.ADMIN_EMAIL || "admin@explore.com";
const password = process.env.ADMIN_PASSWORD || "admin123";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const hashed = await bcrypt.hash(password, 10);

  const admin = await Admin.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      name: "Super Admin",
      email: email.toLowerCase(),
      password: hashed,
      role: "super_admin",
      isActive: true,
    },
    { upsert: true, new: true }
  );

  console.log("Admin ready:");
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Password: ${password}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});