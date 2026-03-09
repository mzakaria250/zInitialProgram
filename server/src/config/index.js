require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:4200',
};
