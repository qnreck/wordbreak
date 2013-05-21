//load dictionary
var fs = require('fs');


var express = require('express');
var mongoose = require('mongoose');

var fs = require('fs');
//--------DAO---------
//var dao = require('./dao.js');
var daoServer = require('./dao-server.js');
//-----------------

var app = express();

//sử dụng 2 dòng này để có thể parse dữ liệu từ POST method
//app.use(express.bodyParser());
//app.use(express.methodOverride());

/**
 * Configuration the server
 */
app.configure(function() {
    //app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser({keepExtensions: true, uploadDir: "./avatar"}));
    app.use(express.methodOverride());
    app.use(app.router);
    //app.use(express.static(__dirname + '/public'));
    app.use(allowCrossDomain);
});

app.configure('development', function() {
    app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
});

app.configure('production', function() {
    app.use(express.errorHandler());
});
//-----------------------------

app.get('/', function(request, response) {
    return daoServer.CreateSampleAccount();
});

app.get('/showall', function(request, response) {
    return daoServer.ShowAll(request, response);
});
app.get('/login/:user/:pass', function(request, response) {
    return daoServer.Login(request, response);
});

app.get('/show/:user', function(request, response) {
    return daoServer.ShowUser(request, response);
});

app.get('/getgames/:user', function(request, response) {
    return daoServer.GetGamesOfUser(request, response);
});

app.post('/register', function(request, response) {
    return daoServer.Register(request, response);
});

app.post('/savetest', function(request, response) {
    return daoServer.SaveTimeForTesting(request, response);
});

app.post('/updatetest', function(request, response) {
    return daoServer.UpdateForTesting(request, response);
});

app.get('/test', function(request, response) {
    return daoServer.TestBackbone(request, response);
});




///////////////////////////////////////////////////////////////////////////////////////////////////////////

//get all user
app.get('/getAllUser', function (req, res){
    daoServer.getAllUser(req, res);
});

//get leader board
app.get('/getLeaderBoard', function (req, res){
    daoServer.getLeaderBoard(req, res);
});

//get near you
app.get('/getNearYou/:username', function (req, res){
    daoServer.getNearYou(req, res);
});

//get offline chat message in gameplay
app.get('/getOfflineChatInGame/:username', function (req, res){
    daoServer.getOfflineChatInGame(req, res);
});

//get list user online
app.get('/getListUserOnline', function(req, res) {
    daoServer.getListUserOnline(req, res);
});

//test download image
app.get('/downloadImage', function(req, res) {
    var img = fs.readFileSync('./avatar/2268781414_tringuyen_imagesCAOIYF71.jpg');
    res.writeHead(200, {'Content-Type': 'image/jpg'});
    res.end(img, 'binary');
});

app.get('/getOfflineMessage/:username', function(req, res) {
    daoServer.getOfflineMessage(req, res);
});

app.get('/getInfo/:username', function(req, res) {
    daoServer.getInfoUser(req, res);
});

app.get('/getFriendRequest/:username', function(req, res){
    daoServer.getFriendRequest(req, res);
});
app.get('/getInfoFriend/:username', function(req, res) {
    daoServer.getInfoFriend(req, res);
});

app.get('/getAvatar/:imagename', function(req, res) {

    var img = fs.readFileSync('./avatar/' + req.params.imagename);
    res.writeHead(200, {'Content-Type': 'image/jpg'});
    res.end(img, 'binary');
});

app.post('/upload', function(req, res) {
    var username = req.body.username;
    var uploadFile = req.files.uploadingFile;
    var tmpPath = uploadFile.path;

    var rand = Math.floor((Math.random() * 10000000000) + 1000000);

    var imageName = rand + "_" + username + "_" + uploadFile.name;
    var targetPath = './avatar/' + imageName;
    fs.rename(tmpPath, targetPath, function(err) {
        if (err) {
            throw err;
        }
        fs.unlink(tmpPath, function() {
            if (err)
                throw err;
            res.send('file upload complete. ');
        });
    });

    //update information for user
    daoServer.updateAvatarUser(username, imageName);

    //update information for friend of user
    daoServer.updateFriendOfUser(username, imageName);
});


app.get('/getMean/:word', function(req, res){
    daoServer.findWord(req, res);
});



var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log('Express server listen on port ' + port);
});

function allowCrossDomain(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

function base64Encode(str) {
    var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var out = "", i = 0, len = str.length, c1, c2, c3;
    while (i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if (i === len) {
            out += CHARS.charAt(c1 >> 2);
            out += CHARS.charAt((c1 & 0x3) << 4);
            out += "==";
            break;
        }
        c2 = str.charCodeAt(i++);
        if (i === len) {
            out += CHARS.charAt(c1 >> 2);
            out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            out += CHARS.charAt((c2 & 0xF) << 2);
            out += "=";
            break;
        }
        c3 = str.charCodeAt(i++);
        out += CHARS.charAt(c1 >> 2);
        out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
        out += CHARS.charAt(c3 & 0x3F);
    }
    return out;
}