var express = require('express');
var router = express.Router();

var ObjectId = require('mongodb').ObjectId;
var flow = require('../service/flow.js')
var Validate = require("../service/validation.js");
var Return = require("../service/return.js");
const userController = require("../controller/auth")

var test_Control = require('../controller/test_control.js');

//route
router.post('/testAPI/', test_Control.newUser
    //response.json({code:"xxxxxx", message:"test"})
);

module.exports = router;