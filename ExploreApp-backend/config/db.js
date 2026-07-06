const dns = require("dns");
const mongoose = require("mongoose");

const connectDataBase = async () => {
  try {
    // Windows default DNS often refuses SRV lookups needed by mongodb+srv:// URIs.
    const customDns = process.env.DNS_SERVERS?.split(",").map((s) => s.trim()).filter(Boolean);
    if (customDns?.length) {
      dns.setServers(customDns);
    } else if (process.platform === "win32") {
      dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database connected successfully ");
  } catch (error) {
    console.log("Failed to connect with Database ", error);
    process.exit(1);
  }
};

module.exports = connectDataBase;