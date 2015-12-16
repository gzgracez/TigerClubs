var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
var path = require('ejs');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var content = fs.readFileSync("static/index.html", 'utf8');
app.use("/static", express.static('static'));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('index', {title: 'home'});
});

app.get('/users',function(req,res) {

});

app.post('/register',function(req,res) {

});

app.post('/login',function(req,res) {

});

app.get('/users/:id',function(req,res) {

});

app.put('/users/:id',function(req,res) {

});

app.delete('/users/:id',function(req,res) {

});

app.get('/clubs',function(req,res) {

});

app.post('/clubs',function(req,res) {

});

app.get('/clubs/:id',function(req,res) {

});

app.put('/clubs/:id',function(req,res) {

});

app.delete('/clubs/:id',function(req,res) {

});

app.get('/clubs/events',function(req,res) {

});


app.get('/clubs/:id/events',function(req,res) {

});

app.put('/clubs/:id/events',function(req,res) {

});

app.post('/clubs/:id/events',function(req,res) {

});

app.get('/clubs/announcements',function(req,res) {

});

app.get('/clubs/:id/announcements',function(req,res) {

});

app.put('/clubs/:id/announcements',function(req,res) {

});

app.post('/clubs/:id/announcements',function(req,res) {

});

app.put('/clubs/:id/request',function(req,res) {

});

var server = app.listen(process.env.PORT || 4000, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});