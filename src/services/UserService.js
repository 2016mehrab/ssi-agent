const User = require("../models/User");
class UserService {
  static async create(data) {
    const user = new User(data);
    return user.save(); // returns a promise
  }
  static async findByEmail(email) {
    return User.findOne({ email: email }).exec();
  }
}
module.exports = UserService;
