const mongoose = require('mongoose');
const schema = mongoose.Schema;

module.exports = mongoose.model('status', new schema({
    name: String,
    companyID: schema.Types.ObjectId
}));