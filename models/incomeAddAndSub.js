var mongoose = require('mongoose');

var IncomeAddAndSubSchema = mongoose.Schema({
  "incomeAddition1" : Number,
  "incomeAddition2" : Number,
  "incomeSubtraction1" : Number,
  "incomeSubtraction2" : Number
  });

module.exports = mongoose.model('incomeAddAndSub', IncomeAddAndSubSchema);
