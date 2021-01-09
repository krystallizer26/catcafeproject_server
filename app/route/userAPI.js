var express = require('express');
var router = express.Router();
const userController = require("../controller/auth")

var randomstring = require("randomstring");
var formidable = require('formidable')
var path = require('path')
var fs = require('fs');
var auth = require("../controller/auth.js");

// DATABASE SETUP
var ObjectId = require('mongodb').ObjectId;

var ReturnCode = require('../model/returnCode.js');
var Researcher = require('../model/researcher_model.js');
// var Publication = require('../model/publication_model.js');

var flow = require('../service/flow.js')
var Validate = require("../service/validation.js");
var Return = require("../service/return.js");
var Researcher_Control = require('../controller/researcher_control.js');
var Thesis_Control = require('../controller/thesis_control.js');
var DataUpdate_Control = require('../controller/dataUpdate_control.js');

router.post('/admin/staff',
  userController.createUser
);

router.get('/admin/staff', async function (request, response) {
  var methodCode = "XF";

  flow.exec(
    function () {
      userController.getAllStaff(this);
    },
    function (code, err, getResponse) {
      if (err) {
        Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
      } else {
        Return.responseWithCodeAndData(ReturnCode.success, "/admin/staff Successfully executed", getResponse, response);
      }
    }
  );

});

router.get('/admin/staff/:staffId', async function (request, response) {
  var methodCode = "XF";

  var requiredData = [];
  requiredData.push(request.params.staffId);
  var requiredReady = Validate.requiredData_Check(requiredData)
  if (!requiredReady) {
    var alert = "Input Not Valid, check if some data is required."
    console.log(alert);
    Return.responseWithCode(ReturnCode.clientError + methodCode + "001", alert, response)
  } else {

    flow.exec(
      function () {
        userController.getStaffById(new ObjectId(request.params.staffId), this);
      },
      function (code, err, getResponse) {
        if (err) {
          Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
        } else {
          Return.responseWithCodeAndData(ReturnCode.success, "/admin/staff/:staffId Successfully executed", getResponse[0], response);
        }
      }
    );
  }
});

router.post('/admin/staff/:staffId', async function (request, response) {
  var methodCode = "XF";
  console.log(`TEST: ${JSON.stringify(request.params)}`)
  console.log(`TEST: ${JSON.stringify(request.query)}`)
  console.log(`TEST: ${JSON.stringify(request.body)}`)
  var requiredData = [];
  requiredData.push(request.params.staffId);
  requiredData.push(request.body.firstname);
  requiredData.push(request.body.lastname);
  requiredData.push(request.body.roles);
  var requiredReady = Validate.requiredData_Check(requiredData)
  if (!requiredReady) {
    var alert = "Input Not Valid, check if some data is required."
    console.log(alert);
    Return.responseWithCode(ReturnCode.clientError + methodCode + "001", alert, response)
  } else {

    flow.exec(
      function () {
        userController.editStaff(request.params.staffId, request.body.firstname, request.body.lastname, request.body.roles, this);
      },
      function (code, err, getResponse) {
        if (err) {
          Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
        } else {
          Return.responseWithCodeAndData(ReturnCode.success, "/admin/staff Successfully executed", getResponse, response);
        }
      }
    );
  }
});


router.get('/user/reinitialization', function (request, response) {
  var methodCode = "XF";

  let requiredReady = true, objectIdReady = true
  var requiredData = [];
  requiredReady = Validate.requiredData_Check(requiredData)

  console.log("Validation 3")
  var objectIdData = [];
  objectIdReady = Validate.objectIDData_Check(objectIdData)

  console.log("Validation Success")
  console.log(request.params.researcherId)

  if (!requiredReady) {
    var alert = "Input Not Valid, check if some data is required."
    console.log(alert);
    Return.responseWithCode(ReturnCode.clientError + methodCode + "001", alert, response)
  }
  else if (!objectIdReady) {
    var alert = "Input Not Valid, check if some data is not ObjectID for MongoDB."
    console.log(alert);
    Return.responseWithCode(ReturnCode.clientError + methodCode + "003", alert, response)
  }
  else {
    flow.exec(
      function () {
        userController.reinitializeUserForResearcher(this);
      },
      function (code, err, getResponse) {
        if (err) {
          Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
        } else {
          Return.responseWithCodeAndData(ReturnCode.success, "reinitialization Successfully executed", getResponse, response);
        }
      }
    );
  }
});

module.exports = router;