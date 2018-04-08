var express = require('express');
var router = express.Router();

let mongoose = require('mongoose');
let IncomeEntry = require('../models/incomeEntry'); // import the schema from models
                                                    // IncomeEntry is an object
                                                    // that holds one line of income from
                                                    // the DB. It will also be used as an
                                                    // array to hold all entries in the DB.

// get a list of all the income
// get localhost:3000/income
router.get('/', function(req, res, next) {
  IncomeEntry.find(function(err,incomeEntries){
    if(err)return console.error(err);
    res.json(incomeEntries);
  })
});

// get a specific entry by id
// localhost:3000/income/5aad8814b562004ae03fc400
router.get('/:id', function(req, res, next) {
  IncomeEntry.findOne({_id: req.params.id}, function(err, incomeEntry) {
    if (err) return next(err);
    res.status(200).send(incomeEntry);
  });
});

// Add an entry to the collection
// post localhost:3000/income?author=bozou2&numPages=33
router.post('/', function(req, res, next) {
  console.log("got to post routes");
  let entryToCreate = new IncomeEntry(req.body);

  entryToCreate.save(function(err, incomeEntry){
    if(err) {
      console.log('post error saving to mongodb');
      return console(err);
    }
    res.status(200).send(incomeEntry);
  });
});

// update the date for a specific entry
// localhost:3000/income/5aadbe2ef0851460ac5891e2?title=clowns&author=bozo&numPages=100
router.put('/:id', function(req, res, next) {
  IncomeEntry.findOneAndUpdate({_id: req.params.id}, req.body, function(err, incomeEntry) {
    if (err) return next(err);
    res.status(204).send(incomeEntry);
  });
});

// delete an entry from the collection
// localhost:3000/income/5aac8952aef4ac23dc115173
router.delete('/:id', function(req, res, next) {
  IncomeEntry.deleteOne({_id: req.params.id}, function(err, incomeEntry) {
     if (err) return next(err);
     res.status(204).send();
  });
});

module.exports = router;

