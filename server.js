/*
CSCI 3916 HW2
File: server.js
Description: Web API scaffolding for movie API
 */

var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require ('./auth_jwt');
db = require('./db')();
var jwt = require('jsonwebtoken');
var cors = require('cors');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req,res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password.'})
    } else {
        var newUser = {
            username: req.body.username,
            password: req.body.password
        };

        db.save(newUser);
        res.json({success: true, msg: 'Successfully created new user.'})
    }
});

router.post('/signin', function(req,res) {
   var user = db.findOne(req.body.username);

   if (!user) {
       res.status(401).send({success: false, msg: 'Authentication failed. User was not found.'});
   } else {
       if (req.body.password == user.password) {
           var userToken = {id: user.id, usernmae: user.username };
           var token = jwt.sign(userToken, process.env.SECRET_KEY);
           res.json ({success: true, token: 'JWT ' + token});
       }
       else {
           res.status(401).send({success: false, msg: 'Authentication failed.'});
       }
   }
});

router.route('/Movie')
    .get(authController.isAuthenticated, function(req, res){

        var result;
        // If the id can be found in the DB then set it to the result.
        if (db.find(req.body.id)) {
            result = req.body.id;
        }
        // Otherwise return no results.
        else {
            result = "No results found."
        }
        res.status(200).send({msg: 'GET movies', headers: req.headers, query: result, env: process.env.UNIQUE_KEY})
    })

    .post(authController.isAuthenticated, function(req, res){
        if (!req.body.title){
            res.status(400).send({msg: "Save failed: Must include title."})
        }
        else {
            var movie = {
                title: req.body.title,
                // OTHER MOVIE DATA WOULD BE ADDED HERE
                year: "No Year"
            };

            if (req.body.year) {
                movie.year = req.body.year;
            }
            // SAVE MOVIE TO DB HERE, BUT I DON'T SEE FUNCTION IN DB.JS

            res.status(200).send({msg: "movie saved", headers: req.headers, query: movie, env: process.env.UNIQUE_KEY})
        }
    })

    .put (authController.isAuthenticated,function(req, res){

        res.status(200).send({msg: "movie updated", headers: req.headers, query: req.body, env: process.env.UNIQUE_KEY})
    })

    .delete (authJwtController.isAuthenticated, function(req,res) {

        res.status(200).send({msg: "movie deleted", headers: req.headers, query: req.body, env: process.env.UNIQUE_KEY})
    });


app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // This is for testing purposes only
