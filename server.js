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
        "advisorID": clubsJSON[i]["advisorID"],
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

app.get('/schedule',function(req,res) {
  if (req.session.user){
        
    var users = fs.readFileSync('data/users.json', 'utf8');
    var userJSON = JSON.parse(users);
    var userID = parseInt(req.session.uid);
    var userClubs = [];
    
    for (var i = 0; i < userJSON[userID]["clubs_member"].length; i++) {
      userClubs.push(userJSON[userID]["clubs_member"][i]);
    }
    
    for (var o = 0; o < userJSON[userID]["clubs_leader"].length; o++) {
      userClubs.push(userJSON[userID]["clubs_leader"][o]);
    }
    
    console.log(userClubs);
        
    var clubID = null;
    var clubs = fs.readFileSync('data/clubs.json', 'utf8');
    var clubsJSON = JSON.parse(clubs);
    
    var userClubEvents = [];
        
     for (var x = 0; x < userClubs.length; x++){
         clubID = userClubs[x];
         
            for (var v = 0; v < clubsJSON[clubID]["events"].length; v++) {
            userClubEvents.push(clubsJSON[clubID]["events"][v]);
            }
     }
      
    console.log(userClubEvents);
    
    var eventstring = JSON.stringify(userClubEvents, null, 4);
        fs.writeFile('./data/sessionuserevents.json', eventstring);
        
    res.render('schedule', { title: 'Your Schedule'});
    }
  else
    res.render('notLoggedIn', {title: 'Schedule'});
    
});

app.get('/scheduleevents', function(req, res) {
  var sessionevents = require('./data/sessionuserevents.json');
  res.send(sessionevents);
  console.log(sessionevents);
  console.log("Events Sent!");
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

app.post('/addlink/:id',function(req,res) {
  if (req.session.user) {
    var clubID = parseInt(req.params.id);
    var clubs = fs.readFileSync('data/clubs.json', 'utf8');
    var clubsJSON = JSON.parse(clubs);
    var tempLink = {
        "link": req.body.link.link,
        "name": "Link",
        "userID": req.session.user.id,
        "fullname": req.session.user.firstName + " " + req.session.user.lastName,
        "email": req.session.user.email
      }
    clubsJSON[clubID]["links"].push(tempLink);
    var jsonString = JSON.stringify(clubsJSON, null, 2);
    fs.writeFile("data/clubs.json", jsonString);
    req.flash("notification", "Link added successfully");
    res.redirect(req.session.returnTo || '/clubs');
    delete req.session.returnTo;
  }
});

app.get('/createclub', function (req, res) {
  if (!req.session.user) {
    res.render('notLoggedInAdmin', {title: 'Create a Club'});
  }
  else if (req.session.user.userType == "admin") {
    var users = fs.readFileSync('data/users.json', 'utf8');
    var userJSON = JSON.parse(users);
    res.render('clubs/createclub', {title: 'Create a Club', users: userJSON});
  }
  else {
    res.render('notLoggedInAdmin', {title: 'Create a Club'});
  }
});

app.post('/createclub', function (req, res) {
  var i = req.session.uid;
  var users = fs.readFileSync('data/users.json', 'utf8');
  var userJSON = JSON.parse(users);
  var clubs = fs.readFileSync('data/clubs.json', 'utf8');
  var clubsJSON = JSON.parse(clubs);
  var taken = false;
  for (var j = 0; j < clubsJSON.length; j++) {
    if (req.body.club.clubname == clubsJSON[j]["clubname"]) {
      taken = true;
      req.flash("notification", "Club Name already taken.");
      res.redirect('/createclub');
      break;
    }
  }
  if (!taken) {
    var temp = {
      "id": clubsJSON[clubsJSON.length-1]["id"] + 1,
      "clubname": req.body.club.clubname,
      "description": req.body.club.description,
      "advisorID": [req.session.user.id],
      "requests": [],
      "announcements": [],
      "events": [],
      "links": []
    };
    if (!req.body.club.leaders) {
      temp["leaders"] = [];
    }
    else {
      var tempLeaders = [];
      for (var l = 0; l < req.body.club.leaders.length; l++) {
        tempLeaders.push(parseInt(req.body.club.leaders[l]));
      }
      temp["leaders"] = tempLeaders;
    }
    clubsJSON.push(temp);
    var jsonString = JSON.stringify(clubsJSON, null, 2);
    fs.writeFile("data/clubs.json", jsonString);
    req.flash("notification", "Club Created!");
    res.redirect('/allclubs');
  }
});

app.get('/editclub/:id', function (req, res) {
  if (!req.session.user) {
    res.render('notLoggedInAdmin', {title: 'Edit Club'});
  }
  else if (req.session.user.userType == "admin") {
    var users = fs.readFileSync('data/users.json', 'utf8');
    var userJSON = JSON.parse(users);
    var clubs = fs.readFileSync('data/clubs.json', 'utf8');
    var clubsJSON = JSON.parse(clubs);
    var clubID = parseInt(req.params.id);
    res.render('clubs/editclub', {title: 'Edit Club', users: userJSON, club: clubsJSON[clubID]});
  }
  else {
    res.render('notLoggedInAdmin', {title: 'Edit Club'});
  }
});

app.post('/editclub/:id', function (req, res) {
  var users = fs.readFileSync('data/users.json', 'utf8');
  var userJSON = JSON.parse(users);
  var clubs = fs.readFileSync('data/clubs.json', 'utf8');
  var clubsJSON = JSON.parse(clubs);
  var clubID = parseInt(req.params.id);
  var taken = false;
  for (var j = 0; j < clubsJSON.length; j++) {
    if (req.body.club.clubname == clubsJSON[j]["clubname"]) {
      if (!(clubsJSON[j]["clubname"] == clubsJSON[clubID]["clubname"])) {
        taken = true;
        req.flash("notification", "Club Name already taken.");
        var tempPath = "/editclub/" + clubID;
        res.redirect(tempPath || req.session.returnTo);
        break;
      }
    }
  }
  if (!taken) {
    clubsJSON[clubID]["clubname"] = req.body.club.clubname;
    clubsJSON[clubID]["description"] = req.body.club.description;
    if (!req.body.club.leaders) {
      temp["leaders"] = [];
    }
    else {
      var tempLeaders = [];
      for (var l = 0; l < req.body.club.leaders.length; l++) {
        tempLeaders.push(parseInt(req.body.club.leaders[l]));
      }
      clubsJSON[clubID]["leaders"] = tempLeaders;
    }
    var jsonString = JSON.stringify(clubsJSON, null, 2);
    fs.writeFile("data/clubs.json", jsonString);
    req.flash("notification", "Club Edited!");
    res.redirect(req.session.returnTo || '/allclubs');
    delete req.session.returnTo;
  }
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
        "advisorID": clubsJSON[i]["advisorID"],
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
      "name": "Upload",
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
    res.render('notLoggedInAdmin', {title: 'Club Files'});
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

app.get('/roster/:id', function(req,res) {
  if (!req.session.user) {
    res.render('notLoggedInAdmin', {title: 'Club Roster'});
  }
  else {
    var clubID = parseInt(req.params.id);
    var clubs = fs.readFileSync('data/clubs.json', 'utf8');
    var clubsJSON = JSON.parse(clubs);
    var users = fs.readFileSync('data/users.json', 'utf8');
    var userJSON = JSON.parse(users);
    var members = [];
    for (var i = 0; i < userJSON.length; i++) {
      if (userJSON[i]["clubs_member"].indexOf(clubID) > -1) {
        var tempUser = {
          "fullname": userJSON[i]["firstName"] + " " + userJSON[i]["lastName"],
          "username": userJSON[i]["username"],
          "email": userJSON[i]["email"],
          "type": "Club Member",
          "uid": userJSON[i]["id"]
        }
        members.push(tempUser);
      }
      else if (userJSON[i]["clubs_leader"].indexOf(clubID) > -1) {
        var tempUser = {
          "fullname": userJSON[i]["firstName"] + " " + userJSON[i]["lastName"],
          "username": userJSON[i]["username"],
          "email": userJSON[i]["email"],
          "type": "Club Leader",
          "uid": userJSON[i]["id"]
        }
        members.push(tempUser);
      }
    }
    var club = clubsJSON[clubID];
    req.session.returnTo = req.path;
    res.render('clubs/roster', {title: club["clubname"] + ' Roster', club: club, members: members});
  }
});

app.post('/deletemember/:cid/:uid',function(req,res) {
  if (req.session.user) {
    var clubID = parseInt(req.params.cid);
    var userID = parseInt(req.params.uid);
    var users = fs.readFileSync('data/users.json', 'utf8');
    var userJSON = JSON.parse(users);
    var tempIndex = userJSON[userID]["clubs_member"].indexOf(clubID);
    userJSON[userID]["clubs_member"].splice(tempIndex,1);
    var jsonString = JSON.stringify(userJSON, null, 2);
    fs.writeFile("data/users.json", jsonString);
    req.flash("notification", "Club member deleted successfully");
    res.redirect(req.session.returnTo || '/clubs');
    delete req.session.returnTo;
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

    var leader = false;

    var leaders = [];
    if (clubData["leaders"].length > 0) {
      for (var i = 0; i < clubData["leaders"].length; i++) {
        if(clubData["leaders"][i] == req.session.uid) {
          leader = true;
        }
        leaders.push(userJSON[clubData["leaders"][i]]["firstName"]+" "+userJSON[clubData["leaders"][i]]["lastName"]);
      }
    }
    clubData["leaders"] = leaders;

    var advisor = [];
    
    advisor.push(userJSON[clubData["advisorID"][0]]["firstName"]+" "+userJSON[clubData["advisorID"][0]]["lastName"]);
    
    clubData["advisorName"] = advisor;
    clubData["advisorID"] = clubData["advisorID"][0];
    
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
    res.render('clubs/clubpage', {title: clubData["clubname"], club: clubData, isLeader: leader});
  }
  else {
    res.render('notLoggedIn', {title: 'Club Page'});
  }
});

app.get('/editevent/:id/:eid', function(req,res,next) {

  var users = fs.readFileSync('data/users.json', 'utf8');
  var userJSON = JSON.parse(users);

  var clubID = parseInt(req.params.id);
  var eventID = parseInt(req.params.eid);
  var clubs = fs.readFileSync('data/clubs.json', 'utf8');
  var clubsJSON = JSON.parse(clubs);
  
  var clubData = clubsJSON[clubID];

  for(var i = 0; i < clubData["events"].length; i++) {
    var a = userJSON[clubData["events"][i]["authorID"]]["firstName"]+" "+userJSON[clubData["events"][i]["authorID"]]["lastName"];
    clubData["events"][i]["authorID"] = a;
  }

  var eventData = clubData["events"][eventID];
  date = new Date(eventData["time"]);

  eventData["month"]=date.getMonth();
  eventData["year"]=date.getFullYear();
  eventData["day"]=date.getDate();
  eventData["hour"]=date.getHours();
  eventData["minute"]=date.getMinutes();
 
 
  res.render('clubs/editevent', {title: eventData["title"], event: eventData});

});

app.post('/editevent/:id/:eid', function(req,res,next) {
  var clubID = parseInt(req.params.id);
  var eventID = parseInt(req.params.eid);
  var clubs = fs.readFileSync('data/clubs.json', 'utf8');
  var clubsJSON = JSON.parse(clubs);
  date = new Date(2016, parseInt(req.body.event.month), parseInt(req.body.event.day), parseInt(req.body.event.hour), parseInt(req.body.event.minute));
  var eventData = {
    "id":eventID,
    "clubID":clubID,
    "name":req.body.event.name,
    "description":req.body.event.description,
    "authorID":req.session.uid,
    "postDate": req.body.event.postDate,
    "location":req.body.event.location,
    "time":date.toString(),
    "type":req.body.event.type,
    "visible":req.body.event.visible
  }

  clubsJSON[clubID]["events"][eventID] = eventData

  var jsonString = JSON.stringify(clubsJSON, null, 2);
  fs.writeFile("data/clubs.json", jsonString);
  req.flash("notification", "Event Edited");
  res.redirect('/clubpage/'+clubID);


});

app.get('/editannouncement/:id/:aid', function(req,res,next) {

  var users = fs.readFileSync('data/users.json', 'utf8');
  var userJSON = JSON.parse(users);

  var clubID = parseInt(req.params.id);
  var announcementID = parseInt(req.params.aid);
  var clubs = fs.readFileSync('data/clubs.json', 'utf8');
  var clubsJSON = JSON.parse(clubs);
  console.log(clubID);
  var clubData = clubsJSON[clubID];

  for(var i = 0; i < clubData["announcements"].length; i++) {
    var a = userJSON[clubData["announcements"][i]["authorID"]]["firstName"]+" "+userJSON[clubData["announcements"][i]["authorID"]]["lastName"];
    clubData["announcements"][i]["authorID"] = a;
  }

  var announcementData = clubData["announcements"][announcementID];

  res.render('clubs/editannouncement', {title: announcementData["name"], announcement: announcementData});

});

app.post('/editannouncement/:id/:aid', function(req,res,next) {
  var clubID = parseInt(req.params.id);
  var announcementID = parseInt(req.params.aid);
  var clubs = fs.readFileSync('data/clubs.json', 'utf8');
  var clubsJSON = JSON.parse(clubs);
  

  var announcementData = {
    "id":announcementID,
    "clubID":clubID,
    "name":req.body.announcement.name,
    "description":req.body.announcement.description,
    "authorID":req.session.uid,
    "postDate": Date(),
    "visible":req.body.announcement.visible  }

  clubsJSON[clubID]["announcements"][announcementID] = announcementData

  var jsonString = JSON.stringify(clubsJSON, null, 2);
  fs.writeFile("data/clubs.json", jsonString);
  req.flash("notification", "Announcement Edited");
  res.redirect('/clubpage/'+clubID);


});

app.get('/newevent/:id', function(req,res) {

  var users = fs.readFileSync('data/users.json', 'utf8');
  var userJSON = JSON.parse(users);

  var clubID = parseInt(req.params.id); 
  var clubs = fs.readFileSync('data/clubs.json', 'utf8');
  var clubsJSON = JSON.parse(clubs);
  var clubData = clubsJSON[clubID];


  var eventData = {
    "id":clubData["events"].length,
    "clubID":clubID,
    "name":"",
    "description":"",
    "authorID":req.session.uid,
    "postDate":"",
    "location":"",
    "month":1,
    "day":1,
    "hour":1,
    "minute":1,
    "type":"",
    "visible":"true"
  }

  res.render('clubs/newevent', {title: "New Event", event: eventData});

});

app.post('/newevent/:id', function(req,res) {
  var clubID = parseInt(req.params.id);
  var clubs = fs.readFileSync('data/clubs.json', 'utf8');
  var clubsJSON = JSON.parse(clubs);
  date = new Date(2016, parseInt(req.body.event.month), parseInt(req.body.event.day), parseInt(req.body.event.hour), parseInt(req.body.event.minute));
  var eventData = {
    "id":clubsJSON[clubID]["events"].length,
    "clubID":clubID,
    "name":req.body.event.name,
    "description":req.body.event.description,
    "authorID":req.session.uid,
    "postDate": req.body.event.postDate,
    "location":req.body.event.location,
    "time":date.toString(),
    "type":req.body.event.type,
    "visible":"true"
  }

  clubsJSON[clubID]["events"].push(eventData);

  var jsonString = JSON.stringify(clubsJSON, null, 2);
  fs.writeFile("data/clubs.json", jsonString);
  req.flash("notification", "Event Created");
  res.redirect('/clubpage/'+clubID);


});

app.get('/newannouncement/:id', function(req,res) {

  var users = fs.readFileSync('data/users.json', 'utf8');
  var userJSON = JSON.parse(users);

  var clubID = parseInt(req.params.id);
  var clubs = fs.readFileSync('data/clubs.json', 'utf8');
  var clubsJSON = JSON.parse(clubs);
  console.log(clubID);
  var clubData = clubsJSON[clubID];

  var announcementData = {
    "id":clubData["announcements"].length,
    "clubID":clubID,
    "name":"",
    "description":"",
    "authorID":req.session.uid,
    "postDate": Date(),
    "visible":"true"  }

  res.render('clubs/newannouncement', {title: "New Announcement", announcement: announcementData});

});

app.post('/newannouncement/:id', function(req,res) {
  var clubID = parseInt(req.params.id);
  var announcementID = parseInt(req.params.aid);
  var clubs = fs.readFileSync('data/clubs.json', 'utf8');
  var clubsJSON = JSON.parse(clubs);
  

  var announcementData = {
    "id":clubsJSON[clubID]["announcements"].length,
    "clubID":clubID,
    "name":req.body.announcement.name,
    "description":req.body.announcement.description,
    "authorID":req.session.uid,
    "postDate": Date(),
    "visible":"true"   }

  clubsJSON[clubID]["announcements"].push(announcementData);

  var jsonString = JSON.stringify(clubsJSON, null, 2);
  fs.writeFile("data/clubs.json", jsonString);
  req.flash("notification", "Announcement Created");
  res.redirect('/clubpage/'+clubID);


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