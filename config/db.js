const mongoose = require('mongoose');
const dns = require('dns');
const env = require('./env');

const connectDB = async () => {
  try {
    // Set public DNS servers for SRV resolution to prevent querySrv ECONNREFUSED in newer Node versions
    if (env.mongodb.uri && env.mongodb.uri.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (dnsErr) {
        console.warn('Warning: Could not set custom DNS servers:', dnsErr.message);
      }
    }
    const conn = await mongoose.connect(env.mongodb.uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
