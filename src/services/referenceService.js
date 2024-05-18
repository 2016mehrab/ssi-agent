const ReferenceModel = require("../models/reference");
class ReferenceService {
  static async getAll() {
    return ReferenceModel.find({}).sort({ createdAt: -1 }).exec();
  }
  static async create(data) {
    const reference = new ReferenceModel(data);
    return reference.save();
  }
  static async exists(reference) {
    const existingReference = await ReferenceModel.findOne({ reference });
    return existingReference !== null;
  }
  static async isAdded(reference) {
    const existingReference = await ReferenceModel.findOne({ reference });
    if (!existingReference) {
      throw new Error("Reference not found");
    }
    return existingReference.isAdded;
  }
  static async updateIsAdded(reference) {
    const filter = { reference };
    const update = { isAdded: true };
    const updatedReference = await ReferenceModel.findOneAndUpdate(
      filter,
      update,
      { new: true }
    );
    if (!updatedReference) {
      throw new Error("Reference not found");
    }
    return updatedReference;
  }
  static async getDomainByReference(reference) {
    const existingReference = await ReferenceModel.findOne({ reference });
    if (!existingReference) {
      throw new Error("Reference not found");
    }
    return existingReference.domain;
  }
  static async getModelByReference(ref) {
    const existingReference = await ReferenceModel.findOne({reference:ref }); // Use `ref` instead of `reference`
    if (!existingReference) {
      throw new Error("Reference not found");
    }
    return existingReference;
  }
}
module.exports = ReferenceService;
