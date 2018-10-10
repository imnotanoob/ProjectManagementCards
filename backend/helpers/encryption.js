var bcrypt = require('bcrypt');
var config = require('../config')

 function encryptPassword(plainPassword) {

    return bcrypt.hashSync(plainPassword, config.saltRounds, function(err, hash) {
        if (err) {
            logger.error('Error with encryption password: ' + err);
            return null;
        }
        return hash;
      });
    
}

function comparePassword(encryptPassword, plainPassword) {
    return bcrypt.compareSync(plainPassword, encryptPassword, function(err, res) {
        if (err) {
            logger.error('Error with comparePassword: ' + err);
            return null;
        }
        return res;
     });
    
}

module.exports = {
    encryptPassword,
    comparePassword
}