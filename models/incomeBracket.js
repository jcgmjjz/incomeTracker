var mongoose = require('mongoose');

var IncomeBracketSchema = mongoose.Schema({
  "Tbracket1" : Number,
  "Tbracket2" : Number,
  "Tbracket3" : Number,
  "Tbracket4" : Number,
  "Tbracket5" : Number
  });

module.exports = mongoose.model('incomeBracket', IncomeBracketSchema); 