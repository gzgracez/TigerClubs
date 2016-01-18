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
app.use('/bower_components',  express.static('/bower_components'));
app.set('view engine', 'ejs');
app.use(function(req,res,next){
  res.locals.session = req.session;
  next();
});

app.get('/', function (req, res) {
  if (!req.session.user) {
    res.render('index', {title: 'Tiger Clubs'});
  }
  else if (req.session.user.userType == "admin") {
    var users = fs.readFileSync('data/users.json', 'utf8');
    var userJSON = JSON.parse(users);
    res.render('index', {title: 'Tiger Clubs', users: userJSON});
  }
  else {
    res.render('index', {title: 'Tiger Clubs'});
  }
});

app.get('/dashboard', function (req, res) {
  if (req.session.user) {
    var clubs = fs.readFileSync('data/clubs.json', 'utf8');
    var clubsJSON = JSON.parse(clubs);
    var allClubs = [];
    for (var i = 0; i < clubsJSON.length; i++) {
      var temp = {
        "id": clubsJSON[i]["id"],
        "clubname": clubsJSON[i]["clubname"],
        "description": clubsJSON[i]["description"]
      };
      allClubs.push(temp);
    }
    req.session.returnTo = req.path;
    res.render('dashboard', {title: 'My Dashboard', clubs: allClubs});
  }
  else
    res.render('notLoggedIn', {title: 'My Dashboard'});
});

app.get('/myaccount', function (req, res) {
  if (req.session.user)
    res.render('account/myaccount', {title: 'My Account'});
  else
    res.render('notLoggedIn', {title: 'My Account'});
});

app.get('/editaccount', function (req, res) {
  if (req.session.user)
    res.render('account/editaccount', {title: 'Edit Account'});
  else
    res.render('notLoggedIn', {title: 'Edit Account'});
});

app.post('/editaccount', function (req, res) {
  var i = req.session.uid;
  var users = fs.readFileSync('data/users.json', 'utf8');
  var userJSON = JSON.parse(users);
  var taken = false;
  for (var j = 0; j < userJSON.length; j++) {
    if (req.body.eUser.username == userJSON[j]["username"]) {
      if (!(userJSON[j]["username"] == userJSON[i]["username"])) {
        taken = true;
        req.flash("notification", "Username already taken.");
        res.redirect('/editaccount');
        break;
      }
    }
    else if (req.body.eUser.email == userJSON[j]["email"]) {
      if (!(userJSON[j]["email"] == userJSON[i]["email"])) {
        taken = true;
        req.flash("notification", "Email already in use.");
        res.redirect('/editaccount');
        break;
      }
    }
  }
  if (!taken) {
    userJSON[i]["firstName"] = req.body.eUser.firstName;
    userJSON[i]["lastName"] = req.body.eUser.lastName;
    userJSON[i]["email"] = req.body.eUser.email;
    userJSON[i]["username"] = req.body.eUser.username;
    userJSON[i]["password"] = req.body.eUser.password;
    req.session.user = userJSON[i];
    var jsonString = JSON.stringify(userJSON, null, 2);
    fs.writeFile("data/users.json", jsonString);
    req.flash("notification", "Account Information Edited!");
    res.redirect('/');
  }
});

app.get('/register',function(req,res) {
  res.render('account/register', {title: 'Register'});
});

app.post('/register',function(req,res) {
  var taken = false;
  var users = fs.readFileSync('data/users.json', 'utf8');
  var userJSON = JSON.parse(users);
  for (var i = 0; i < userJSON.length; i++) {
    if (req.body.rUser.username == userJSON[i]["username"]) {
      taken = true;
      req.flash("notification", "Username already taken.");
      res.redirect('/register');
      break;
    }
    else if (req.body.rUser.email == userJSON[i]["email"]) {
      taken = true;
      req.flash("notification", "Email already in use.");
      res.redirect('/register');
      break;
    }
  }
  if (!taken) {
    var newUser = {
      "id": userJSON[userJSON.length - 1].id + 1,
      "userType": "student",
      "username": req.body.rUser.username,
      "password": req.body.rUser.password,
      "firstName": req.body.rUser.firstName,
      "lastName": req.body.rUser.lastName,
      "email": req.body.rUser.email,
      "clubs_member": [],
      "clubs_leader": []
    };
    userJSON.push(newUser);
    var jsonString = JSON.stringify(userJSON, null, 2);
    fs.writeFile("data/users.json", jsonString);
    req.flash("notification", "New Account Added");
    res.redirect('/');
  }
});

app.post('/login',function(req,res) {
  var users = fs.readFileSync('data/users.json', 'utf8');
  var userJSON = JSON.parse(users);
  for (var i = 0; i < userJSON.length; i++) {
    if (req.body.lUser.username == userJSON[i]["username"] && req.body.lUser.password == userJSON[i]["password"]) {
      req.session.user = userJSON[i];
      req.session.uid = i;
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
  req.session.uid = null;
  // req.session.destroy();
  req.flash("notification", "Successfully Logged Out!");
  res.redirect('/');
});

app.get('/schedule',function(req,res) {
  if (req.session.user)
    res.render('schedule', {title: 'Schedule'});
  else
    res.render('notLoggedIn', {title: 'Schedule'});
});

app.get('/users',function(req,res) {
  if (req.session.user["userType"] == "admin") {
    var users = fs.readFileSync('data/users.json', 'utf8');
    JSON.parse(users);
    res.send(users);
  }
  else {
    res.render('notLoggedInAdmin', {title: 'All Users'});
  }
});

app.get('/allusers',function(req,res) {
  if (!req.session.user) {
    res.render('notLoggedInAdmin', {title: 'All Users'});
  }
  else if (req.session.user.userType == "admin") {
    var users = fs.readFileSync('data/users.json', 'utf8');
    var userJSON = JSON.parse(users);
    res.render('account/allusers', {title: 'All Users', users: userJSON});
  }
  else {
    res.render('notLoggedInAdmin', {title: 'All Users'});
  }
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

app.get('/allclubs',function(req,res) {
  if (req.session.user) {
    var clubs = fs.readFileSync('data/clubs.json', 'utf8');
    var clubsJSON = JSON.parse(clubs);
    var users = fs.readFileSync('data/users.json', 'utf8');
    var userJSON = JSON.parse(users);
    var allClubs = [];
    for (var i = 0; i < clubsJSON.length; i++) {
      var temp = {
        "id": clubsJSON[i]["id"],
        "clubname": clubsJSON[i]["clubname"],
        "description": clubsJSON[i]["description"]
      };
      allClubs.push(temp);
    }
    var user = {
      "clubs_member": userJSON[req.session.uid]["clubs_member"],
      "clubs_leader": userJSON[req.session.uid]["clubs_leader"]
    }
    req.session.returnTo = req.path;
    res.render('clubs/allclubs', {title: 'All Clubs', clubs: allClubs, user: user});
  }
  else
    res.render('notLoggedIn', {title: 'All Clubs'});
});

app.get('/clubs',function(req,res) {
  if (req.session.user) {
    var clubs = fs.readFileSync('data/clubs.json', 'utf8');
    var clubsJSON = JSON.parse(clubs);
    var allClubs = [];
    for (var i = 0; i < clubsJSON.length; i++) {
      var temp = {
        "id": clubsJSON[i]["id"],
        "clubname": clubsJSON[i]["clubname"],
        "description": clubsJSON[i]["description"]
      };
      allClubs.push(temp);
    }
    req.session.returnTo = req.path;
    res.render('clubs/clubs', {title: 'My Clubs', clubs: allClubs});
  }
  else
    res.render('notLoggedIn', {title: 'My Clubs'});
});

app.post('/joinclub/:id',function(req,res) {
  var clubID = parseInt(req.params.id);
  var i = req.session.uid;
  var users = fs.readFileSync('data/users.json', 'utf8');
  var userJSON = JSON.parse(users);
  userJSON[i]["clubs_member"].push(clubID);
  req.session.user = userJSON[i];
  var jsonString = JSON.stringify(userJSON, null, 2);
  fs.writeFile("data/users.json", jsonString);
  res.redirect(req.session.returnTo || '/clubs');
  delete req.session.returnTo;
});

app.post('/leaveclub/:id',function(req,res) {
  var clubID = parseInt(req.params.id);
  var i = req.session.uid;
  var users = fs.readFileSync('data/users.json', 'utf8');
  var userJSON = JSON.parse(users);
  var clubIndex = userJSON[i]["clubs_member"].indexOf(clubID);
  userJSON[i]["clubs_member"].splice(clubIndex,1);
  req.session.user = userJSON[i];
  var jsonString = JSON.stringify(userJSON, null, 2);
  fs.writeFile("data/users.json", jsonString);
  res.redirect(req.session.returnTo || '/clubs');
  delete req.session.returnTo;
});

app.post('/uploadform/:id',function(req,res) {
  if (req.session.user) {
    var users = fs.readFileSync('data/users.json', 'utf8');
    var userJSON = JSON.parse(users);
    var clubID = parseInt(req.params.id);
    var i = req.session.uid;
    var clubs = fs.readFileSync('data/clubs.json', 'utf8');
    var clubsJSON = JSON.parse(clubs);
    var tempLink = {
      "link": req.body.formupload.formurl,
      "userID": i,
      "fullname": userJSON[i].firstName + " " + userJSON[i].lastName,
      "email": userJSON[i].email
    };
    clubsJSON[clubID]["links"].push(tempLink);
    var jsonString = JSON.stringify(clubsJSON, null, 2);
    fs.writeFile("data/clubs.json", jsonString);
    req.flash("notification", "File uploaded successfully");
    res.redirect(req.session.returnTo || '/clubs');
    delete req.session.returnTo;
  }
});

app.post('/deletefile/:cid/:fid',function(req,res) {
  if (req.session.user) {
    var clubID = parseInt(req.params.cid);
    var fileID = parseInt(req.params.fid);
    var clubs = fs.readFileSync('data/clubs.json', 'utf8');
    var clubsJSON = JSON.parse(clubs);
    clubsJSON[clubID]["links"].splice(fileID,1);
    var jsonString = JSON.stringify(clubsJSON, null, 2);
    fs.writeFile("data/clubs.json", jsonString);
    req.flash("notification", "File deleted successfully");
    res.redirect(req.session.returnTo || '/clubs');
    delete req.session.returnTo;
  }
});

app.get('/files/:id', function(req,res) {
  if (!req.session.user) {
    res.render('notLoggedInAdmin', {title: 'My Clubs'});
  }
  else {
    if (req.session.user.userType == "admin") {
      var clubID = parseInt(req.params.id);
      var i = req.session.uid;
      var clubs = fs.readFileSync('data/clubs.json', 'utf8');
      var clubsJSON = JSON.parse(clubs);
      var club = clubsJSON[clubID];
      req.session.returnTo = req.path;
      res.render('clubs/allclubfiles', {title: club["clubname"] + ' Files', club: club});
    }
  }
});

app.post('/clubs',function(req,res) {

});

app.get('/clubpage/:id', function(req,res) {//1st route
  if (req.session.user) {
    var users = fs.readFileSync('data/users.json', 'utf8');
    var userJSON = JSON.parse(users);

    var clubID = parseInt(req.params.id);
    var clubs = fs.readFileSync('data/clubs.json', 'utf8');
    var clubsJSON = JSON.parse(clubs);
    // console.log(clubID);
    var clubData = clubsJSON[clubID];
    var leaders = [];
    for (var i = 0; i < clubData["leaders"].length; i++) {
      leaders.push(userJSON[clubData["leaders"][i]]["firstName"]+" "+userJSON[clubData["leaders"][i]]["lastName"]);
    }
    clubData["leaders"] = leaders;
    
    for(var i = 0; i < clubData["announcements"].length; i++) {
      var a = userJSON[clubData["announcements"][i]["authorID"]]["firstName"]+" "+userJSON[clubData["announcements"][i]["authorID"]]["lastName"];
      clubData["announcements"][i]["authorID"] = a;
    }

    for(var i = 0; i < clubData["events"].length; i++) {
      var a = userJSON[clubData["events"][i]["authorID"]]["firstName"]+" "+userJSON[clubData["events"][i]["authorID"]]["lastName"];
      clubData["events"][i]["authorID"] = a;
    }
    /*
    for (var i = 0; i < clubData["members"].length; i++) {
      members.push(userJSON[clubData["members"][i]]["firstName"]+" "+userJSON[clubData["members"][i]]["lastName"])
    }
    */
    //DO WE WANT MEMBERS LISTED
    req.session.returnTo = req.path;
    res.render('clubs/clubpage', {title: clubData["clubname"], club: clubData});
  }
  else {
    res.render('notLoggedIn', {title: 'Club Page'});
  }
});

app.get('editevent/:id/:eid', function(req,res) {
  var users = fs.readFileSync('data/users.json', 'utf8');
  var userJSON = JSON.parse(users);

  var clubID = parseInt(req.params.id);
  var eventID = parseInt(req.params.eid);
  var clubs = fs.readFileSync('data/clubs.json', 'utf8');
  var clubsJSON = JSON.parse(clubs);
  console.log(clubID);
  var clubData = clubsJSON[clubID];

  for(var i = 0; i < clubData["events"].length; i++) {
    var a = userJSON[clubData["events"][i]["authorID"]]["firstName"]+" "+userJSON[clubData["events"][i]["authorID"]]["lastName"];
    clubData["events"][i]["authorID"] = a;
  }

  var eventData = clubData["events"][eventID];

  res.render('clubs/editevent', {title: eventData["title"], event: eventData});

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

app.use(function(req, res) {
    res.status(400);
   res.render('404', {title: '404 File Not Found'});
});

if (app.get('env') !== 'development') {
  app.use(function(error, req, res, next) {
      res.status(500);
     res.render('500', {title:'500 Internal Server Error', error: error});
  });
}

var server = app.listen(process.env.PORT || 4000, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});