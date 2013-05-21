(function() {
    "use strict";
    require('./restful.js');
    var daoServer = require('./dao-server.js');


    var webSocketsServerPort = 1337;
    var webSocketServer = require('websocket').server;
    var http = require('http');

    // list of currently connected clients (users)
    var clients = new Array();

    //HTTP server
    var server = http.createServer(function(request, response) {

    });
    server.listen(webSocketsServerPort, function() {
        console.log("Websocket server is listening on port " + webSocketsServerPort);
    });

    //WebSocket server
    var wsServer = new webSocketServer({
        httpServer: server
    });

    //when client connect to websocket server
    wsServer.on('request', function(request) {
        var connection = request.accept(null, request.origin);

        //username client connect to server
        var userName = false;
        console.log((new Date()) + ' Connection accepted.');

        // user sent some message.
        connection.on('message', function(message) {
            try {
                var json = JSON.parse(message.utf8Data);
            } catch (e) {
                console.log('This doesn\'t look like a valid JSON: ', message.data);
                return;
            }

            switch (json.type) {
                case 'username':
                    console.log("new Connect: " + json.data);
                    // remember user name.
                    userName = json.data;

                    //save username client online and index in array clients online.
                    var client = {'username': userName, 'connection': connection};

                    //var index = clients.push(connection) - 1;

                    var index = clients.push(client) - 1;
                    console.log(json.data + " : " + index);

                    //update state online for user.
                    daoServer.saveUserOnline(userName, index);

                    break;
                case 'chatMessage':
                    daoServer.sendMessage(clients, json.data.sender, json.data.receiver, json.data.message, json.data.time, json.data.avatar);
                    break;

                case 'requestingGame':
                    var gamePlay = json.data;
                    daoServer.handlerNewgame(clients, gamePlay);
                    break;

                case 'requestingGameRandom':
                    var data = json.data;
                    daoServer.handlerNewgameRandom(data);
                    break;

                case 'responseInvited':
                    var data = json.data;
                    daoServer.handlerResponeInvitedGame(clients, json.data);
                    break;

                case 'playword':
                    var data = json.data;
                    daoServer.handlerPlayWord(clients, data);
                    break;

                case 'passturn':
                    var data = json.data;
                    daoServer.handlerPassTurn(clients, data);
                    break;

                case 'resign':
                    var data = json.data;
                    daoServer.handlerResignGame(clients, data);
                    break;

                case 'playing':
                    var data = json.data;
                    daoServer.handlerPlayingGame(clients, data);
                    break;
                case 'notplaying':

                    var data = json.data;
                    daoServer.handlerNotPlayingGame(clients, data);
                    break;

                case 'chatingameplay':
                    var data = json.data;
                    daoServer.handlerChatMessageInGamePlay(clients, data);
                    break;

                case 'removegame':
                    var data = json.data;
                    daoServer.handlerRemoveGame(clients, data);
                    break;

                case 'update':
                    var data = json.data;
                    daoServer.handlerUpdateData(data);
                    break;

                case 'autoresign':
                    console.log("Receiver auto resign.");
                    daoServer.handlerAutoResign(json.gameId);
                    break;

                case 'checkresign':
                    console.log("Receiver check resign.");
                    daoServer.handlerCheckResign(json.gameId);
                    break;

                case 'drats':
                    console.log("Receiver check resign.");
                    daoServer.handlerDratsWord(json.word, json.username);
                    break;

                case 'requestfriend':
                    var data = json.data;
                    daoServer.handlerRequestFriend(data);
                    break;

                case 'accpetdrequestfriend':
                    var data = json.data;
                    daoServer.handlerAcceptedRequestFriend(data);
                    break;

                case 'declinedrequestfriend':
                    var data = json.data;
                    daoServer.handlerDeclinedRequestFriend(data);
                    break;

                case 'helpused':
                    var data = json.data;
                    daoServer.handlerHelpUsed(data);
                    break;

                        //---------------------------------------
                        case 'submitwordonbanpicksearching':
                    {
                        var data = json.data;
                        console.log("Receive submitwordonbanpicksearching id: " + data.id);
                        daoServer.handlerSubmitOnBanpickSearching(clients, data);
                    }
                    break;
                case 'submitbannedletterposition':
                    {
                        var data = json.data;
                        console.log("Receive submitbannedletterposition id: " + data.id);
                        daoServer.handlerSubmitBannedLetterPosition(clients, data);
                    }
                    break;
                case 'banpick_completesearchingtime':
                    {
                        var data = json.data;
                        console.log("Receive handlerUserCompleteSearching id: " + data.id);
                        daoServer.handlerUserCompleteSearching(clients, data);
                    }
                    break;
                case 'banpick_bothofusercompletesearchingtime':
                    {
                        var data = json.data;
                        console.log("Receive handler-BothOf-UserCompleteSearching id: " + data.id);
                        daoServer.handlerBothOfUserCompleteSearching(clients, data);
                    }
                    break;

            }
        });

        // user disconnected
        connection.on('close', function(connection) {
            if (userName !== false) {
                daoServer.removeUseronline(userName, clients);
            }
        });
    });


    function getClients() {
        return  clients;
    }
    ;

    module.exports.getClients = getClients;
})();
