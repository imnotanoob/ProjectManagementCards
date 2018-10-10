const mongoose = require('mongoose');
const schema = mongoose.Schema;

const cardSingle = new schema({
    title: String,
    subject: String,
    status: {
        statusID: schema.Types.ObjectId,
        name: String
    }
});

module.exports = mongoose.model('board', new schema({
   cards: [cardSingle],
   companyID: schema.Types.ObjectId,
   name: String
}));
