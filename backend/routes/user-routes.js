var express = require('express');
var router = express.Router();
var User   = require('../models/user'); // get our mongoose model
var encryption = require ('../Helpers/encryption');
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('../config');
var Company = require('../models/company');
var Board = require('../models/board');
var Status = require('../models/status');


function returnResponse(success, message='', data=null) {
    if(success && message.length === 0) message = 'Successful'
    return {success: success, message: message, data: data};
}

router.post('/register', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let name = req.body.name;
    let companyID = req.body.companyID;
    if (!email || !password || !name || !companyID) {
        res.json(returnResponse(false, 'Email, password, Company ID, or name not provided', null));
    } else {
        User.findOne({email: email}).then((user) => {
            if(user) {
                return res.json(returnResponse(false, 'Email exists', null));
            }
            password = encryption.encryptPassword(password);
            if (!password) {
                return res.json(returnResponse(false, 'Was not able to encrypt Password', null));
            }
            var user = new User({
                name: name,
                email: email,
                password: password,
                companyID: companyID
            });
            user.save((err) => {
                if(err) {
                    return res.json(returnResponse(false, 'Error with registration process, please try again', null));
                }
                const payLoad = {
                    email: email,
                    companyID = companyID
                }
                var token = jwt.sign(payLoad, config.secret, { //@TODO: Change this to a private key, that is stored on the computer securely.
                    expiresIn: "30 days" //30 days
                });
                res.json(returnResponse(true, 'Registered Successfully', {token: token}));
            });
        });
    
    }
});


//{'email': '', 'password': ''}
router.post('/authenticate', (req, res) => {
    User.findOne({email: req.body.email}, (err, user) => {
        if (err) {
            throw err;
        }
        if(!user) {
            res.json(returnResponse(false, 'Authentication failed. User not found.', null));
        } else {
            if (encryption.comparePassword(user.password, req.body.password)) {
                const payLoad = {
                    email: req.body.email,
                    companyID: user.companyID
                }
                var token = jwt.sign(payLoad, config.secret, { //@TODO: Change this to a private key, that is stored on the computer securely.
                    expiresIn: "30 days" //30 days
                });
                res.json(returnResponse(true, 'Received Token', {token: token, companyID: user.companyID}));
            } else {
                res.json(returnResponse(false, 'Authentication failed. Password did not match.', null));
            }
        }
    });
});

// route middleware to verify a token, everything below this uses the middleware
router.use((req, res, next) => {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
  
    // decode token
    if (token) {
  
      // verifies secret and checks exp
      jwt.verify(token, config.secret, (err, decoded) => {      
        if (err) {
          return res.json(returnResponse(false, 'Failed to authenticate token.', null));
        } else {
          // if everything is good, save to request for use in other routes. Contains email property.
          //https://stackoverflow.com/questions/18875292/passing-variables-to-the-next-middleware-using-next-in-express-js
          res.locals.userInfo = decoded;    
          next();
        }
      });
  
    } else {
  
      // if there is no token
      // return an error
      return res.status(403).send(
          returnResponse(false, 'No token Provided', null)
      );
  
    }
});



//{'email': '', 'password': ''}
router.get('/company', (req, res) => {
    Company.find({}, (err, companies) => {
        if (err) {
            throw err
        }
        return res.json(returnResponse(true,  '', {result: companies}));
    })
});


router.post('/company', (req, res) => {
    const name = req.body.name;
    if (!name) {
        res.json(returnResponse(false, 'Name was not provided', null));
    } else {
        Company.findOne({name: name}).then((company) => {
            if(company) {
                res.json(returnResponse(false, 'Company Name Already Exists', null));
            } else {
                var newCompany = new Company({
                    name: name
                });
                newCompany.save((err) => {
                    if(err) {
                        return res.json(returnResponse(false, 'Error with saving new company, please try again: ' + err, null));
                    }
                    res.json(returnResponse(true, '', {result: newCompany}));
                });
            }
        });
    }
});

router.get('/board', (req, res) => {
    const payload = res.locals.userInfo;
    const companyID = payload.companyID;
    Board.find({companyID: companyID}, (err, boards) => {
        if(err) {
            return res.json(returnResponse(false, 'Error with GET/board: ' + err, null));
        }
        if (!res) {
            return res.json(returnResponse(false, 'No boards found', null));
        }
        res.json(returnResponse(true, '',  {result: boards}));
    });
});

//Creating a brand new Board, not a card
router.post('/board', (req, res) => {
    const companyID = res.locals.userInfo.companyID;
    const name = req.body.name;
    const name = req.body.name;
    if (!name) {
        return res.json(returnResponse(false, 'Name was not provided', null));
    }
    var newBoard = new Board({
        name: name,
        companyID: companyID,
        cards: []
    });
    newBoard.save((err) => {
        if(err) {
            return res.json(returnResponse(false, 'Error with POSTING BOARD: ' + err, null));
        }
        res.json(returnResponse(true, '', {resukt: newBoard}));
    })
});

router.get('/cards:boardID', (req, res) => {
    if(!req.params.boardID) {
        return res.json(returnResponse(false, 'No Board ID Included'));
    }
    Board.findById(req.params.boardID, (err, cards) => {
        if(err) {
            return res.json(returnResponse(false, 'Error with GET /cards: ' + err, null));
        }
        if (!res) {
            return res.json(returnResponse(false, 'No cards found for board', null));
        }
        res.json(returnResponse(true, '', {result: cards}));
    });
});

router.post('/cards', (req, res) => {
    if(!req.body.boardID || !req.body.title || req.body.subject || req.body.statusID || req.body.statusName) {
        return res.json(returnResponse(false, 'No Board ID Included'));
    }
    Board.findById(req.params.boardID, (err, boards) => {
        if(err) {
            return res.json(returnResponse(false, 'Error with GET /cards: ' + err, null));
        }
        if (!res) {
            return res.json(returnResponse(false, 'No cards found for board', null));
        }
        var newCard = {
            title: req.body.title,
            subject: req.body.subject,
            status: {
                statusID: req.body.statusID,
                name: req.body.statusName
            }
        }
        boards.cards.push(newCard);
        boards.save((err) => {
            if(err) {
                return res.json(returnResponse(false, 'Could not save boards: ' + err));
            }
        });
        res.json(returnResponse(true), '', {result: boards});
    });
});

router.get('/status', (req, res) => {
    const companyID = res.locals.userInfo.companyID;
    Status.find({companyID: companyID}, (err, statuses) => {
        if(err) {
            return res.json(returnResponse(false, 'Error with GET/status: ' + err, null));
        }
        if (!res) {
            return res.json(returnResponse(false, 'No statuses found', null));
        }
        res.json(returnResponse(true, '',  {result: statuses}));
    });
});

router.post('/status', (req, res) => {
    const companyID = req.body.companyID;
    const name = req.body.name;
    if (!name || !companyID) {
        res.json(returnResponse(false, 'Name or company ID was not provided', null));
    } else {
        Status.findOne({name: name}).then((status) => {
            if(status) {
                res.json(returnResponse(false, 'Status Name Already Exists', null));
            } else {
                var newStatus = new Status({
                    name: name,
                    companyID: companyID
                });
                newStatus.save((err) => {
                    if(err) {
                        return res.json(returnResponse(false, 'Error with saving new company, please try again: ' + err, null));

                    }
                    res.json(returnResponse(false, '', {result: newStatus}));
                });
            }
        });
    }
});



