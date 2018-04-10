var mongoose = require('mongoose');

var IncomeEntrySchema = mongoose.Schema({
  "date" : String,
  "description" : String,
  "income" :  Number,
  "incomeType" : String,
  "fedTaxes" : Number,
  "stateTaxes" : Number,
  "delIndicator" : String,
  "updIndicator" : String
  });

module.exports = mongoose.model('incomeEntry', IncomeEntrySchema);  // incomeEntry will be changed to plural by mongoose
                                                                    // (incomeentries) and that will be the name of the collection
                                                                    // in the mongodb
