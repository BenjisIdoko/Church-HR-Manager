// Vercel serverless function entry point. Catches every request under
// /api/* and forwards it to the existing Express app in backend/server.js.
module.exports = require('../backend/server.js');
