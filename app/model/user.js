var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt')
var typeObjectId = mongoose.Schema.Types.ObjectId;

const userSchema = new Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  department: {
    name_TH: { type: String, default: null },
    name_EN: { type: String, default: null },
  },
  roles: { type: [String], required: true },
  researcherId: { type: typeObjectId, required: true },
  tokenResetPassword: { type: String },
  tokenResetPassword_Expired: { type: Date, default: null },
  isBlocked: { type: Boolean, default: false }
})

module.exports = mongoose.model('User', userSchema);