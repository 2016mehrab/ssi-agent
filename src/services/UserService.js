const User = require("../models/User");
class UserService {
  static async create(data) {
    const user = new User(data);
    return user.save(); // returns a promise
  }
  static async findByEmail(email) {
    return User.findOne({ email: email }).exec();
  }
  static async findByConnectionId(conid) {
    return User.findOne({ connectionId: conid }).exec();
  }
  static async updateHasCredentialByConnectionId(connectionId) {
    return User.findOneAndUpdate(
      { connectionId: connectionId },
      { hasCredential: true },
      // NOTE: This option ensures that the updated document is returned
      { new: true }
    ).exec();
  }
}
module.exports = UserService;
