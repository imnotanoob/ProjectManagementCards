const mongoose = require('mongoose');
const schema = mongoose.Schema;

module.exports = mongoose.model('company', new schema({
    name: String
}));