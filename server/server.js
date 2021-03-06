const path = require('path');
const dotenv = require('dotenv').config();
const express = require('express');

const app = express();
const bodyParser = require('body-parser');
const AppService = require('./AppService.js')
const ShortlistResults = require('./db/ShortlistResults.js');
const Categories = require('./db/Categories.js');
const distanceOptimization = require('./optimization/distance')

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(__dirname + '/../client/public'));

/**
 * Shortlists an Activity.
 * @param  {Object} req.body  contains:
 *     user_id: Number,
 *     activity_id: String,
 *     like: Boolean,
 *     query: {
 *       id: String,
 *       string: String
 *     },
 *     completed: Boolean,
 *     limits: Object
 */
app.post('/shortlist', function(req, res) {
  if (req.body.completed) {
    // add one last ShortlistResult

    ShortlistResults.find({ 'query.id': req.body.query.id}).exec()
      .then(results => {
        console.log(results);
        // Testing
        return distanceOptimization(
          req.body.limits.location.start, 
          req.body.limits.location.end, null, results
        );
      })
      .then(data => {
        console.log(data);
        res.json(data);
      })

    // initiate Optimization
    // let start = req.body.limits.location.start || null;
    // let end = req.body.limits.location.end || null;
    // let radius = req.body.limits.location.radius || null; 
    // let activities = req.body.activities

  } else {
    ShortlistResults.shortlist(req.body)
      .then(result => {
        res.status(201).send(result);
      })
      .catch(error => {
        res.status(404).send(error.message);
      });    
  }
});

/**
 * Main Query Route
 * @param  {Object}   req.body  contains:
 *     query: String user's input,
 *     filters: Array Categories.ids
 *     limits: {
 *       budget: String dollar signs E.g. $ or $$$,
 *       duration: String,
 *       location: {
 *         start: String or Object,
 *         end: String or Object (See below)
 *         // Note: If user got their location with GPS, this will be
 *         // an object with place, coords {lat: xxx, lon: xxx}
 *         // otherwise, if they typed their location in, it would be a String
 *       }
 *     }
 */
app.post('/query', function(req, res) {
  let queryWithFilters = req.body;
  AppService.find(queryWithFilters)
    .then(data => {
      res.json(data);
    })
    .catch(error => {
      res.send(error);
    })
});

 app.post('/optimization/distance', function(req, res) {
   let start = req.body.limits.location.start;
   let end = req.body.limits.location.end;
   let radius = req.body.limits.location.radius || null; 
   let activities = req.body.activities

   distanceOptimization(start, end, radius, activities)
   .then(data => {
     res.json(data);
   });
 });

app.get('/categories', function(req, res) {
  let categories = Categories.find().exec();
  categories.then(results => {
    res.json(results);
  })
    .catch(error => {
      res.send(error);
    })
});

// ««««««««« start app  »»»»»»»»»
app.listen(port, function() {
  console.log('Listening on port ', port);
});
