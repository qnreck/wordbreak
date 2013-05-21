"use strict";
var server = require('./server.js');

//driver mongoose connect to mongodb database
var mongoose = require('mongoose');
mongoose.connect('localhost', 'letterpressdb');
//Define schema.
var FriendSchema = new mongoose.Schema({
    username: String,
    displayname: String,
    avatar: String,
    accepted: String
});
var FriendRequestSchema = new mongoose.Schema({
    username: String,
    displayname: String,
    avatar: String
});

var accountSchema = new mongoose.Schema({
    username: String,
    password: String,
    displayname: String,
    avatar: String,
    state: Number,
    achievement:
            {
                win: Number,
                lose: Number,
                currentscore: Number,
                currentposition: String,
                highestposition: String
            },
    friendlist: [FriendSchema],
    friendrequestlist: [FriendRequestSchema]
            //gamerequestlist: Array
});
var Account = mongoose.model('account', accountSchema);

var chatmessageSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    message: String,
    time: Date,
    avatar: String
});
var ChatMessage = mongoose.model('chatmessage', chatmessageSchema);

var chatInGameSchema = new mongoose.Schema({
    idgame: String,
    message: String,
    request: String,
    receiver: String,
    avatar: String,
    time: String
});
var ChatInGame = mongoose.model('chatingame', chatInGameSchema);


var useronlineSchema = new mongoose.Schema({
    username: String,
    index: Number
});
var UserOnline = mongoose.model('useronline', useronlineSchema);
var gameSchema = new mongoose.Schema({
    gameid: Number,
    requestteduser:
            {
                username: String,
                displayname: String,
                avatar: String,
                wordlist: Array,
                score: Number,
                starttime: String,
                bonuspoint: Number,
                banpicklist: Array, // danh sách các "vị trí" bị ban 
                banpickcountmatrix: Array, // ma trận thông tin số lần sử dụng 1 kí tự nào đó		
                helpused: Boolean
            },
    accepteduser:
            {
                username: String,
                displayname: String,
                avatar: String,
                wordlist: Array,
                score: Number,
                starttime: String,
                bonuspoint: Number,
                banpicklist: Array, // danh sách các "vị trí" bị ban
                banpickcountmatrix: Array, // ma trận thông tin số lần sử dụng 1 kí tự nào đó
                helpused: Boolean
            },
    turnof: Number, // Banpick: -1 là ko có lượt và dang ở Searching State (có thể thay thế cho biến gamesate = 4 ở dưới)
    gameoptions:
            {
                size: Number,
                timeout: Number,
                invalidword: Number,
                bet: Number,
                selectedmode: Number
            },
    lettermatrix: String,
    playmatrix: String,
    specialsmatrix: String,
    lasttime: String,
    lastword: String,
    gamestate: Number, //playing, complete, requesting
    // gamestate khi banpick: 1: searching, 2: complete, 3 requesting, 4 banpicking
    gamemode: Number,
    starttime: String,
    winner: Number, //0: request user; 1: accept user; 2: due
    wintype: Number //0: normal; 1:resign
});
var Games = mongoose.model('game', gameSchema);

var dictionarySchema = new mongoose.Schema({
    letter: String,
    from: Number,
    to: Number
});
var Dictionary = mongoose.model('dictionary', dictionarySchema);

var dratsWordSchema = new mongoose.Schema({
    word: String
});
var DratsWord = mongoose.model('dratsword', dratsWordSchema);

//var dct = new Dictionary({letter: 'A', from: 0, to: 1729});
//dct.save();


///////////////////////////////////////////////////////////////////////
this.CreateSampleAccount = function() {
    console.log('Connected - Create Sample Account..!!');
    var acc = new Account({displayname: "ABCDEF", username: "abc", password: "123321", avatar: "2.jpg"});
    acc.save(function(err, acc) {
        if (err) // TODO handle the error
        {
            return false;
        }
    });
    //console.log('Save: ' + acc); 
    return true;
};
this.ShowAll = function(request, response) {
    Account.find(function(err, accs)
    {
        if (err)
        {
            throw err;
            return false;
        }
//console.log('Found: ' + accs); 
        response.send(accs);
    });
    return true;
};
this.Login = function(request, response) {

    console.log('Loginning: ' + request.params.user.toLowerCase()
            + " - " + request.params.pass);

    UserOnline.findOne({username: request.params.user.toLowerCase()}, function(err, client) {
        if (client) {

            //user was login.
            console.log("User was login");
            response.send(null);
            return false;
        } else {
		
            console.log("Find");
            Account.findOne({username: request.params.user.toLowerCase(), password: request.params.pass}, function(err, acc)
            {
                if (err || acc === null)
                {
					console.log("Err");
                    response.send(null);
                    //throw err;
                    return false;
                }
                console.log('Found: ' + acc);
                if (acc) {
				
					console.log("Found");
                    response.send(acc);

                    //update state online-------------------
                    acc.state = 1;
                    acc.save();
                    sendUpdateState(acc.username, acc.friendlist, acc.state);
                }
            });
			
			console.log("Return");
            return true;
        }
    });



};
this.ShowUser = function(request, response) {

    console.log('Showwing: ' + request.params.user.toLowerCase());
    Account.findOne({username: request.params.user.toLowerCase()}, function(err, acc)
    {
        if (err)
        {
            response.send(null);
            throw err;
            return false;
        }
//console.log('Found: ' + acc);
        response.send(acc);
    });
    return true;
};
this.GetGamesOfUser = function(request, response) {

    console.log('Getgames of: ' + request.params.user.toLowerCase());
    Games.find({$or: [{'requestteduser.username': request.params.user}, {'accepteduser.username': request.params.user}]}, function(err, games)
    {
        if (err)
        {
            response.send(null);
            throw err;
            return false;
        }
//console.log('Found: ' + games);
        response.send(games);
    });
    return true;
};
this.Register = function(request, response) {
    console.log("body: " + request.body);
    var acc;
    console.log("POST: ");
    console.log(request.body);
    acc = new Account({
        displayname: request.body.displayname,
        username: request.body.username,
        password: request.body.password,
        avatar: "newUser.png",
        state: 0,
        achievement:
                {
                    win: 0,
                    lose: 0,
                    currentscore: 500,
                    currentposition: '',
                    highestposition: ''
                },
        friendlist: [],
        friendrequestlist: []
    });
    acc.save(function(err)
    {
        if (err)
        {
            response.send(false); // tài khoản đã tồn tại trong hệ thống??
            //throw err;
            console.log("Account duplicated");
            return false;
        }
        response.send(true);
        console.log("Save complete");
    });
    return true;
};
this.SaveTimeForTesting = function(request, response) {
    console.log("body: " + request.body);
    var acc;
    console.log("POST: ");
    console.log(request.body);
    game = new Games({
        user1starttime: request.body.user1starttime,
        user2starttime: request.body.user2starttime,
        user1: {username: "nhaqnguyen"}
    });
    game.save(function(err)
    {
        if (err)
        {
            console.log("Game save Error");
            return false;
        }
        response.send(true);
        console.log("Save game complete" + game);
    });
    return true;
};
this.UpdateForTesting = function(request, response) {
    console.log("body: " + request.body);
    var acc;
    console.log("POST: ");
    console.log(request.body);
    Games.update({_id: "513d56ca805dfa7bdf1f8d0f"},
    {$set: {user1starttime: request.body.user1starttime}}, {multi: true}, function(err)
    {
        if (err)
        {
            console.log("Game Update Error");
            return false;
        }
        response.send(true);
        console.log("Update game complete");
    });
    return true;
};
///////////////////////////////////////////////////////////////////////



//Account==============================================================
//get infomation of a user.
this.getInfoUser = function(req, res) {
    var username = req.params.username;
    Account.findOne({username: username}, function(err, user) {
        res.send(user);
    });
};
//get infomation list friend of user.
this.getInfoFriend = function(req, res) {
    var username = req.params.username;
    var list = [];
    Account.findOne({username: username}, function(err, user) {
        var friendlist = user.friendlist;
        if (friendlist.length === 0) {
            console.log("list friend = 0");
            list.push({friend: ''});
            res.send(list);
        } else {
            for (var i = 0; i < friendlist.length; i++) {
                var acc = friendlist[i].accepted;

                if (acc === undefined) {
                    Account.findOne({username: friendlist[i].username}, function(err, frienduser) {
                        list.push({friend: frienduser, accepted: '2'});
                        if (list.length === friendlist.length) {
                            res.send(list);
                        }
                    });
                } else if (acc === '0') {
                    Account.findOne({username: friendlist[i].username}, function(err, frienduser) {
                        list.push({friend: frienduser, accepted: '0'});
                        if (list.length === friendlist.length) {
                            res.send(list);
                        }
                    });
                } else if (acc === '1') {
                    Account.findOne({username: friendlist[i].username}, function(err, frienduser) {
                        list.push({friend: frienduser, accepted: '1'});
                        if (list.length === friendlist.length) {
                            res.send(list);
                        }
                    });
                }
            }
        }
    });
};
//update user
this.updateAvatarUser = function(username, newAvatar) {
    Account.update({username: username}, {avatar: newAvatar}, {}, function(err, numberAffected, raw) {
        if (err) {
            console.log("errored");
        }
        console.log("update success");
    });
};
//update infomation for friend of user
this.updateFriendOfUser = function(username, newAvatar) {
    Account.findOne({username: username}, function(err, user) {
        var friends = user.friendlist;
        for (var i = 0; i < friends.length; i++) {

            Account.findOne({username: friends[i].username}, function(err, friend) {
                //list friend of user's friend.
                var listfriendoffriend = friend.friendlist;
                for (var j = 0; j < listfriendoffriend.length; j++) {
                    if (listfriendoffriend[j].username === username) {
                        listfriendoffriend[j].avatar = newAvatar;
                        friend.save(function(err) {
                            if (err) {
                                console.log("update friend error.");
                            }
                            console.log("update friend success.");
                        });
                        break;
                    }
                }
            });
        }
    });
};
//get list user online
this.getListUserOnline = function(req, res) {
    Account.find({state: 1}, function(err, listUser) {
        if (!err) {
            res.send(listUser);
        }
    });
};

//Account.find().sort({'achievement.currentscore': -1}).exec(function(err, docs) {
//    for (var i = 0; i < docs.length; i++) {
//        Account.find(function(err, accs) {
//            console.log("Update length: " + accs.length);
//            for (var i = 0; i < accs.length; i++) {
//                console.log("Update user " + i + "  : " + accs[i].username);
//                
//                for (var j = 0; j < docs.length; j++) {
//                    if (docs[j].username === accs[i].username) {
//                        accs[i].achievement.currentposition = (j + 1) + "/" + docs.length;
//                        accs[i].achievement.highestposition = (j + 1) + "/" + docs.length;
//                        accs[i].save();
//                        break;
//                    }
//                }
//            }
//        });
//    }
//});


//update infomation user when game complete
function updateInfoUser(data) {
    console.log("Update user: " + data.username);
    Account.findOne({username: data.username}, function(err, user) {
        console.log("Current score: " + user.achievement.currentscore);
        if (data.win === '1') { //win
            user.achievement.win = user.achievement.win + 1;
            user.achievement.currentscore = user.achievement.currentscore + data.score;
        } else {
            user.achievement.lose = user.achievement.lose + 1;
            user.achievement.currentscore = user.achievement.currentscore - data.score;
        }

        Account.find().sort({'achievement.currentscore': -1}).exec(function(err, docs) {
            for (var i = 0; i < docs.length; i++) {
                docs[i].achievement.currentposition = (i + 1) + "/" + docs.length;

                var index = parseInt(docs[i].achievement.highestposition.substring(0, docs[i].achievement.highestposition.indexOf('/')));
                var size = parseInt(docs[i].achievement.highestposition.substring(docs[i].achievement.highestposition.indexOf('/') + 1, docs[i].achievement.highestposition.length));
                if ((i + 1) / docs.length < index / size) {
                    docs[i].achievement.highestposition = (i + 1) + "/" + docs.length;
                }
                docs[i].save();

//                if (docs[i].username === data.username) {
//                    user.achievement.currentposition = (i + 1) + "/" + docs.length;
//
//                    var index = user.achievement.highestposition.substring(0, user.achievement.highestposition.indexOf('/'));
//                    var size = user.achievement.highestposition.substring(user.achievement.highestposition.indexOf('/') + 1, user.achievement.highestposition.length);
//                    if ((i + 1) / docs.length > index / size) {
//                        user.achievement.highestposition = (i + 1) + "/" + docs.length;
//                    }
//                    break;
//                }
            }
        });
        user.save();

        //send update for user
        UserOnline.findOne({username: data.username}, function(err, client) {
            if (client) {
                //send response to user
                var json = JSON.stringify({type: 'updateinfo', data: user.achievement});

                for (var i = 0; i < server.getClients().length; i++) {
                    if (server.getClients()[i].username === client.username) {
                        server.getClients()[i].connection.sendUTF(json);
                        console.log("send update infomation to :" + client.username);
                        break;
                    }
                }
            }
        });

        //send update for friend of user
        for (var i = 0; i < user.friendlist.length; i++) {
            UserOnline.findOne({username: user.friendlist[i].username}, function(err, client) {
                if (client) {
                    //send response to user
                    var json = JSON.stringify({type: 'updateinfofriend', data: {username: user.username, achievement: user.achievement}});

                    for (var i = 0; i < server.getClients().length; i++) {
                        if (server.getClients()[i].username === client.username) {
                            server.getClients()[i].connection.sendUTF(json);
                            console.log("send update infomation for friend of user to :" + client.username);
                            break;
                        }
                    }
                }
            });
        }
    });
}

//update position
function getCurrentPositionUser(username) {
    Account.find().sort({'achievement.currentscore': -1}).exec(function(err, docs) {
        for (var i = 0; i < docs.length; i++) {
            if (docs[i].username === username) {

            }
        }
    });
}


//Message==============================================================
//send message to client
this.sendMessage = function(clients, sender, receiver, message, time, avatar) {
    var obj = {
        time: time,
        message: message,
        sender: sender,
        avatar: avatar
    };
    var chatMessage = new ChatMessage({sender: sender, receiver: receiver, message: message, time: time, avatar: avatar});
    UserOnline.findOne({username: receiver}, function(err, client) {
        console.log("Message from " + sender + " to " + receiver);
        if (client) {
            var json = JSON.stringify({type: 'message', data: obj});

            //send to client
            for (var i = 0; i < clients.length; i++) {
                if (clients[i].username === client.username) {
                    clients[i].connection.sendUTF(json);
                    break;
                }
            }

        } else {
            chatMessage.save(function(err, data) {
                if (err) {
                    console.log("Saved data error.");
                }
                console.log("Saved data offline success.");
            });
        }
    });
};

//find offline message of a user
this.getOfflineMessage = function(req, res) {
    var username = req.params.username;
    ChatMessage.find({receiver: username}, function(err, chatMessages) {
        if (chatMessages.length > 0) {
            res.send(chatMessages);
            chatMessages.forEach(function(chatMessage) {
                chatMessage.remove();
            });
        }
    });
};


//User online===============================================
//get index of useronline
this.getIndexUserOnline = function(username) {
    UserOnline.findOne({username: username}, function(err, client) {
        return client.index;
    });
};

//save useronline
this.saveUserOnline = function(username, index) {
    var client = new UserOnline({username: username.toLowerCase(), index: index});
    client.save(function(err, data) {
        if (err) {
            console.log("Saved data error.");
        }
        console.log("Saved data username with index success.");
    });
};

//send update state online or offline for friend
function sendUpdateState(username, friendlist, state) {
    for (var i = 0; i < friendlist.length; i++) {
        UserOnline.findOne({username: friendlist[i].username}, function(err, client) {
            if (client) {
                //send response to user

                var json = JSON.stringify({type: 'updatestate', data: {username: username, state: state}});

                for (var i = 0; i < server.getClients().length; i++) {
                    if (server.getClients()[i].username === client.username) {
                        server.getClients()[i].connection.sendUTF(json);
                        console.log("send update state for friend of user to :" + client.username);
                        break;
                    }
                }
            }
        });
    }
}

//remove useronline and remove connection in array connection in clients
this.removeUseronline = function(username, clients) {
    UserOnline.findOne({username: username.toLowerCase()}, function(err, client) {
        if (!err) {

            if (client) {
                client.remove();
            } else {
                console.log("Cannot remove user: " + username);
            }

            //remove client in clients.
            for (var i = 0; i < clients.length; i++) {
                if (clients[i].username === username) {
                    clients.splice(i, 1);
                    console.log("Disconnected user: " + username);
                    break;
                }
            }
        }
    });

    Account.findOne({username: username}, function(err, user) {
        user.state = 0;
        user.save();

        sendUpdateState(user.username, user.friendlist, user.state);
    });
};

//get all user
this.getAllUser = function(req, res) {
    Account.find({}, function(err, listuser) {
        res.send(listuser);
    });
};

//get friend 
this.getFriendRequest = function(req, res) {
    var username = req.params.username;
    Account.findOne({username: username}, function(err, user) {
        res.send(user.friendrequestlist);
    });
};

////////////////Add friend
this.handlerRequestFriend = function(data) {
    Account.findOne({username: data.acceptuser.username}, function(err, user) {
        //push new request friend.
        //var newFriendRequest = new FriendRequestSchema(data.requestuser);
        user.friendrequestlist.push(data.requestuser);
        user.save();

        console.log("User: " + data.requestuser.username + " want to add friend user: " + data.acceptuser.username);
        UserOnline.findOne({username: data.acceptuser.username}, function(err, client) {
            if (client) {
                //send response to user
                var json = {type: 'requestfriend', data: data.requestuser};

                for (var i = 0; i < server.getClients().length; i++) {
                    if (server.getClients()[i].username === client.username) {
                        server.getClients()[i].connection.sendUTF(JSON.stringify(json));
                        console.log("send request friend to :" + client.username);
                        break;
                    }
                }
            } else {
                console.log("User invited is now offline.");
            }
        });
    });

    //add new friend
    Account.findOne({username: data.requestuser.username}, function(err, user) {
        var newFriend = {username: data.acceptuser.username, displayname: data.acceptuser.displayname, avatar: data.acceptuser.avatar, accepted: '0'};
        user.friendlist.push(newFriend);
        user.save();

        var json = {type: 'responserequestfriend'};
        for (var i = 0; i < server.getClients().length; i++) {
            if (server.getClients()[i].username === data.requestuser.username) {
                server.getClients()[i].connection.sendUTF(JSON.stringify(json));
                console.log("send response add friend :" + data.requestuser.username);
                break;
            }
        }
    });
};


//accepted request friend
this.handlerAcceptedRequestFriend = function(data) {
    //add new friend to accepted user
    Account.findOne({username: data.acceptuser.username}, function(err, user) {
        var newFriend = {username: data.requestuser.username, displayname: data.requestuser.displayname, avatar: data.requestuser.avatar, accepted: '1'};
        user.friendlist.push(newFriend); //add new friend

        var friendRequest = user.friendrequestlist;
        for (var i = 0; i < friendRequest.length; i++) {
            if (friendRequest[i].username === data.requestuser.username) {
                friendRequest.splice(i, 1); //remove in friend request
                break;
            }
        }

        user.save();

        var json = {type: 'responseacceptedrequestfriend'};
        for (var i = 0; i < server.getClients().length; i++) {
            if (server.getClients()[i].username === data.acceptuser.username) {
                server.getClients()[i].connection.sendUTF(JSON.stringify(json));
                console.log("send response accepted add friend :" + data.acceptuser.username);
                break;
            }
        }
    });

    //send update to request user
    Account.findOne({username: data.requestuser.username}, function(err, user) {
        var friendList = user.friendlist;
        for (var i = 0; i < friendList.length; i++) {
            if (friendList[i].username === data.acceptuser.username) {
                friendList[i].accepted = '1';
                user.save();

                UserOnline.findOne({username: data.requestuser.username}, function(err, client) {
                    if (client) {
                        Account.findOne({username: data.acceptuser.username}, function(err, acceptuser) {
                            //send update
                            var json = {type: 'updatefriend', data: acceptuser};
                            for (var i = 0; i < server.getClients().length; i++) {
                                if (server.getClients()[i].username === data.requestuser.username) {
                                    server.getClients()[i].connection.sendUTF(JSON.stringify(json));
                                    console.log("send update friend :" + data.requestuser.username);
                                    break;
                                }
                            }
                        });
                    } else {
                        console.log("User invited is now offline.");
                    }
                });

                break;
            }
        }
    });
};


//declined request friend
this.handlerDeclinedRequestFriend = function(data) {
    //remove friend request
    Account.findOne({username: data.acceptuser.username}, function(err, user) {

        var friendRequest = user.friendrequestlist;
        for (var i = 0; i < friendRequest.length; i++) {
            if (friendRequest[i].username === data.requestuser.username) {
                friendRequest.splice(i, 1); //remove in friend request
                break;
            }
        }
        user.save();

        var json = {type: 'responsedeclinedrequestfriend'};
        for (var i = 0; i < server.getClients().length; i++) {
            if (server.getClients()[i].username === data.acceptuser.username) {
                server.getClients()[i].connection.sendUTF(JSON.stringify(json));
                console.log("send response declined add friend :" + data.acceptuser.username);
                break;
            }
        }
    });

    //update to request user
    Account.findOne({username: data.requestuser.username}, function(err, user) {
        var friendList = user.friendlist;
        for (var i = 0; i < friendList.length; i++) {
            if (friendList[i].username === data.acceptuser.username) {
                friendList.splice(i, 1);
                user.save();

                UserOnline.findOne({username: data.requestuser.username}, function(err, client) {
                    if (client) {
                        Account.findOne({username: data.requestuser.username}, function(err, requesteduser) {
                            //send update
                            var json = {type: 'declinedfriend', data: requesteduser};
                            for (var i = 0; i < server.getClients().length; i++) {
                                if (server.getClients()[i].username === data.requestuser.username) {
                                    server.getClients()[i].connection.sendUTF(JSON.stringify(json));
                                    console.log("send declined request friend :" + data.requestuser.username);
                                    break;
                                }
                            }
                        });
                    } else {
                        console.log("User invited is now offline.");
                    }
                });

                break;
            }
        }
    });
};

///////////////////////////////////////////////////
///////////////Dictionary
var dictionary = new Array();
var lineReader = require('./line_reader.js');
lineReader.eachLine('./dictionary.txt', function(line, last) {
    var result = handlerWord(line);
    dictionary.push(result);
});

function handlerWord(line) {
    var word = line.substring(0, line.indexOf('\t'));
    var wordEnglish = {word: word, data: line};
    return wordEnglish;
}

//find word
this.findWord = function(req, res) {
    var word = req.params.word;
    console.log("Get meanning: " + word);

    var firstLetter = word[0].toUpperCase();
    Dictionary.findOne({letter: firstLetter}, function(err, data) {
        var count = 0;
        for (var i = data.from; i <= data.to; i++) {
            count++;
            if (dictionary[i].word.toUpperCase() === word) {
                console.log("Found word.");
                res.send(dictionary[i].data);
                break;
            }

            if (count === data.to - data.from) {
                console.log("Not found");
                res.send("not found");
            }
        }
    });
};

//get leader board
this.getLeaderBoard = function(req, res) {
    Account.find().sort({'achievement.currentscore': -1}).exec(function(err, docs) {
        var leaderBoard = [];
        for (var i = 0; i < 10; i++) {
            leaderBoard.push(docs[i]);
        }
        res.send(leaderBoard);
    });
};

//get list near you
this.getNearYou = function(req, res) {
    var userName = req.params.username;
    console.log("Get near: " + userName);
    Account.find().sort({'achievement.currentscore': -1}).exec(function(err, docs) {
        var leaderBoard = [];
        var index;
        for (var i = 0; i < docs.length; i++) {
            if (docs[i].username === userName) {
                index = i;
                break;
            }
        }

        //if > leader board / 2
        if (index > 5) {
            for (var i = index - 5; i < index + 5; i++) {
                leaderBoard.push({data: docs[i], index: i});
            }
        } else {
            for (var i = 0; i < 10; i++) {
                leaderBoard.push({data: docs[i], index: i});
            }
        }

        res.send(leaderBoard);
    });
};

//hander user used help
this.handlerHelpUsed = function(data) {
    Games.findOne({_id: data.id}, function(err, game) {
        if (data.user === '0') {
            game.requestteduser.helpused = true;
            game.save();
            UserOnline.findOne({username: game.requestteduser.username}, function(err, client) {
                if (client) {
                    var json = JSON.stringify({type: 'helpused', data: game});

                    //send request new game for user
                    for (var i = 0; i < server.getClients().length; i++) {
                        if (server.getClients()[i].username === client.username) {
                            server.getClients()[i].connection.sendUTF(json);
                            console.log("Send help used to: " + server.getClients()[i].username);
                            break;
                        }
                    }
                }
            });
        } else {
            game.accepteduser.helpused = true;
            game.save();
            
            UserOnline.findOne({username: game.accepteduser.username}, function(err, client) {
                if (client) {
                    var json = JSON.stringify({type: 'helpused', data: game});

                    //send request new game for user
                    for (var i = 0; i < server.getClients().length; i++) {
                        if (server.getClients()[i].username === client.username) {
                            server.getClients()[i].connection.sendUTF(json);
                            console.log("Send help used to: " + server.getClients()[i].username);
                            break;
                        }
                    }
                }
            });
        }
    });
};

//Game play request = new game play********************************************
this.handlerNewgame = function(clients, newGame) {
    console.log("Game id new game: " + newGame._id);

    if (newGame._id !== undefined) {
        Games.findOne({_id: newGame._id}, function(err, game) {
            game.accepteduser.username = newGame.accepteduser.username;
            game.accepteduser.displayname = newGame.accepteduser.displayname;
            game.accepteduser.avatar = newGame.accepteduser.avatar;
            game.save();
            UserOnline.findOne({username: newGame.accepteduser.username}, function(err, client) {
                if (client) {
                    var json = JSON.stringify({type: 'gamerequesting', data: game});

                    //send request new game for user
                    for (var i = 0; i < clients.length; i++) {
                        if (clients[i].username === client.username) {
                            clients[i].connection.sendUTF(json);
                            console.log("Send request new game to: " + clients[i].username);
                            break;
                        }
                    }
                }
            });

            UserOnline.findOne({username: newGame.requestteduser.username}, function(err, client) {
                if (client) {
                    var json = JSON.stringify({type: 'responsegamerequesting', data: game});

                    //send request new game for user
                    for (var i = 0; i < clients.length; i++) {
                        if (clients[i].username === client.username) {
                            clients[i].connection.sendUTF(json);
                            console.log("Send response to user request game: " + clients[i].username);
                            break;
                        }
                    }
                }
            });

        });
    } else {
        var gamePlay = new Games(newGame);
        //save new game.
        gamePlay.save(function(err, data) {

            if (err) {
                console.log("Save new game err.");
            } else {
                console.log("Save new game success. With id: " + data._id);

                UserOnline.findOne({username: newGame.accepteduser.username}, function(err, client) {
                    if (client) {
                        var json = JSON.stringify({type: 'gamerequesting', data: data});

                        //send request new game for user
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                clients[i].connection.sendUTF(json);
                                console.log("Send request new game to: " + clients[i].username);
                                break;
                            }
                        }
                    }
                });


                UserOnline.findOne({username: newGame.requestteduser.username}, function(err, client) {
                    if (client) {
                        var json = JSON.stringify({type: 'responsegamerequesting', data: data});

                        //send request new game for user
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                clients[i].connection.sendUTF(json);
                                console.log("Send response to user request game: " + clients[i].username);
                                break;
                            }
                        }
                    }
                });
            }
        });
    }
};

//handler new game random
this.handlerNewgameRandom = function(data) {
    Account.find(function(err, accs) {
        var index = Math.floor(accs.length * Math.random());
        while (accs[index].username === data.requestteduser.username) {
            index = Math.floor(accs.length * Math.random());
        }

        var gamePlay = new Games(data);
        gamePlay.accepteduser.username = accs[index].username;
        gamePlay.accepteduser.displayname = accs[index].displayname;
        gamePlay.accepteduser.avatar = "http://192.168.30.139:3000/getAvatar/" + accs[index].avatar;

        //save new game.
        gamePlay.save(function(err, data) {

            if (err) {
                console.log("Save new game err.");
            } else {
                console.log("Save new game success. With id: " + data._id);

                UserOnline.findOne({username: gamePlay.accepteduser.username}, function(err, client) {
                    if (client) {
                        var json = JSON.stringify({type: 'gamerequesting', data: data});

                        //send request new game for user
                        for (var i = 0; i < server.getClients().length; i++) {
                            if (server.getClients()[i].username === client.username) {
                                server.getClients()[i].connection.sendUTF(json);
                                console.log("Send request new game to: " + server.getClients()[i].username);
                                break;
                            }
                        }
                    }
                });


                UserOnline.findOne({username: gamePlay.requestteduser.username}, function(err, client) {
                    if (client) {
                        var json = JSON.stringify({type: 'responsegamerequesting', data: data});

                        //send request new game for user
                        for (var i = 0; i < server.getClients().length; i++) {
                            if (server.getClients()[i].username === client.username) {
                                server.getClients()[i].connection.sendUTF(json);
                                console.log("Send response to user request game: " + server.getClients()[i].username);
                                break;
                            }
                        }
                    }
                });
            }
        });
    });
};

//handler respone new game from user. gamerequestlist
this.handlerResponeInvitedGame = function(clients, resData) {
    Games.findOne({_id: resData.gameData._id}, function(err, game)
    {
        switch (resData.accepted) {
            case 1: //accepted
                game.gamestate = 1; //change to playing
                game.lasttime = resData.gameData.lasttime;
                game.starttime = new Date().toUTCString();
                game.requestteduser.starttime = new Date().toUTCString();
                game.accepteduser.starttime = new Date().toUTCString();

                var json2;
                if (game.gamemode === 3) // ban pick
                {
                    game.turnof = -1; // xem ghi chú v�? giá trị này ở phần khai báo schema
                    json2 = JSON.stringify({type: 'responseAccepted', data: game});

                    console.log("New game Ban Pick: " + json2);
                }
                else
                    json2 = JSON.stringify({type: 'responseAccepted', data: game});
                game.save();

                //send to user accepted invited
                UserOnline.findOne({username: resData.gameData.accepteduser.username}, function(err, client) {
                    if (client) {
                        //send response to user
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                clients[i].connection.sendUTF(json2);
                                break;
                            }
                        }
                    } else {
                        console.log("User invited is now offline.");
                    }
                });

                break;
            case 2: //decline
                //game.gamestate = 4; //change to requesting decline
                game.accepteduser.username = '';
                game.accepteduser.displayname = '';
                game.save();
                break;
        }

        var json1 = JSON.stringify({type: 'responseInvited', data: {gameData: game, accepted: resData.accepted}});

        //send to user requested
        UserOnline.findOne({username: resData.gameData.requestteduser.username}, function(err, client) {
            if (client) {
                //send response to user
                for (var i = 0; i < clients.length; i++) {
                    if (clients[i].username === client.username) {
                        clients[i].connection.sendUTF(json1);
                        break;
                    }
                }
            } else {
                console.log("User invited is now offline.");
            }
        });

    });

    //remove id requesting game in accout of user.
//    Account.findOne({username: resData.gameData.accepteduser.username}, function(err, user) {
//        console.log("Lenght of list requesting game: " + user.gamerequestlist.length);
//        for (var i = 0; i < user.gamerequestlist.length; i++) {
//            console.log("game Id save: " + user.gamerequestlist[i].gameId);
//            console.log("game id send: " + resData.gameData._id);
//            if (user.gamerequestlist[i].gameId.toString() === resData.gameData._id.toString()) {
//                user.gamerequestlist.splice(i, 1);
//                user.save();
//                console.log("Remove game id requesting from account of user.");
//                break;
//            }
//        }
//    });
};

this.handlerPlayWord = function(clients, data) {
    Games.findOne({_id: data.id}, function(err, game) {
        if (game) {
            console.log("Id game: " + data.id);
            game.lastword = data.word;
            game.lasttime = data.lasttime;
            game.playmatrix = data.playmatrix;
            game.requestteduser.score = data.score1;
            game.accepteduser.score = data.score2;

            var bonusPoint = data.bonuspoint;

            if (checkCompletedGame(data.playmatrix) === true) {
                console.log("Game is completed.");
                game.gamestate = 2;

                if (game.requestteduser.score > game.accepteduser.score)
                    game.winner = 0;
                else if (game.requestteduser.score === game.accepteduser.score)
                    game.winner = 2;
                else
                    game.winner = 1;

                game.wintype = 0; //normal

                //tinh diem va update thong tin cho tung user
                //update info user game with new score.
                var score;
                var bet = parseInt(getValueBet(game.gameoptions.bet));
                console.log("Bet: " + bet);
                if (game.winner === 0) {//request user win

                    score = (game.requestteduser.score - game.accepteduser.score) * bet;

                    console.log("Score: " + score);

                    var data1 = {username: game.requestteduser.username, win: '1', score: score};
                    var data2 = {username: game.accepteduser.username, win: '0', score: score};
                    updateInfoUser(data1);
                    updateInfoUser(data2);

                } else if (game.winner === 1) {//accepted user win

                    score = (game.accepteduser.score - game.requestteduser.score) * bet;
                    var data1 = {username: game.accepteduser.username, win: '1', score: score};
                    var data2 = {username: game.requestteduser.username, win: '0', score: score};
                    updateInfoUser(data1);
                    updateInfoUser(data2);
                }
            }

            //user send playword is request user
            if (game.turnof === 0) {
                game.requestteduser.wordlist.push({word: data.word});
                game.requestteduser.helpused = data.helpused;
                game.turnof = 1;
                if (game.gamemode === 2 && game.gamestate !== 2) {
                    handlerRandomSpecialLetter(game);
                }

                game.requestteduser.bonuspoint = game.requestteduser.bonuspoint + parseInt(bonusPoint);

                game.save(function(err, data) {
                    if (err) {
                        console.log("Cannot save update game");
                    }

                    //send new game play data to request user
                    UserOnline.findOne({username: game.accepteduser.username}, function(err, client) {
                        if (client) {
                            //send response to user
                            var json = JSON.stringify({type: 'playword', data: game, bonuspoint: bonusPoint});

                            for (var i = 0; i < clients.length; i++) {
                                if (clients[i].username === client.username) {
                                    clients[i].connection.sendUTF(json);
                                    console.log("send update game play to :" + client.username);
                                    break;
                                }
                            }
                        } else {
                            console.log("User invited is now offline.");
                        }
                    });

                    //send response ok for accepted user
                    UserOnline.findOne({username: game.requestteduser.username}, function(err, client) {
                        if (client) {
                            //send response to user
                            var json = JSON.stringify({type: 'responseplayword', data: game, bonuspoint: bonusPoint});

                            for (var i = 0; i < clients.length; i++) {
                                if (clients[i].username === client.username) {
                                    clients[i].connection.sendUTF(json);
                                    console.log("send respone play word to: " + client.username);
                                    break;
                                }
                            }
                        } else {
                            console.log("User invited is now offline.");
                        }
                    });
                });
            } else { //user send playword is accepted user
                game.accepteduser.wordlist.push({word: data.word});
                game.accepteduser.helpused = data.helpused;
                game.turnof = 0;

                game.accepteduser.bonuspoint = game.accepteduser.bonuspoint + parseInt(bonusPoint);

                if (game.gamemode === 2 && game.gamestate !== 2) {
                    handlerRandomSpecialLetter(game);
                }


                game.save(function(err, data) {
                    if (err) {
                        console.log("Cannot save update game");
                    }

                    UserOnline.findOne({username: game.requestteduser.username}, function(err, client) {

                        if (client) {
                            //send response to user
                            var json = JSON.stringify({type: 'playword', data: game, bonuspoint: bonusPoint});
                            for (var i = 0; i < clients.length; i++) {
                                if (clients[i].username === client.username) {
                                    clients[i].connection.sendUTF(json);
                                    console.log("send update game play to :" + client.username);
                                    break;
                                }
                            }

                        } else {
                            console.log("User invited is now offline.");
                        }
                    });

                    UserOnline.findOne({username: game.accepteduser.username}, function(err, client) {
                        if (client) {
                            //send response to user
                            var json = JSON.stringify({type: 'responseplayword', data: game, bonuspoint: bonusPoint});
                            for (var i = 0; i < clients.length; i++) {
                                if (clients[i].username === client.username) {
                                    clients[i].connection.sendUTF(json);
                                    console.log("send respone play word to: " + client.username);
                                    break;
                                }
                            }

                        } else {
                            console.log("User invited is now offline.");
                        }
                    });
                });
            }
        }
    });
};

this.handlerPassTurn = function(clients, data) {

    Games.findOne({_id: data.id}, function(err, game) {
        if (!err) {
            //update game
            game.lasttime = data.lasttime;

            //user send turn pass is request user
            if (game.turnof === 0) {
                game.turnof = 1;
                game.save(function(err, data) {
                    //send new game play data to request user
                    UserOnline.findOne({username: game.accepteduser.username}, function(err, client) {
                        if (client) {

                            //send response to user
                            var json = JSON.stringify({type: 'turnpass', data: data});

                            for (var i = 0; i < clients.length; i++) {
                                if (clients[i].username === client.username) {
                                    clients[i].connection.sendUTF(json);
                                    console.log("send update game play pass turn: " + client.username);
                                    break;
                                }
                            }
                        }
                    });

                    //send response ok for accepted user
                    UserOnline.findOne({username: game.requestteduser.username}, function(err, client) {
                        if (client) {
                            //send response to user
                            var json = JSON.stringify({type: 'responseturnpass', data: data});

                            for (var i = 0; i < clients.length; i++) {
                                if (clients[i].username === client.username) {
                                    clients[i].connection.sendUTF(json);
                                    console.log("send respone turnpass: " + client.username);
                                    break;
                                }
                            }
                        }
                    });
                });
            } else { //user send turnpass is accepted user
                game.turnof = 0;
                game.save(function(err, data) {
                    UserOnline.findOne({username: game.requestteduser.username}, function(err, client) {
                        if (client) {
                            //send response to user
                            var json = JSON.stringify({type: 'turnpass', data: data});
                            for (var i = 0; i < clients.length; i++) {
                                if (clients[i].username === client.username) {
                                    clients[i].connection.sendUTF(json);
                                    console.log("send update game play pass turn: " + client.username);
                                    break;
                                }
                            }
                        }
                    });

                    UserOnline.findOne({username: game.accepteduser.username}, function(err, client) {
                        if (client) {
                            //send response to user
                            var json = JSON.stringify({type: 'responseturnpass', data: data});
                            for (var i = 0; i < clients.length; i++) {
                                if (clients[i].username === client.username) {
                                    clients[i].connection.sendUTF(json);
                                    console.log("send respone turnpass: " + client.username);
                                    break;
                                }
                            }
                        }
                    });
                });
            }
        }
    });
};

this.handlerResignGame = function(clients, data) {
    Games.findOne({_id: data.id}, function(err, game) {
        if (!err) {
            //update game
            game.lasttime = data.lasttime;
            game.gamestate = 2;
            game.wintype = 1; //resign

            //update info user game with new score.



            //user send resign is request user
            if (game.turnof === 0) {
                game.turnof = 1;
                game.winner = 1;
                game.save(function(err, data) {
                    //send new game play data to request user
                    UserOnline.findOne({username: game.accepteduser.username}, function(err, client) {
                        if (client) {

                            //send response to user
                            var json = JSON.stringify({type: 'resign', data: data});

                            for (var i = 0; i < clients.length; i++) {
                                if (clients[i].username === client.username) {
                                    clients[i].connection.sendUTF(json);
                                    console.log("send update game play ressign: " + client.username);
                                    break;
                                }
                            }
                        } else {
                            console.log("User invited is now offline.");
                        }
                    });

                    //send response ok for accepted user
                    UserOnline.findOne({username: game.requestteduser.username}, function(err, client) {
                        if (client) {
                            //send response to user
                            var json = JSON.stringify({type: 'responseresign', data: data});

                            for (var i = 0; i < clients.length; i++) {
                                if (clients[i].username === client.username) {
                                    clients[i].connection.sendUTF(json);
                                    console.log("send respone resign: " + client.username);
                                    break;
                                }
                            }
                        } else {
                            console.log("User invited is now offline.");
                        }
                    });
                });
            } else { //user send turnpass is accepted user
                game.turnof = 0;
                game.winner = 0;
                game.save(function(err, data) {
                    UserOnline.findOne({username: game.requestteduser.username}, function(err, client) {
                        if (client) {
                            //send response to user
                            var json = JSON.stringify({type: 'resign', data: data});
                            for (var i = 0; i < clients.length; i++) {
                                if (clients[i].username === client.username) {
                                    clients[i].connection.sendUTF(json);
                                    console.log("send update game play resign: " + client.username);
                                    break;
                                }
                            }
                        } else {
                            console.log("User invited is now offline.");
                        }
                    });

                    UserOnline.findOne({username: game.accepteduser.username}, function(err, client) {
                        if (client) {
                            //send response to user
                            var json = JSON.stringify({type: 'responseresign', data: data});
                            for (var i = 0; i < clients.length; i++) {
                                if (clients[i].username === client.username) {
                                    clients[i].connection.sendUTF(json);
                                    console.log("send respone resign: " + client.username);
                                    break;
                                }
                            }
                        } else {
                            console.log("User invited is now offline.");
                        }
                    });
                });
            }

            //tinh diem va update thong tin cho tung user
            //update info user game with new score.
            var score;
            var bet = parseInt(getValueBet(game.gameoptions.bet));
            if (game.winner === 0) {//request user win

                score = (game.requestteduser.score - game.accepteduser.score) * bet + 10;
                var data1 = {username: game.requestteduser.username, win: '1', score: score};
                var data2 = {username: game.accepteduser.username, win: '0', score: score};
                updateInfoUser(data1);
                updateInfoUser(data2);

            } else if (game.winner === 1) {//accepted user win

                score = (game.accepteduser.score - game.requestteduser.score) * bet + 10;
                var data3 = {username: game.accepteduser.username, win: '1', score: score};
                var data4 = {username: game.requestteduser.username, win: '0', score: score};
                updateInfoUser(data3);
                updateInfoUser(data4);
            }
        }
    });
};

this.handlerPlayingGame = function(clients, data) {
    Games.findOne({_id: data._id}, function(err, game) {
        if (!err) {
            //user send playing is request user
            if (game.turnof === 0) {
                UserOnline.findOne({username: game.accepteduser.username}, function(err, client) {
                    if (client) {
                        //send response to user
                        var json = JSON.stringify({type: 'playing', data: game});

                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                clients[i].connection.sendUTF(json);
                                console.log("send playing game to: " + client.username);
                                break;
                            }
                        }
                    } else {
                        console.log("User invited is now offline.");
                    }
                });
            } else { //user send playing is accepted user
                UserOnline.findOne({username: game.requestteduser.username}, function(err, client) {
                    if (client) {
                        //send response to user
                        var json = JSON.stringify({type: 'playing', data: game});
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                clients[i].connection.sendUTF(json);
                                console.log("send playing game to: " + client.username);
                                break;
                            }
                        }
                    } else {
                        console.log("User invited is now offline.");
                    }
                });
            }
        }
    });
};

this.handlerNotPlayingGame = function(clients, data) {
    Games.findOne({_id: data._id}, function(err, game) {
        if (!err) {
            //user send playing is request user
            if (game.turnof === 0) {
                UserOnline.findOne({username: game.accepteduser.username}, function(err, client) {
                    if (client) {

                        //send response to user
                        var json = JSON.stringify({type: 'notplaying', data: game});

                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                clients[i].connection.sendUTF(json);
                                console.log("send not playing game to: " + client.username);
                                break;
                            }
                        }
                    } else {
                        console.log("User invited is now offline.");
                    }
                });
            } else { //user send playing is accepted user
                UserOnline.findOne({username: game.requestteduser.username}, function(err, client) {
                    if (client) {
                        //send response to user
                        var json = JSON.stringify({type: 'notplaying', data: game});
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                clients[i].connection.sendUTF(json);
                                console.log("send not playing game to: " + client.username);
                                break;
                            }
                        }
                    } else {
                        console.log("User invited is now offline.");
                    }
                });
            }
        }
    });
};

this.handlerChatMessageInGamePlay = function(clients, data) {
    var receiver = data.receiver;
    UserOnline.findOne({username: receiver}, function(err, client) {
        if (client) {
            //send response to user
            var json = JSON.stringify({type: 'chatingameplay', data: data});

            for (var i = 0; i < clients.length; i++) {
                if (clients[i].username === client.username) {
                    clients[i].connection.sendUTF(json);
                    console.log("send chat message in game play to :" + client.username);
                    break;
                }
            }
        } else {
            console.log("User offline. Save chat in game.");
            var chatInGame = new ChatInGame({idgame: data._id, message: data.message, request: data.request, receiver: data.receiver, avatar: data.avatar, time: data.time});
            chatInGame.save(function(err, data) {
                if (!err)
                    console.log("Save chat in game success.");
            });
        }
    });
};

this.getOfflineChatInGame = function(req, res) {

    var username = req.params.username;
    ChatInGame.find({receiver: username}, function(err, chatMessages) {
        if (chatMessages.length > 0) {
            res.send(chatMessages);
            chatMessages.forEach(function(chatMessage) {
                chatMessage.remove();
            });
        }
    });
};

this.handlerRemoveGame = function(clients, data) {
    Games.findOne({_id: data.id}, function(err, game) {
        if (game.requestteduser.username === data.username) {
            if (game.accepteduser.username === '') {
                game.remove();
            } else {
                game.requestteduser.username = '';
                game.save();
            }
        } else {
            if (game.requestteduser.username === '') {
                game.remove();
            } else {
                game.accepteduser.username = '';
                game.save();
            }
        }
    });
};

//updata information of game.
this.handlerUpdateData = function(data) {
    Games.findOne({_id: data._id}, function(err, game) {
        game.turnof = data.turnof;
        game.lasttime = data.lasttime;
        game.winner = data.winner;
        game.gamestate = 2;
        game.wintype = 1; //resign
        game.save();

        var score;
        var bet = parseInt(getValueBet(game.gameoptions.bet));
        if (game.winner === 0) {//request user win

            score = (game.requestteduser.score - game.accepteduser.score) * bet + 10;
            var data1 = {username: game.requestteduser.username, win: '1', score: score};
            var data2 = {username: game.accepteduser.username, win: '0', score: score};
            updateInfoUser(data1);
            updateInfoUser(data2);

        } else if (game.winner === 1) {//accepted user win

            score = (game.accepteduser.score - game.requestteduser.score) * bet + 10;
            var data3 = {username: game.accepteduser.username, win: '1', score: score};
            var data4 = {username: game.requestteduser.username, win: '0', score: score};
            updateInfoUser(data3);
            updateInfoUser(data4);
        }
    });
};

//handler auto pass turn
this.handlerAutoResign = function(gameId) {
    Games.findOne({_id: gameId}, function(err, game) {
        game.lasttime = new Date().toUTCString();
        game.gamestate = 2;
        game.wintype = 1; //resign

        if (game.turnof === 0) { //user auto resign is request user.
            game.turnof = 1;
            game.winner = 1;
        } else {
            game.turnof = 0;
            game.winner = 0;
        }

        game.save();

        //tinh diem va update thong tin cho tung user
        //update info user game with new score.
        var score;
        var bet = parseInt(getValueBet(game.gameoptions.bet));
        if (game.winner === 0) {//request user win

            score = (game.requestteduser.score - game.accepteduser.score) * bet + 10;
            var data1 = {username: game.requestteduser.username, win: '1', score: score};
            var data2 = {username: game.accepteduser.username, win: '0', score: score};
            updateInfoUser(data1);
            updateInfoUser(data2);

        } else if (game.winner === 1) {//accepted user win

            score = (game.accepteduser.score - game.requestteduser.score) * bet + 10;
            var data3 = {username: game.accepteduser.username, win: '1', score: score};
            var data4 = {username: game.requestteduser.username, win: '0', score: score};
            updateInfoUser(data3);
            updateInfoUser(data4);
        }
        UserOnline.findOne({username: game.accepteduser.username}, function(err, client) {
            var json = JSON.stringify({type: 'autoresign', data: game});
            if (client) {
                for (var i = 0; i < server.getClients().length; i++) {
                    if (server.getClients()[i].username === client.username) {
                        server.getClients()[i].connection.sendUTF(json);
                        console.log("send resopone auto ressign to: " + client.username);
                        break;
                    }
                }
            } else {
                console.log("User is now offline.");
            }
        });

        UserOnline.findOne({username: game.requestteduser.username}, function(err, client) {
            var json = JSON.stringify({type: 'autoresign', data: game});
            if (client) {
                for (var i = 0; i < server.getClients().length; i++) {
                    if (server.getClients()[i].username === client.username) {
                        server.getClients()[i].connection.sendUTF(json);
                        console.log("send auto ressign to: " + client.username);
                        break;
                    }
                }
            } else {
                console.log("User is now offline.");
            }
        });
    });
};

//handler check resign
this.handlerCheckResign = function(gameId) {
    Games.findOne({_id: gameId}, function(err, game) {

        if (game.turnof === 0) { //user send check is accepted user.
            UserOnline.findOne({username: game.requestteduser.username}, function(err, client) {
                if (client) {
                    console.log("requestteduser User duoc check online - do no thing. Waiting.............");
                } else {
                    console.log("requestteduser User duoc check offline. Send respone to user.");

                    //update game. completed
                    game.lasttime = new Date().toUTCString();
                    game.gamestate = 2;
                    game.turnof = 1;
                    game.winner = 1;

                    game.save();

                    UserOnline.findOne({username: game.accepteduser.username}, function(err, client) {
                        var json = JSON.stringify({type: 'autoresign', data: game});
                        if (client) {
                            for (var i = 0; i < server.getClients().length; i++) {
                                if (server.getClients()[i].username === client.username) {
                                    server.getClients()[i].connection.sendUTF(json);
                                    console.log("send resopone auto ressign to: " + client.username);
                                    break;
                                }
                            }
                        } else {
                            console.log("User is now offline.");
                        }
                    });
                }
            });
        } else { //user send check is request user.
            UserOnline.findOne({username: game.accepteduser.username}, function(err, client) {
                if (client) {
                    console.log("accepteduser User duoc check online - do no thing. Waiting.............");
                } else {
                    console.log("accepteduser User duoc check offline. Send respone to user.");

                    //update game. completed
                    game.lasttime = new Date().toUTCString();
                    game.gamestate = 2;
                    game.turnof = 0;
                    game.winner = 0;

                    game.save();

                    UserOnline.findOne({username: game.requestteduser.username}, function(err, client) {
                        var json = JSON.stringify({type: 'autoresign', data: game});
                        if (client) {
                            for (var i = 0; i < server.getClients().length; i++) {
                                if (server.getClients()[i].username === client.username) {
                                    server.getClients()[i].connection.sendUTF(json);
                                    console.log("send resopone auto ressign to: " + client.username);
                                    break;
                                }
                            }
                        } else {
                            console.log("User is now offline.");
                        }
                    });
                }
            });
        }
    });
};

//handler drats word
this.handlerDratsWord = function(word, username) {
    var drats = {word: word};
    var dratsWord = new DratsWord(drats);
    dratsWord.save(function(err, drats) {
        if (!err) {
            console.log("Save drats word success.");
        }
    });

    UserOnline.findOne({username: username}, function(err, client) {
        var json = JSON.stringify({type: 'responsedrats'});
        if (client) {
            for (var i = 0; i < server.getClients().length; i++) {
                if (server.getClients()[i].username === client.username) {
                    server.getClients()[i].connection.sendUTF(json);
                    console.log("send resopone drats word to: " + client.username);
                    break;
                }
            }
        } else {
            console.log("User is now offline.");
        }
    });
};

//check game is completed or not
function checkCompletedGame(playmatrix) {
    var count = 0;
    for (var i = 0; i < playmatrix.length; i++) {
        if (playmatrix[i] !== '0') {
            count++;
        } else {
            return false;
        }

        if (i === playmatrix.length - 1) {
            if (count === playmatrix.length) {
                return true;
            }
        }
    }
}

//return bet value from key value
function getValueBet(keyValue) {
    switch (keyValue) {
        case 1:
            return '1';
            break;
        case 2:
            return '5';
            break;
        case 3:
            return '10';
            break;
        case 4:
            return '20';
            break;
        case 5:
            return '50';
            break;
        case 6:
            return '100';
            break;
    }
}

//random index specials letter in specials mode
function randomSpecialsLetter(size) {
    var index;
    switch (size) {
        case 1:
            index = Math.floor((Math.random() * 100) % 25);
            break
        case 2:
            index = Math.floor((Math.random() * 100) % 36);
            break;
        case 3:
            index = Math.floor((Math.random() * 100) % 49);
            break;
    }
    return index;
}

//add random index to special matrix to send clint
function handlerRandomSpecialLetter(data) {
    if (data.specialsmatrix.indexOf("+") !== -1) {
        data.specialsmatrix = data.specialsmatrix.substring(0, data.specialsmatrix.indexOf("+"));
    }

    if (data.gamemode === 2) {
        var value, temp;


        var check = Math.floor(Math.random() * 10 - 5);
        if (check <= 1)
        {
            value = randomSpecialsLetter(data.gameoptions.size);
            temp = value;
            data.specialsmatrix = data.specialsmatrix + "+" + value;
        } else
            data.specialsmatrix = data.specialsmatrix + "+" + "-1";

        check = Math.floor(Math.random() * 10 - 5);
        if (check <= 1) {
            value = randomSpecialsLetter(data.gameoptions.size);

            while (value === temp) {
                value = randomSpecialsLetter(data.gameoptions.size);
            }
            data.specialsmatrix = data.specialsmatrix + "," + value;
        } else
            data.specialsmatrix = data.specialsmatrix + "," + "-1";
    }
}


//---------------------------------

this.handlerSubmitOnBanpickSearching = function(clients, data) {
    out("Handle searching");
    // Cần kiểm tra thêm lasttime của từng player
    //------------------------------------

    Games.findOne({_id: data.id}, function(err, game) {
        if (game.requestteduser.username === data.username)
        {
            out("Req Player: " + data.username);

            game.requestteduser.banpickcountmatrix = data.banpickcountmatrix;

            // Tại đây, push vào letterPosition chứ ko phải words
            game.requestteduser.wordlist.push({word: data.lettersPosition});
            game.requestteduser.score = game.requestteduser.wordlist.length;
            game.save(function(err, savedData) {

                //out("Saved Object: " + savedData);
                if (err)
                {
                    throw err;
                    return;
                }

                UserOnline.findOne({username: savedData.requestteduser.username}, function(err, client) {
                    //out("reqUser Object: " + client);
                    if (client) {
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                //console.log("getUserOnlineByUsername found: " + client.username + " at " + i);
                                //----------------------------
                                var json = JSON.stringify({type: 'responsesubmitwordonbanpicksearching', data: savedData});

                                clients[i].connection.sendUTF(json);
                                console.log("response submitwordonbanpicksearching: " + json);
                                //----------------------------
                                break;
                            }
                        }
                    } else {
                        //console.log("getUserOnlineByUsername not found: " + username);
                        //throw "Not Found User: " + username;
                    }
                });

                UserOnline.findOne({username: savedData.accepteduser.username}, function(err, client) {
                    //out("AccUser Object: " + client);
                    if (client) {
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                //console.log("getUserOnlineByUsername found: " + client.username + " at " + i);
                                //----------------------------
                                var json = JSON.stringify({type: 'onsubmitwordonbanpicksearching', data: savedData});
                                clients[i].connection.sendUTF(json);
                                console.log("onsubmitwordonbanpicksearching: " + json);
                                //----------------------------
                                break;
                            }
                        }
                    } else {
                        //console.log("getUserOnlineByUsername not found: " + username);
                        //throw "Not Found User: " + username;
                    }
                });
            });
        }
        else
        {
            out("Acc Player: " + data.username);

            game.accepteduser.banpickcountmatrix = data.banpickcountmatrix;

            // Tại đây, push vào letterPosition chứ ko phải words
            game.accepteduser.wordlist.push({word: data.lettersPosition});
            game.accepteduser.score = game.accepteduser.wordlist.length;
            game.save(function(err, savedData) {

                out("Saved Object: " + savedData);
                if (err)
                {
                    throw err;
                    return;
                }


                UserOnline.findOne({username: savedData.requestteduser.username}, function(err, client) {
                    //out("reqUser Object: " + client);
                    if (client) {
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                //console.log("getUserOnlineByUsername found: " + client.username + " at " + i);
                                //----------------------------
                                var json = JSON.stringify({type: 'onsubmitwordonbanpicksearching', data: savedData});
                                clients[i].connection.sendUTF(json);
                                console.log("onsubmitwordonbanpicksearching: " + json);
                                //----------------------------
                                break;
                            }
                        }
                    } else {
                        //console.log("getUserOnlineByUsername not found: " + username);
                        //throw "Not Found User: " + username;
                    }
                });

                UserOnline.findOne({username: savedData.accepteduser.username}, function(err, client) {
                    //out("AccUser Object: " + client);
                    if (client) {
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                //console.log("getUserOnlineByUsername found: " + client.username + " at " + i);
                                //----------------------------
                                var json = JSON.stringify({type: 'responsesubmitwordonbanpicksearching', data: savedData});

                                clients[i].connection.sendUTF(json);
                                console.log("response submitwordonbanpicksearching: " + json);
                                //----------------------------
                                break;
                            }
                        }
                    } else {
                        //console.log("getUserOnlineByUsername not found: " + username);
                        //throw "Not Found User: " + username;
                    }
                });
            });
        }

    });
};
this.handlerUserCompleteSearching = function(clients, data) {
    out("Handle UserCompleteSearching");
    Games.findOne({_id: data.id}, function(err, game) {

        if (IsRequestedUser(data, game))
        {
            out("requestteduser " + game.requestteduser.starttime);
            if (game.requestteduser.starttime === "complete")
                return;
            else
                game.requestteduser.starttime = "complete";
        }
        else
        {
            out("accepteduser " + game.accepteduser.starttime);
            if (game.accepteduser.starttime === "complete")
                return;
            else
                game.accepteduser.starttime = "complete";
        }

        //---Phần này dùng kiểm tra xem liệu cả 2 có hoàn tất searching hết chưa
        // nếu hoàn tất rồi thì send v�? msg (ChangeStateToSearching) -> sẽ send ở cuối hàm save bên dưới
        if (game.requestteduser.starttime === "complete" && game.accepteduser.starttime === "complete")
        {
            out("All complete");
            game.gamestate = 4; // chuyển qua banpickstate
            game.turnof = 0;
            game.lasttime = (new Date()).toUTCString();
        }
        game.save(function(err, savedData) {
            if (err)
            {
                throw err;
                return;
            }
            if (IsRequestedUser(data, game))
            {
                UserOnline.findOne({username: savedData.requestteduser.username}, function(err, client) {
                    //out("--reqUser Object: " + client.username);
                    if (client) {
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                //----------------------------								
                                var json = JSON.stringify({type: 'banpick_responsecompletesearchingtime', data: savedData});

                                clients[i].connection.sendUTF(json);
                                console.log("banpick_responsecompletesearchingtime");
                                //----------------------------
                                break;
                            }
                        }
                    } else {
                        //console.log("getUserOnlineByUsername not found: " + username);
                    }
                });
                UserOnline.findOne({username: savedData.accepteduser.username}, function(err, client) {
                    //out("--accUser Object: " + client.username);
                    if (client) {
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                //----------------------------								
                                var json = JSON.stringify({type: 'banpick_oncompletesearchingtime', data: savedData});

                                clients[i].connection.sendUTF(json);
                                console.log("banpick_oncompletesearchingtime");
                                //----------------------------
                                break;
                            }
                        }
                    } else {
                        //console.log("getUserOnlineByUsername not found: " + username);
                    }
                });
            }
            else
            {
                UserOnline.findOne({username: savedData.requestteduser.username}, function(err, client) {
                    //out("--reqUser Object: " + client.username);
                    if (client) {
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                //----------------------------										
                                var json = JSON.stringify({type: 'banpick_oncompletesearchingtime', data: savedData});

                                clients[i].connection.sendUTF(json);
                                console.log("banpick_oncompletesearchingtime");
                                //----------------------------
                                break;
                            }
                        }
                    } else {
                        //console.log("getUserOnlineByUsername not found: " + username);
                    }
                });
                UserOnline.findOne({username: savedData.accepteduser.username}, function(err, client) {
                    //out("--accUser Object: " + client.username);
                    if (client) {
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                //----------------------------		
                                var json = JSON.stringify({type: 'banpick_responsecompletesearchingtime', data: savedData});

                                clients[i].connection.sendUTF(json);
                                console.log("banpick_responsecompletesearchingtime");
                                //----------------------------
                                break;
                            }
                        }
                    } else {
                        //console.log("getUserOnlineByUsername not found: " + username);
                    }
                });
            }

            if (game.requestteduser.starttime === "complete" && game.accepteduser.starttime === "complete")
            {
                // Send change state response to client
                UserOnline.findOne({username: savedData.requestteduser.username}, function(err, client) {
                    //out("--reqUser Object: " + client.username);
                    if (client) {
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                //----------------------------
                                var json = JSON.stringify({type: 'banpick_changestatetobanpicking', data: savedData});

                                clients[i].connection.sendUTF(json);
                                console.log("banpick_changestatetobanpicking " + game.requestteduser.starttime + "-" + game.accepteduser.starttime);
                                //----------------------------
                                break;
                            }
                        }
                    } else {
                        //console.log("getUserOnlineByUsername not found: " + username);
                    }
                });
                UserOnline.findOne({username: savedData.accepteduser.username}, function(err, client) {
                    //out("--accUser Object: " + client.username);
                    if (client) {
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                //----------------------------		
                                var json = JSON.stringify({type: 'banpick_changestatetobanpicking', data: savedData});

                                clients[i].connection.sendUTF(json);
                                console.log("banpick_changestatetobanpicking");
                                //----------------------------
                                break;
                            }
                        }
                    } else {
                        //console.log("getUserOnlineByUsername not found: " + username);
                    }
                });
            }
        });

    });
};

this.handlerBothOfUserCompleteSearching = function(clients, data) {
    out("Handle Both Of UserCompleteSearching");
    Games.findOne({_id: data.id}, function(err, game) {
        if (err)
        {
            throw err;
            return;
        }
        game.requestteduser.starttime = "complete";
        game.accepteduser.starttime = "complete";

        //---Phần này dùng kiểm tra xem liệu cả 2 có hoàn tất searching hết chưa
        // nếu hoàn tất rồi thì send v�? msg (ChangeStateToSearching) -> sẽ send ở cuối hàm save bên dưới
        out("All complete");
        game.gamestate = 4; // chuyển qua banpickstate
        game.turnof = 0; // sửa turn chỗ này
        game.lasttime = data.time;

        game.save(function(err, savedData) {
            if (err)
            {
                throw err;
                return;
            }
            // Send change state response to client
            UserOnline.findOne({username: savedData.requestteduser.username}, function(err, client) {
                //out("--reqUser Object: " + client.username);
                if (client) {
                    for (var i = 0; i < clients.length; i++) {
                        if (clients[i].username === client.username) {
                            //----------------------------
                            var json = JSON.stringify({type: 'banpick_changestatetobanpicking', data: savedData});

                            clients[i].connection.sendUTF(json);
                            console.log("banpick_changestatetobanpicking " + game.requestteduser.starttime + "-" + game.accepteduser.starttime);
                            //----------------------------
                            break;
                        }
                    }
                } else {
                    //console.log("getUserOnlineByUsername not found: ");
                }
            });
            UserOnline.findOne({username: savedData.accepteduser.username}, function(err, client) {
                //out("--accUser Object: " + client.username);
                if (client) {
                    for (var i = 0; i < clients.length; i++) {
                        if (clients[i].username === client.username) {
                            //----------------------------		
                            var json = JSON.stringify({type: 'banpick_changestatetobanpicking', data: savedData});

                            clients[i].connection.sendUTF(json);
                            console.log("banpick_changestatetobanpicking");
                            //----------------------------
                            break;
                        }
                    }
                } else {
                    //console.log("getUserOnlineByUsername not found: ");
                }
            });
        });

    });
};
this.handlerSubmitBannedLetterPosition = function(clients, data) {
    out("Handle banpicking");
    Games.findOne({_id: data.id}, function(err, game) {

        game.lastword = data.word;
        game.lasttime = data.lasttime;
        game.playmatrix = data.playmatrix;

        // biến dùng xác định xem là đã ban đủ kí tự của mỗi ngư�?i hay chưa.
        // nếu đủ thì là GameCompleted
        var IsGameCompleted = false;

        var banpickLetterMax = 2; // số kí tự tối đa có thể ban cho 1 ván game, sẽ thay đổi theo size



        if (game.turnof === 0) // Turn = 0 tức là ngư�?i gửi là reqUser
        {
            //------------
            // phần này là tính toán để loại b�? từ của đối phương sau khi mình banpick
            //------------
            game.turnof = 1;
            game.requestteduser.banpicklist.push(data.letterposition); // đưa vị trí từ vào banpicklist	

            // xét xem đi�?u kiện GameCompleted đã th�?a hay chưa				
            if (banpickLetterMax === game.requestteduser.banpicklist.length
                    && banpickLetterMax === game.accepteduser.banpicklist.length)
            {
                game.gamestate = 2; // complete				
                //tính điểm (d�?i thử ra bên ngoài)
                game.requestteduser.score = game.requestteduser.wordlist.length
                        - CountBannedWordsInList(game.requestteduser.wordlist, game.accepteduser.banpicklist);
                game.accepteduser.score = game.accepteduser.wordlist.length
                        - CountBannedWordsInList(game.accepteduser.wordlist, game.requestteduser.banpicklist);
                // xử lý word
                game.requestteduser.wordlist = ProcessWordsListForBanned(
                        game.requestteduser.wordlist, game.accepteduser.banpicklist);
                game.accepteduser.wordlist = ProcessWordsListForBanned(
                        game.accepteduser.wordlist, game.requestteduser.banpicklist);
            }
            else
            {
                // tính điểm Acceptted
                game.accepteduser.score = game.accepteduser.wordlist.length
                        - CountBannedWordsInList(game.accepteduser.wordlist, game.requestteduser.banpicklist);
            }


            game.save(function(err, savedData) {
                //out("Saved Object: " + savedData);
                if (err)
                {
                    throw err;
                    return;
                }

                UserOnline.findOne({username: savedData.requestteduser.username}, function(err, client) {

                    //out("reqUser Object: " + client.username);
                    if (client) {
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                //console.log("getUserOnlineByUsername found: " + client.username + " at " + i);
                                //----------------------------								
                                var json = JSON.stringify({type: 'responsesubmitbannedletterposition', data: savedData});

                                clients[i].connection.sendUTF(json);
                                console.log("response submitbannedletterposition: ");
                                //----------------------------
                                break;
                            }
                        }
                    } else {
                        //console.log("getUserOnlineByUsername not found: " + username);
                        //throw "Not Found User: " + username;
                    }
                });

                UserOnline.findOne({username: savedData.accepteduser.username}, function(err, client) {

                    //out("AccUser Object: " + client.username);
                    if (client) {
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                //console.log("getUserOnlineByUsername found: " + client.username + " at " + i);
                                //----------------------------
                                var json = JSON.stringify({type: 'onsubmitbannedletterposition', data: savedData});

                                clients[i].connection.sendUTF(json);
                                console.log("Send data onsubmitbannedletterposition: ");
                                //----------------------------
                                break;
                            }
                        }
                    } else {
                        //console.log("getUserOnlineByUsername not found: " + username);
                        //throw "Not Found User: " + username;
                    }
                });

                // xét xem GameCompleted  hay chưa				
                if (savedData.gamestate === 2)
                {
                    out("GameCompleted");
                    Banpick_SendCompleteNotificationToClient(clients, savedData);
                }
            });
        }
        else // Turn = 1 tức là ngư�?i gửi là accUser
        {
            //------------
            // phần này là tính toán để loại b�? từ của đối phương sau khi mình banpick
            //------------
            game.turnof = 0;
            game.accepteduser.banpicklist.push(data.letterposition); // đưa vị trí từ vào banpicklist

            // xét xem đi�?u kiện GameCompleted đã th�?a hay chưa				
            if (banpickLetterMax === game.requestteduser.banpicklist.length
                    && banpickLetterMax === game.accepteduser.banpicklist.length)
            {
                game.gamestate = 2; // complete
                game.lasttime = (new Date()).toUTCString();
                // tính điểm
                game.requestteduser.score = game.requestteduser.wordlist.length
                        - CountBannedWordsInList(game.requestteduser.wordlist, game.accepteduser.banpicklist);
                game.accepteduser.score = game.accepteduser.wordlist.length
                        - CountBannedWordsInList(game.accepteduser.wordlist, game.requestteduser.banpicklist);
                // xử lý word
                game.requestteduser.wordlist = ProcessWordsListForBanned(
                        game.requestteduser.wordlist, game.accepteduser.banpicklist);
                game.accepteduser.wordlist = ProcessWordsListForBanned(
                        game.accepteduser.wordlist, game.requestteduser.banpicklist);
            }
            else
            {
                // tính điểm Requested
                game.requestteduser.score = game.requestteduser.wordlist.length
                        - CountBannedWordsInList(game.requestteduser.wordlist, game.accepteduser.banpicklist);
            }

            game.save(function(err, savedData) {
                //out("Saved Object: " + savedData);
                if (err)
                {
                    throw err;
                    return;
                }


                UserOnline.findOne({username: savedData.requestteduser.username}, function(err, client) {
                    //out("reqUser Object: " + client.username);
                    if (client) {
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                //console.log("getUserOnlineByUsername found: " + client.username + " at " + i);
                                //----------------------------
                                var json = JSON.stringify({type: 'onsubmitbannedletterposition', data: savedData});

                                clients[i].connection.sendUTF(json);
                                console.log("Send data onsubmitbannedletterposition: ");
                                //----------------------------
                                break;
                            }
                        }
                    } else {
                        //console.log("getUserOnlineByUsername not found: " + username);
                        //throw "Not Found User: " + username;
                    }
                });

                UserOnline.findOne({username: savedData.accepteduser.username}, function(err, client) {
                    //out("AccUser Object: " + client.username);
                    if (client) {
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].username === client.username) {
                                //console.log("getUserOnlineByUsername found: " + client.username + " at " + i);
                                //----------------------------
                                var json = JSON.stringify({type: 'responsesubmitbannedletterposition', data: savedData});

                                clients[i].connection.sendUTF(json);
                                console.log("response submitbannedletterposition: ");
                                //----------------------------
                                break;
                            }
                        }
                    } else {
                        //console.log("getUserOnlineByUsername not found: " + username);
                    }
                });


                // xét xem GameCompleted  hay chưa				
                if (savedData.gamestate === 2)
                {
                    out("GameCompleted");
                    Banpick_SendCompleteNotificationToClient(clients, savedData);
                }
            });
        }

    });
};

function Banpick_SendCompleteNotificationToClient(clients, savedData) {
    UserOnline.findOne({username: savedData.requestteduser.username}, function(err, client) {
        //out("reqUser Object: " + client.username);
        if (client) {
            for (var i = 0; i < clients.length; i++) {
                if (clients[i].username === client.username) {
                    //----------------------------					
                    var json = JSON.stringify({type: 'banpick_completegame', data: savedData});
                    clients[i].connection.sendUTF(json);
                    console.log("Send data banpick_COMPLETEGAME: ");
                    //----------------------------
                    break;
                }
            }
        } else {
            //console.log("getUserOnlineByUsername not found: " + username);
        }
    });

    UserOnline.findOne({username: savedData.accepteduser.username}, function(err, client) {
        //out("AccUser Object: " + client.username);
        if (client) {
            for (var i = 0; i < clients.length; i++) {
                if (clients[i].username === client.username) {
                    //----------------------------					
                    var json = JSON.stringify({type: 'banpick_completegame', data: savedData});
                    clients[i].connection.sendUTF(json);
                    console.log("Send data banpick_COMPLETEGAME: ");
                    //----------------------------
                    break;
                }
            }
        } else {
            //console.log("getUserOnlineByUsername not found: " + username);
        }
    });
}
// xử lý wordlist khi completeGame banpick
function ProcessWordsListForBanned(wordsList, bannedPositionList) {
    var word;
    //var letterlist;
    for (var i = 0; i < wordsList.length; i++) {
        word = wordsList[i].word;
        var bannedIndex = -1;
        //out("bannedPositionList: " + bannedPositionList);
        for (var j = 0; j < bannedPositionList.length; j++) {
            bannedIndex = word.indexOf(bannedPositionList[j][0]);

            //out('bannedIndex ' + bannedIndex + " bannedPositionList[j][0]: " + bannedPositionList[j][0]);
            if (-1 !== bannedIndex) // tìm thấy kí tự bị ban
            {
                // xử lý banned Words
                //wordsList[i].word.unshift(-1);
                out('Word ' + wordsList[i].word + " failed by " + bannedPositionList[j][0]);
                wordsList[i].word[bannedIndex] = wordsList[i].word[bannedIndex] + 100; // tăng lên để đánh dấu
                //break;

                if (-1 !== wordsList[i].word[0]) // kiểm tra phần tử đầu
                {
                    wordsList[i].word.unshift(-1); // mark để biết từ bị ban
                }
            }
        }
        //out("----------WordPositionList: " + wordsList[i].word);
    }
    return wordsList;
}

// tính toán điểm số còn lại khi CompletGame banpick, hoặc khi đang panpick
function CountBannedWordsInList(wordsList, bannedPositionList) {
    var word;
    //var letterlist;
    var bannedWordCount = 0;
    for (var i = 0; i < wordsList.length; i++) {
        word = wordsList[i].word;
        var bannedIndex = -1;
        for (var j = 0; j < bannedPositionList.length; j++) {
            bannedIndex = -1;
            bannedIndex = word.indexOf(bannedPositionList[j][0]);
            if (-1 !== bannedIndex) // tìm thấy kí tự bị ban
            {
                bannedWordCount += 1;
                break;
            }
        }
    }
    return bannedWordCount;
}

//------Function to Show Log
function out(message) {
    console.log(message);
}

function IsRequestedUser(receivedData, foundData) {
    if (foundData.requestteduser.username === receivedData.username)
        return true;
    return false;
}
