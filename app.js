var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
let IncomeEntry = require('./models/incomeEntry');    // import the schema from models
                                                      // IncomeEntry is an object
                                                      // that holds one line of income from
                                                      // the DB. It will also be used as an
                                                      // array to hold all entries in the DB.

//mongoose.connect('mongodb://heroku_dk9gqdh0:g44hlper8aju8g6849k2432e7q@ds231229.mlab.com:31229/heroku_dk9gqdh0');

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

// GET front page, table of all incomeEntries
app.get('/', function (req, res) {
  IncomeEntry.find(function(err,incomeEntries){
    if(err)return console.error(err);
    res.render('index', { incomeTable: true, singleEntry: false, incomeUpdate: false,
                          newEntry: false, incomeEntries: incomeEntries})
  });
 });

// GET Insert new incomeEntry page
app.get('/newIncome', function (req, res) {
    res.render('index', { incomeTable: false, singleEntry: false, incomeUpdate: false,
                          newEntry: true})
  });

// localhost:3000/income/5aad8814b562004ae03fc400
// GET individual incomeEntry by catalogue id. Linked from front page
app.get('/:id/query', function(req, res, next) {
  IncomeEntry.findOne({_id: req.params.id}, function(err, incomeEntry) {
    if (err) return next(err);
      res.render('index', {incomeTable: false, singleEntry: true, incomeUpdate: false,
                           newEntry: false, incomeEntry: incomeEntry});
    });
  });

// localhost:3000/income/5aad8814b562004ae03fc400
// GET individual incomeEntry by catalogue id. Linked from front page
app.get('/:id/update', function(req, res, next) {
  IncomeEntry.findOne({_id: req.params.id}, function(err, incomeEntry) {
    if (err) return next(err);
      res.render('index', {incomeTable: false, singleEntry: false, incomeUpdate: true,
                           newEntry: false, incomeEntry: incomeEntry});
    });
  });

// localhost:3000/income/5aad8814b562004ae03fc400
// GET individual incomeEntry by catalogue id. Linked from front page
app.get('/:id', function(req, res, next) {
  IncomeEntry.findOne({_id: req.params.id}, function(err, incomeEntry) {
    if (err) return next(err);
      res.render('index', {incomeTable: false, singleEntry: false, incomeUpdate: true,
                           newEntry: false, incomeEntry: incomeEntry});
    });
  });

// localhost:3000/income/5aac8952aef4ac23dc115173
// POST delete entry from individual entry page
app.post('/:id/delete', function(req, res, next) {
  console.log('POST DELETE');
  console.log(req.params["id"]);
  IncomeEntry.deleteOne({_id: req.params.id}, function(err, incomeEntry) {
    console.log(req.params.id);
    if (err) return next(err);
      res.redirect('/'); // send the user back to the income table
      //res.render('index', {incomeTable: false, singleEntry: true, incomeUpdate: false,
      //                     newEntry: false, incomeEntry: incomeEntry});
    });
  });

// localhost:3000/income/5aac8952aef4ac23dc115173
// POST update incomeEntry from individual incomeEntry page
app.post('/:id/update', function(req, res, next) {
  console.log('POST UPDATE');
  console.log(req.body);
  IncomeEntry.findOneAndUpdate({_id: req.params.id}, req.body, function(err, incomeEntry) {
    if (err) return next(err);
      res.redirect('/'); // send the user back to the income table
      //res.render('index', {incomeTable: false, singleEntry: false, incomeUpdate: true, 
      //                     newEntry: false, incomeEntry: incomeEntry});
    });
  });

// Add a incomeEntry 
// post localhost:3000/income?author=bozou2&numPages=33
app.post('/new', function(req, res, next) {
  console.log("got to post");
  console.log(req.body);
  let entryToCreate = new IncomeEntry(req.body);
  entryToCreate.save(function(err, incomeEntry){
    if(err) {
      console.log('post error saving to mongodb');
      return console(err);
    }
    res.render('index', {incomeTable: false, singleEntry: false, incomeUpdate: false,
                         newEntry: true, incomeEntry: incomeEntry});
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
