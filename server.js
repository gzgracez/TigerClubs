var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var fs = require('fs');
var path = require('path');
var path = require('ejs');
var flash = require('express-flash');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({secret: 'tigerClubsYay'}));
app.use(flash());
var content = fs.readFileSync("static/index.html", 'utf8');
app.use("/static", express.static('static'));
app.set('view engine', 'ejs');
app.use(function(req,res,next){
    res.locals.session = req.session;
    next();
});

app.get('/', function (req, res) {
  res.render('index', {title: 'Tiger Clubs Home'});
});

app.get('/dashboard', function (req, res) {
  res.render('dashboard', {title: 'My Dashboard'});
});

app.get('/myaccount', function (req, res) {
  res.render('myaccount', {title: 'My Account'});
});

app.get('/users',function(req,res) {
	var users = fs.readFileSync('data/users.json', 'utf8');
	res.send(users);
});

app.get('/register',function(req,res) {
  res.render('register', {title: 'Register'});
});

app.post('/register',function(req,res) {
  var users = fs.readFileSync('data/users.json', 'utf8');
  var userJSON = JSON.parse(users);
  var newUser = {
    "id": userJSON[userJSON.length - 1].id + 1,
    "userType": "student",
    "username": req.body.rUser.username,
    "password": req.body.rUser.password,
    "firstName": req.body.rUser.firstName,
    "lastName": req.body.rUser.lastName,
    "email": req.body.rUser.email,
    "clubs_member": [],
    "clubs_leader": [0]
  };
  userJSON.push(newUser);
  var jsonString = JSON.stringify(userJSON, null, 2);
  fs.writeFile("data/users.json", jsonString);
  req.flash("notification", "New Account Added");
  res.redirect('/');
});

app.post('/login',function(req,res) {
  var users = fs.readFileSync('data/users.json', 'utf8');
  var userJSON = JSON.parse(users);
  for (var i = 0; i < userJSON.length; i++) {
    if (req.body.lUser.username == userJSON[i]["username"]
      && req.body.lUser.password == userJSON[i]["password"]) {
      req.session.user = userJSON[i];
      break;
    }
  }
  if (req.session.user) {
    req.flash("notification", "Successfully logged in!");
  }
  else {
    req.flash("notification", "Could not log in - username or password was incorrect");
  }
  res.redirect('/');
});

app.get('/logout',function(req,res) {
  req.session.user = null;
  // req.session.destroy();
  req.flash("notification", "Successfully Logged Out!");
  res.redirect('/');
});

app.get('/schedule',function(req,res) {
  res.render('schedule', {title: 'Schedule'});
});

app.get('/users/:id',function(req,res) {
	var userId = req.params.id;
	var users = fs.readFileSync('data/users.json', 'utf8');
	JSON.parse(users);
	var u = users[userID]
	res.send(JSON.stringify(u));
});

app.put('/users/:id',function(req,res) {

});

app.delete('/users/:id',function(req,res) {

});

app.get('/clubs',function(req,res) {
  res.render('clubs', {title: 'My Clubs'});
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