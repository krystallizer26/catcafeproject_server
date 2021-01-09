var express = require('express');
var router = express.Router();
var randomstring = require("randomstring");
var formidable = require('formidable')
var path = require('path')
var fs = require('fs');

// DATABASE SETUP
var ObjectId = require('mongodb').ObjectId;

var ReturnCode = require('../model/returnCode.js');
var Researcher = require('../model/researcher_model.js');
// var Publication = require('../model/publication_model.js');

var flow = require('../service/flow.js')
var Validate = require("../service/validation.js");
var Return = require("../service/return.js");
var Researcher_Control = require('../controller/researcher_control.js');
var DataUpdate_Control = require('../controller/dataUpdate_control.js');

const userController = require("../controller/auth")

router.get('/admin/request_activity/', userController.checkUserInfo, function (request, response) {
    // console.log('In ROUTE', request.userInfo )
    var methodCode = "XF";

    let query = {}
    let filter = {}
    if (request.userInfo.roles && request.userInfo.roles.indexOf("staff") != -1) {
        // console.log('ISStaff')
        query = {}

        if (request.userInfo.roles.indexOf("admin") != -1)
            filter = {}
        else if (request.userInfo.roles.indexOf("hr_staff") != -1)
            filter = { $or: [{ "updateLog.dataType": "researcher" }, { "updateLog.dataType": "develop" }] }
        else if (request.userInfo.roles.indexOf("graduate_staff") != -1)
            filter = { $or: [{ "updateLog.dataType": "publication" }, { "updateLog.dataType": "thesis" }] }
        else if (request.userInfo.roles.indexOf("research_staff") != -1)
            filter = { $or: [{ "updateLog.dataType": "publication" }, { "updateLog.dataType": "reward" }, { "updateLog.dataType": "intProp" }, { "updateLog.dataType": "researchFund" }] }
        else
            filter = { $or: [{ "updateLog.dataType": "researcher" }] }
    }
    else if (request.userInfo.roles && request.userInfo.roles.indexOf("researcher") != -1) {
        query = { _id: new ObjectId(request.userInfo.researcherId) }
        filter = {}
    }
    else {
        query = 'N/A'
        filter = 'N/A'
    }

    console.log(query)
    flow.exec(
        function () {
            if (query !== 'N/A' || filter !== 'N/A') {
                if (request.userInfo.roles && request.userInfo.roles.indexOf("staff") != -1) {
                    filter = { "$and": [{ "updateLog.updateStatus": { "$ne": "notify" } }, filter] }
                }
                else if (request.userInfo.roles && request.userInfo.roles.indexOf("researcher") != -1) {
                    filter = { }
                }

                DataUpdate_Control.getAllDataUpdate(query, filter, this);
            }
            else
                Return.responsePattern(405, ReturnCode.clientError + methodCode + "009", 'User ของคุณไม่มีสิทธิทำงานในส่วนนี้', null, null, response);
        },
        function (code, err, callbackData) {
            if (err) {
                Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
            } else {
                Return.responseWithCodeAndData(ReturnCode.success, "dataUpdate is successfully get", callbackData, response);
            }
        }
    );
});

router.post('/admin/researcher/:researcherId', userController.checkUserInfo, async function (request, response) {
    var methodCode = "XF";
    // console.log(request.headers)
    // console.log(request.body)
    var requiredData = [];
    // requiredData.push(request.body.researcherId);
    requiredData.push(request.params.researcherId);
    requiredData.push(request.body.dataType);
    requiredData.push(request.body.updateType);
    requiredData.push(request.body.updateDetails);
    var requiredReady = Validate.requiredData_Check(requiredData)

    console.log("Validation 3")
    var objectIdData = [];
    objectIdData.push(request.params.researcherId);
    var objectIdReady = Validate.objectIDData_Check(objectIdData)

    console.log("Validation Success")

    if (!requiredReady) {
        var alert = "Input Not Valid, check if some data is required."
        console.log(alert);
        Return.responseWithCode(ReturnCode.clientError + methodCode + "001", alert, response)
    } else if (!objectIdReady) {
        var alert = "Input Not Valid, check if some data is not ObjectID for MongoDB."
        console.log(alert);
        Return.responseWithCode(ReturnCode.clientError + methodCode + "003", alert, response)
    } else {
        flow.exec(
            function () {

                let dataUpdate = {}
                dataUpdate.dataType = 'researcher'

                if (request.body.dataId)
                    dataUpdate.dataId = request.body.dataId
                else
                    dataUpdate.dataId = null

                dataUpdate.updateType = 'update'
                dataUpdate.updateStatus = 'pending'
                dataUpdate.beforeDetails = null
                dataUpdate.updateDetails = new Object(request.body.updateDetails)
                dataUpdate.requestDateTime = new Date()
                dataUpdate.updateStatusChangeDateTime = null
                dataUpdate.requestBy = request.userInfo.name
                dataUpdate.executeBy = null
                DataUpdate_Control.newDataUpdateByResearcherId(new ObjectId(request.params.researcherId), dataUpdate, this);
            },
            function (code, err, callbackData) {
                if (err) {
                    Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                } else {

                    callbackData = JSON.parse(JSON.stringify(callbackData))
                    if (request.userInfo.roles.indexOf("admin") != -1 || request.userInfo.roles.indexOf("hr_staff") != -1)
                        DataUpdate_Control.dataUpdateExecution(new ObjectId(request.params.researcherId), new ObjectId(callbackData.updateLog[callbackData.updateLog.length - 1]._id), 'accept', request.userInfo.name, function (code, err, data) {
                            Return.responseWithCodeAndData(ReturnCode.success, "The Information has been updated successfully", null, response);
                        });
                    else {
                        Return.responseWithCodeAndData(ReturnCode.success, "Your information has been sent to the officer, please wait for the review and confirmation from the officer.", null, response);
                    }
                }
            }
        );
    }
});

router.get('/admin/request_activity/:request_id'/*, userController.checkUserInfo*/, function (request, response) {
    // console.log('In ROUTE', request.userInfo )
    var methodCode = "XF";

    // let query = {}
    // if ( request.userInfo.roles &&  request.userInfo.roles.indexOf("staff") != -1) {
    //     // console.log('ISStaff')
    //     query = {}
    // }
    // else if ( request.userInfo.roles &&  request.userInfo.roles.indexOf("researcher") != -1) {
    //     query = { _id: new ObjectId( request.userInfo.researcherId) }
    // }
    // else {
    //     query = 'N/A'
    // }

    // console.log(query)
    flow.exec(
        function () {
            // if (query !== 'N/A')
            DataUpdate_Control.getEachDataUpdate(request.params.request_id, this);
            // else
            // Return.responsePattern(405, ReturnCode.clientError + methodCode + "009", 'User ของคุณไม่มีสิทธิทำงานในส่วนนี้', null, null, response);
        },
        function (code, err, callbackData) {
            if (err) {
                Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
            } else {
                Return.responseWithCodeAndData(ReturnCode.success, "dataUpdate is successfully get", callbackData, response);
            }
        }
    );
});

router.post('/admin/request_activity/:request_id/accept/', userController.checkUserInfo, async function (request, response) {
    var methodCode = "XF";

    var requiredData = [];
    // requiredData.push(request.body.dataUpdateId);
    requiredData.push(request.body.researcherId);
    var requiredReady = Validate.requiredData_Check(requiredData)

    console.log("Validation 3")
    var objectIdData = [];
    objectIdData.push(request.params.request_id);
    var objectIdReady = Validate.objectIDData_Check(objectIdData)

    console.log("Validation Success")

    if (!requiredReady) {
        var alert = "Input Not Valid, check if some data is required."
        console.log(alert);
        Return.responseWithCode(ReturnCode.clientError + methodCode + "001", alert, response)
    } else if (!objectIdReady) {
        var alert = "Input Not Valid, check if some data is not ObjectID for MongoDB."
        console.log(alert);
        Return.responseWithCode(ReturnCode.clientError + methodCode + "003", alert, response)
    } else {
        flow.exec(
            function () {
                DataUpdate_Control.dataUpdateExecution(new ObjectId(request.body.researcherId), new ObjectId(request.params.request_id), 'accept', request.userInfo.name, this);
            },
            function (code, err, callbackData) {
                if (err) {
                    Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                } else {
                    Return.responseWithCodeAndData(ReturnCode.success, "new dataUpdate is successfully executed", callbackData, response);
                }
            }
        );
    }
});

router.post('/admin/request_activity/:request_id/reject/', userController.checkUserInfo, function (request, response) {
    var methodCode = "XF";

    var requiredData = [];
    // requiredData.push(request.body.dataUpdateId);
    requiredData.push(request.body.researcherId);
    var requiredReady = Validate.requiredData_Check(requiredData)

    console.log("Validation 3")
    var objectIdData = [];
    objectIdData.push(request.params.request_id);
    var objectIdReady = Validate.objectIDData_Check(objectIdData)

    console.log("Validation Success")

    if (!requiredReady) {
        var alert = "Input Not Valid, check if some data is required."
        console.log(alert);
        Return.responseWithCode(ReturnCode.clientError + methodCode + "001", alert, response)
    } else if (!objectIdReady) {
        var alert = "Input Not Valid, check if some data is not ObjectID for MongoDB."
        console.log(alert);
        Return.responseWithCode(ReturnCode.clientError + methodCode + "003", alert, response)
    } else {
        flow.exec(
            function () {
                DataUpdate_Control.dataUpdateExecution(new ObjectId(request.body.researcherId), new ObjectId(request.params.request_id), 'reject', request.userInfo.name, this);
            },
            function (code, err, callbackData) {
                if (err) {
                    Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                } else {
                    Return.responseWithCodeAndData(ReturnCode.success, "new dataUpdate is successfully executed", callbackData, response);
                }
            }
        );
    }
});

router.get('/admin/request_activity/notification/unread/', userController.checkUserInfo, function (request, response) {
    console.log('In ROUTE researcher_unread', request.userInfo)
    var methodCode = "KFW";

    let query = {}
    let filter = {}
    if (request.userInfo.roles && request.userInfo.roles.indexOf("staff") != -1) {
        // console.log('ISStaff')
        query = {}

        if (request.userInfo.roles.indexOf("admin") != -1)
            filter = {}
        else if (request.userInfo.roles.indexOf("hr_staff") != -1)
            filter = { $or: [{ "updateLog.dataType": "researcher" }, { "updateLog.dataType": "develop" }] }
        else if (request.userInfo.roles.indexOf("graduate_staff") != -1)
            filter = { $or: [{ "updateLog.dataType": "publication" }, { "updateLog.dataType": "thesis" }] }
        else if (request.userInfo.roles.indexOf("research_staff") != -1)
            filter = { $or: [{ "updateLog.dataType": "publication" }, { "updateLog.dataType": "reward" }, { "updateLog.dataType": "intProp" }, { "updateLog.dataType": "researchFund" }] }
        else
            filter = { $or: [{ "updateLog.dataType": "researcher" }] }
    }
    else if (request.userInfo.roles && request.userInfo.roles.indexOf("researcher") != -1) {
        query = { _id: new ObjectId(request.userInfo.researcherId) }
        filter = {}
    }
    else {
        query = 'N/A'
        filter = 'N/A'
    }

    flow.exec(
        function () {
            if (query !== 'N/A' || filter !== 'N/A') {
                if (request.userInfo.roles && request.userInfo.roles.indexOf("staff") != -1) {
                    filter = { "$and": [{ "updateLog.updateStatus": { "$ne": "notify" } }, { "updateLog.isSeenBy": { "$ne": new ObjectId(request.userInfo.userId) } }, filter] }
                }
                else if (request.userInfo.roles && request.userInfo.roles.indexOf("researcher") != -1) {
                    filter = { "$and": [{ "updateLog.isSeenBy": { "$ne": new ObjectId(request.userInfo.userId) } }] }
                }
                console.log('query', JSON.stringify(query))
                console.log('filter', JSON.stringify(filter))
                DataUpdate_Control.countAllNotSeenDataUpdate(query, filter, this);
            }
            else
                Return.responsePattern(405, ReturnCode.clientError + methodCode + "009", 'User ของคุณไม่มีสิทธิทำงานในส่วนนี้', null, null, response);
        },
        function (code, err, callbackData) {
            if (err) {
                Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
            } else {
                Return.responseWithCodeAndData(ReturnCode.success, "dataUpdate is successfully get", callbackData, response);
            }
        }
    );
});

router.get('/admin/request_activity/notification/clear', userController.checkUserInfo, function (request, response) {
    var methodCode = "XF";
    // if (request.userInfo.roles.indexOf("researcher") != -1) {
    //     Return.responseWithCode(ReturnCode.clientError + methodCode + "009", "You are not a researcher", response)
    // }
    // else {
        flow.exec(
            function () {
                DataUpdate_Control.clearAllNotReadDataUpdate(new ObjectId(request.userInfo.userId), this);
            },
            function (code, err, callbackData) {
                if (err) {
                    Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                } else {
                    Return.responseWithCodeAndData(ReturnCode.success, "new dataUpdate is successfully executed", callbackData, response);
                }
            }
        );
    // }
});

module.exports = router;