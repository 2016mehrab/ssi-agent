const User = require("../models/User");
class UserService {
  static async create(data) {
    const user = new User(data);
    return user.save();
  }
  static async findByEmail(email) {
    return User.findOne({ email: email });
  }
}
module.exports = UserService;
