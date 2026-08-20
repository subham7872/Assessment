const Project = require('../models/Project');

class ProjectRepository {
  async findById(id) {
    return await Project.findById(id);
  }

  async findByIdWithMembers(id) {
    return await Project.findById(id).populate('members.user', 'name email');
  }

  async findByUser(userId) {
    return await Project.find({ 'members.user': userId })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
  }

  async create(data) {
    return await Project.create(data);
  }

  async updateById(id, data) {
    return await Project.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async save(doc) {
    return await doc.save();
  }

  async findByInviteToken(token) {
    return await Project.findOne({
      'inviteTokens.token': token,
      'inviteTokens.used': false,
    });
  }

  async delete(id) {
    return await Project.findByIdAndDelete(id);
  }
}

module.exports = new ProjectRepository();
