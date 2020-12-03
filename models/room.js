const utils = require("../utils");
class Room {
  static id;
  static users;
  static maxUsers;
  static password;
  static creationTime;
  static currentDrawingUserId;
  static currentPasswordToGuess;

  constructor(id, user, password = "", maxUsers = 10) {
    this.id = id;
    this.creationTime = new Date();
    this.users = {};
    this.users[user.id] = user;
    if (password == null) {
      this.password = "";
    } else {
      this.password = password;
    }
    this.maxUsers = maxUsers;
    this.currentDrawingUserId = user.id;
  }

  addUser(user, password = "") {
    if (this.connectedUsers() >= this.maxUsers || this.password != password) {
      return false;
    } else {
      this.users[user.id] = user;

      return true;
    }
  }

  removeUserBy(userId) {
    if (this.users[userId] != null) {
      delete this.users[userId];

      return true;
    } else {
      return false;
    }
  }
  connectedUsers() {
    return utils.sizeOfObject(this.users);
  }
  setPasswordToGuess(password) {
    this.currentPasswordToGuess = password;
  }
}
module.exports = Room;