var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
let IncomeEntry = require('./models/incomeEntry');    // import the schema from models
                                                      // IncomeEntry is an object
                                                      // that holds one line of income from
                                                      // the DB. It will also be used as an
                                                      // array to hold all entries in the DB.

let IncomeAddAndSub = require('./models/incomeAddAndSub');
//mongoose.connect('mongodb://heroku_dk9gqdh0:g44hlper8aju8g6849k2432e7q@ds231229.mlab.com:31229/heroku_dk9gqdh0');


// add for income bracket 
let IncomeBracket = require('./models/incomeBracket');

mongoose.connect('mongodb://localhost/test');
/******* For Mustache *************/
mustacheExpress = require('mustache-express');  // Logic-less {{mustache}} templates
/*********** End mustache *************/

var incomeEntries = require('./routes/income');   // This is where the routes will be placed income.js

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
/******* For Mustache *************/
// Register '.mustache' extension with The Mustache Express
app.engine('mustache', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');
/*********** End mustache *************/

app.use('/api/income', incomeEntries);

// GET table of all incomeEntries, "Income Tracker" page
app.get('/', function (req, res) {
  IncomeEntry.find(function(err,incomeEntries){
    
    // calculate totals
    let incomeTotal = 0;
    let fedTaxesTotal = 0;
    let stateTaxesTotal = 0;
    for (let i=0; i < incomeEntries.length; i++){
      incomeTotal = incomeTotal + incomeEntries[i].income;
      fedTaxesTotal = fedTaxesTotal + incomeEntries[i].fedTaxes;
      stateTaxesTotal = stateTaxesTotal + incomeEntries[i].stateTaxes;
    }

    // sort by date
    var sortedEventDates = incomeEntries.sort(function(a, b) {
      return a.date>b.date ? -1 : a.date<b.date ? 1 : 0;
    });

    // add total line to bottom of table without setting delIndicator and updIndicator
    incomeEntries.push({ _id: "5aca979f3aab2f69d875a73a8",
      date: 'Total', description: '',
      income: incomeTotal, incomeType: '------', fedTaxes: fedTaxesTotal,
      stateTaxes: stateTaxesTotal, __v: 0});

    if(err)return console.error(err);
    res.render('index', { incomeTable: true, singleEntry: false, incomeUpdate: false,
                          newEntry: false, incomeEntries: incomeEntries })
  });
 });

// GET Insert go to "Add Entry" page
app.get('/newIncome', function (req, res) {
  res.render('index', { incomeTable: false, singleEntry: false, incomeUpdate: false,
                          newEntry: true})
  });


// GET individual incomeEntry by catalogue id. Delete link to the "Entry Delete" page
app.get('/:id/query', function(req, res, next) {
  IncomeEntry.findOne({_id: req.params.id}, function(err, incomeEntry) {
    if (err) return next(err);
      res.render('index', {incomeTable: false, singleEntry: true, incomeUpdate: false,
                           newEntry: false, incomeEntry: incomeEntry});
    });
  });

// GET individual incomeEntry by catalogue id. Got to "Entry Update" page
app.get('/:id/update', function(req, res, next) {
  IncomeEntry.findOne({_id: req.params.id}, function(err, incomeEntry) {
    if (err) return next(err);
      res.render('index', {incomeTable: false, singleEntry: false, incomeUpdate: true,
                           newEntry: false, incomeEntry: incomeEntry});
    });
  });

// POST delete entry from "Delete Entry" page
app.post('/:id/delete', function(req, res, next) {
  IncomeEntry.deleteOne({_id: req.params.id}, function(err, incomeEntry) {
    if (err) return next(err);
      res.redirect('/'); // send the user back to the income table
    });
  });

// POST update incomeEntry from "Entry Update" page
app.post('/:id/update', function(req, res, next) {
  IncomeEntry.findOneAndUpdate({_id: req.params.id}, req.body, function(err, incomeEntry) {
    if (err) return next(err);
      res.redirect('/'); // send the user back to the income table
    });
  });

// POST Add an incomeEntry from the "Add Entry" page
app.post('/new', function(req, res, next) {
  req.body.delIndicator = "Delete"; // add indicator for delete button
  req.body.updIndicator = "Update"; // add indicator for update button
  let entryToCreate = new IncomeEntry(req.body);
  entryToCreate.save(function(err, incomeEntry){
    if(err) {
      console.log('post error saving to mongodb');
      return console(err);
    }
    res.render('index', {incomeTable: false, singleEntry: false, incomeUpdate: false,
                         newEntry: true, incomeEntry: incomeEntry})
  });
});

// GET analysis page
app.get('/analysis', function (req, res) {

  // retrieve the additions and subtractions to income from
  // the incomeAddAndSubs collection in the mongoDb
  IncomeAddAndSub.find(function(err,incomeAddAndSubs){

    // if there is no collection in the database push an empty entry into the
    // returned array so that any calculations needed succeed with values of 0. The collection
    // incomeAddAndSubs will be created when the user tries to save an addition or subratction.
    if(incomeAddAndSubs.length ==0){
     incomeAddAndSubs.push({ _id: "5aca979f3aab2f69d875a73a8",
                             incomeAddition1: 0, incomeAddition2: 0, incomeSubtraction1: 0,
                             incomeSubtraction2: 0, __v: 0});
    }

    //query the database for all income entries to calculate the sum
    IncomeEntry.find(function(err,incomeEntries){

      // calculate total income
      let incomeTotal = 0;
      for (let i=0; i < incomeEntries.length; i++){
        incomeTotal = incomeTotal + incomeEntries[i].income;
      }
    
      incomeTotal = incomeTotal + incomeAddAndSubs[0].incomeAddition1 +
                    incomeAddAndSubs[0].incomeAddition2 -
                    incomeAddAndSubs[0].incomeSubtraction1 -
                    incomeAddAndSubs[0].incomeSubtraction2;

      // replace these with brackets defined in the database
      let Tbracket1 = 45000;
      let Tbracket2 = 60000;
      let Tbracket3 = 75000;
      let Tbracket4 = 150000;
      let Tbracket5 = 220000;
      let topBracket, middleBracket, bottomBracket, hedroom = 0;

      let analysisData  = { level0 : "", level1 : "", level2 : "", level3 : "",
                        level4 : "", level5 : "", level6 : "",
                        bracket3 : topBracket, bracket2 : middleBracket,
                        bracket1 : bottomBracket, headroom : hedroom, 
                        hrToBracket : 0,
                        incomeAddition1 : incomeAddAndSubs[0].incomeAddition1,
                        incomeAddition2 : incomeAddAndSubs[0].incomeAddition2,
                        incomeSubtraction1 : incomeAddAndSubs[0].incomeSubtraction1,
                        incomeSubtraction2 : incomeAddAndSubs[0].incomeSubtraction2};

      // select the 3 brackets to display and position the
      // incomeTotal
      if( incomeTotal > Tbracket5 ){
        analysisData.bracket3 = Tbracket5;
        analysisData.bracket2 = Tbracket4;
        analysisData.bracket1 = Tbracket3;
        analysisData.level6 = incomeTotal;
        analysisData.headroom = 0;
        analysisData.hrToBracket = 0;
      }else if( incomeTotal === Tbracket5 ){
         analysisData.bracket3 = Tbracket5;
         analysisData.bracket2 = Tbracket4;
         analysisData.bracket1 = Tbracket3;
         analysisData.level5 = incomeTotal;
         analysisData.headroom = 0;
         analysisData.hrToBracket = 0;
      }else if( incomeTotal > Tbracket4 && incomeTotal < Tbracket5){
        analysisData.bracket3 = Tbracket5;
        analysisData.bracket2 = Tbracket4;
        analysisData.bracket1 = Tbracket3;
        analysisData.level4 = incomeTotal;
        analysisData.headroom = Tbracket5 - incomeTotal;
        analysisData.hrToBracket =  Tbracket5;
      }else if( incomeTotal === Tbracket4 ){
        analysisData.bracket3 = Tbracket5;
        analysisData.bracket2 = Tbracket4;
        analysisData.bracket1 = Tbracket3;
        analysisData.level3 = incomeTotal;
        analysisData.headroom = Tbracket5 - incomeTotal;
        analysisData.hrToBracket =  Tbracket5;
      }else if( incomeTotal > Tbracket3 && incomeTotal < Tbracket4){
        analysisData.bracket3 = Tbracket5;
        analysisData.bracket2 = Tbracket4;
        analysisData.bracket1 = Tbracket3;
        analysisData.level2 = incomeTotal;
        analysisData.headroom = Tbracket4 - incomeTotal;
        analysisData.hrToBracket =  Tbracket4;
      }else if( incomeTotal === Tbracket3 ){
        analysisData.bracket3 = Tbracket5;
        analysisData.bracket2 = Tbracket4;
        analysisData.bracket1 = Tbracket3;
        analysisData.level1 = incomeTotal;
        analysisData.headroom = Tbracket4 - incomeTotal;
        analysisData.hrToBracket =  Tbracket4;
      }else if( incomeTotal > Tbracket2 && incomeTotal < Tbracket3){
        analysisData.bracket3 = Tbracket4;
        analysisData.bracket2 = Tbracket3;
        analysisData.bracket1 = Tbracket2;
        analysisData.level2 = incomeTotal;
        analysisData.headroom = Tbracket3 - incomeTotal;
        analysisData.hrToBracket =  Tbracket3;
      }else if( incomeTotal === Tbracket2 ){
        analysisData.bracket3 = Tbracket4;
        analysisData.bracket2 = Tbracket3;
        analysisData.bracket1 = Tbracket2;
        analysisData.level1 = incomeTotal;
        analysisData.headroom = Tbracket3 - incomeTotal;
        analysisData.hrToBracket =  Tbracket3
      }else if( incomeTotal > Tbracket1 && incomeTotal < Tbracket2){
        analysisData.bracket3 = Tbracket3;
        analysisData.bracket2 = Tbracket2;
        analysisData.bracket1 = Tbracket1;
        analysisData.level2 = incomeTotal;
        analysisData.headroom = Tbracket2 - incomeTotal;
        analysisData.hrToBracket =  Tbracket2;
      }else if( incomeTotal === Tbracket1 ){
        analysisData.bracket3 = Tbracket3;
        analysisData.bracket2 = Tbracket2;
        analysisData.bracket1 = Tbracket1;
        analysisData.level1 = incomeTotal;
        analysisData.headroom = Tbracket2 - incomeTotal;
        analysisData.hrToBracket =  Tbracket2;
      }else if( incomeTotal < Tbracket1 ){
        analysisData.bracket3 = Tbracket3;
        analysisData.bracket2 = Tbracket2;
        analysisData.bracket1 = Tbracket1;
        analysisData.level0 = incomeTotal;
        analysisData.headroom = Tbracket1 - incomeTotal;
        analysisData.hrToBracket =  Tbracket1;
      }

      if(err)return console.error(err);
        res.render('index', { incomeTable: false, singleEntry: false, incomeUpdate: false,
        newEntry: false, analysis: true, analysisData: analysisData });
    });
  });
});

// save adds and subtracts incomeAddAndSubs collection "Income Analysis" page
app.post('/newAdds', function(req, res, next) {

  IncomeAddAndSub.findOneAndUpdate({}, req.body, { upsert : true }, function(err, incomeAddAndSubs) {
    if (err) return next(err);
      res.redirect('/analysis'); // send the user back to the nalysis page
    });
  });

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
