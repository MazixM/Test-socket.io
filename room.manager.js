var fs = require("fs");
var utils = require("./utils");
var chatManager = require("./chat.manager");
//const Room = require("./models/room");
const User = require("./models/user");
//Lista haseł do zgadnięcia
var passwords = JSON.parse(fs.readFileSync("passwords.json", "utf8"));

const size = function (obj) {
  var size = 0,
    key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

module.exports = {
  start: function (io) {
    io.on("connection", function (socket) {
      //New user joined
      socket.on("new user", function (user) {
        joinToRoom(socket, user);
        socket.join(user.roomId);
        socket.user = new User(socket.id, nick);
        socket.roomId = user.roomId;
        socket.nick = user.nick;
        chatManager.sendSystemMessageToSender(
          socket,
          "Pomyślnie dołączono do pokoju o id: " + socket.roomId
        );
        chatManager.joinMessage(socket);
        findNewDrawingPerson(socket);
        chatManager.sendSystemMessageToSender(
          socket,
          "Witaj " + user.nick + "! Twoje id, to: " + socket.id
        );
      });
      //Some user send message
      socket.on("chat message", function (message) {
        chatManager.sendUserMessageToAllInRoom(socket);
        if (
          message.toLowerCase().trim() == actualPassword.toLowerCase().trim() &&
          actualDrawingPlayerId != socket.id
        ) {
          //Aktualnie gra toczy się do 5 wygranych
          if (points[socket.id] == undefined) {
            points[socket.id] = 0;
          }
          if (++points[socket.id] < 5) {
            io.emit(
              "chat message",
              message.nick +
                " zgaduje hasło i zdobywa 1 punkt! Łącznie posiada ich : " +
                points[socket.id]
            );
          } else {
            //Informacja o wygranej
            io.emit(
              "chat message",
              message.nick + " zgaduje hasło i wygrywa! Gratulacje! "
            );
            //Reset wyników
            delete points;
            points = {};
          }
          //Znajdź nowe hasło
          createNewRandomPassword();
          //Wybranie nowej osoby rysującej
          findNewDrawingPerson();
          //Czyszczenie tablicy
          io.emit("clear");
        }
        //commands
        if (actualDrawingPlayerId != socket.id && message == "/losuj") {
          //Znajdź nowe hasło
          createNewRandomPassword();
          //Wybranie nowej osoby rysującej
          findNewDrawingPerson();
        }
        if (actualDrawingPlayerId == socket.id && message == "/nowe") {
          //Generowanie nowego hasła przez osobę rysującą
          createNewRandomPassword();
          chatManager.newPasswordMessage(socket, actualPassword);
        }
      });
      //Rysowanie lini
      socket.on("drawLine", function (lineFromTo) {
        //Zapobieganie oszukiwaniu przy wyborze lini
        if (lineFromTo.lineWidth > 10 || lineFromTo.lineWidth < 1) {
          return;
        }
        //Tylko osoba rysująca może rysować
        if (socket.id == actualDrawingPlayerId) {
          socket.broadcast.emit("drawLine", lineFromTo);
        }
      });
      //Tylko osoba rysująca może wyczyścić innym canvas
      socket.on("clear", function () {
        if (socket.id == actualDrawingPlayerId) {
          socket.broadcast.emit("clear");
        }
      });
      socket.on("disconnect", function () {
        chatManager.leftMessage(socket);
      });
    });

    //Event podczas połączenia nowej osoby
    // io.sockets.on("connection", newConnection);
    // function newConnection(socket) {
    //   myClientList[socket.id] = socket;
    //   //   socket.emit(
    //   //     "chat message",
    //   //     utils.getCurrentTime() + " " + "Witaj! Twoje id, to: " + socket.id
    //   //   );
    //   //Todo pobranie wartości z currentPlayersId
    //   currentPlayersCount += 1;
    //   io.emit("currentPlayersCount", currentPlayersCount);
    //   //Dodanie ID do listy połączonych graczy
    //   currentPlayersId.push(socket.id);
    //   //Sprawdzenie, czy obecnie jest wybrana osoba rysująca
    //   if (actualDrawingPlayerId == null) {
    //     actualDrawingPlayerId = socket.id;
    //     createNewRandomPassword();
    //     socket.emit(
    //       "chat message",
    //       utils.getCurrentTime() +
    //         " " +
    //         "Jesteś teraz osobą rysującą. Hasło, to : " +
    //         actualPassword
    //     );
    //     socket.emit(
    //       "chat message",
    //       utils.getCurrentTime() + " " + "Wpisz /nowe aby wylosować nowe hasło."
    //     );
    //   }
    //   console.log("We have new client: " + socket.id);
    //   socket.broadcast.emit(
    //     "chat message",
    //     utils.getCurrentTime() + " " + "Ktoś nowy właśnie się połączył..."
    //   );

    //   //Event podczas rozłączenia osoby
    //   socket.on("disconnect", function () {
    //     delete myClientList[socket.id];
    //     //Usunięcie punktów
    //     delete points[socket.id];
    //     //Zmniejszenie ilości graczy
    //     currentPlayersCount -= 1;
    //     //Wysłanie informacji o aktualnej ilości graczy
    //     io.emit("currentPlayersCount", currentPlayersCount);
    //     //Zmniejszenie usunięcie ID z listy aktywnych graczy
    //     currentPlayersId = currentPlayersId.filter(function (e) {
    //       return e !== socket.id;
    //     });
    //     //Sprawdzenie, czy rozłączyła się osoba rysująca
    //     if (actualDrawingPlayerId == socket.id) {
    //       actualDrawingPlayerId = null;
    //       //TODO do dodania funkcja dla rozłączenia osoby rysującej
    //       //chatManager.leftMessage("TODO NICK");
    //       socket.broadcast.emit(
    //         "chat message",
    //         utils.getCurrentTime() +
    //           " " +
    //           "Osoba rysującą właśnie się rozłączyła."
    //       );
    //       console.log("Disconnect " + socket.id);
    //       findNewDrawingPerson();
    //     } else {
    //       chatManager.leftMessage("TODO NICK");
    //       console.log("Disconnect " + socket.id);
    //     }
    //   });
    // }
    function joinOrCreateRoom(socket, user) {}
    function createNewRandomPassword() {
      actualPassword = randomProperty(passwords);
    }

    function findNewDrawingPerson(socket) {
      if (currentPlayersCount > 1) {
        do {
          var newDrawPersonId =
            currentPlayersId[(currentPlayersId.length * Math.random()) << 0];
        } while (actualDrawingPlayerId == newDrawPersonId);
        actualDrawingPlayerId = newDrawPersonId;
        console.log("New drawing client " + actualDrawingPlayerId);
        io.emit("chat message", "Wybrano nową osobę rysującą");
        createNewRandomPassword();
        myClientList[actualDrawingPlayerId].emit(
          "chat message",
          "Jesteś teraz osobą rysującą. Hasło, to : " + actualPassword
        );
      } else {
        // chatManager.sendSystemMessageToAllInRoom(socket);
        // io.emit(
        //   "chat message",
        //   "Brak wystarczającej ilości graczy by wybrać nową osobę rysującą."
        // );
      }
    }

    function randomProperty(obj) {
      var keys = Object.keys(obj);
      return obj[keys[(keys.length * Math.random()) << 0]];
    }
  },
};
