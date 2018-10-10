const mongoose = require('mongoose');
const schema = mongoose.Schema;

module.exports = mongoose.model('user', new schema({
    email: String,
    password: String,
    name: String,
    companyID: schema.Types.ObjectId
}));