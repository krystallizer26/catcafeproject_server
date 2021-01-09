var express = require('express');
var router = express.Router();
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

const userController = require("../controller/auth")

router.get('/thesis/', function (request, response) {
    var methodCode = "XF";

    var requiredData = [];
    requiredData.push(request.query.researcherId);
    var requiredReady = Validate.requiredData_Check(requiredData)

    console.log("Validation 3")
    var objectIdData = [];
    objectIdData.push(request.query.researcherId);
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
                Thesis_Control.getThesisByResearcherId(new ObjectId(request.query.researcherId), this);
            },
            function (code, err, getResponse) {
                if (err) {
                    Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                } else {
                    // console.log(getResponse)
                    getResponse = JSON.parse(JSON.stringify(getResponse))
                    // console.log(JSON.stringify(getResponse, null, 4))
                    // console.log(JSON.stringify(getResponse[0].thesis, null, 4))
                    // console.log(getResponse[0].thesis[0])
                    if (getResponse.length > 0) {
                        getResponse[0].masterThesis = []
                        getResponse[0].doctorThesis = []

                        if (getResponse[0].thesis.length > 0) {
                            let round = getResponse[0].thesis.length
                            let completed = 0
                            getResponse[0].thesis.forEach(async (element, index) => {
                                let thesisElement = element
                                await Thesis_Control.getThesisStatus(new ObjectId(request.query.researcherId), thesisElement, function (studentStatus) {
                                    console.log(`STUDENTSTATUS >> ${JSON.stringify(studentStatus)}`)
                                    thesisElement.studentStatus = studentStatus

                                    if (thesisElement.student.masterDegreeCourse != "") {
                                        getResponse[0].masterThesis.push(thesisElement)
                                    }
                                    if (thesisElement.student.doctorDegreeCourse != "")
                                        getResponse[0].doctorThesis.push(thesisElement)
                                    completed++
                                    if (completed == round) {
                                        delete getResponse[0].thesis;

                                        console.log(`!! RETURNING !!`)
                                        console.log(getResponse)
                                        Return.responseWithCodeAndData(ReturnCode.success, "getResearcherById Successfully executed", getResponse, response);
                                    }
                                });

                            });
                        }
                        else {
                            delete getResponse[0].thesis;
                            Return.responseWithCodeAndData(ReturnCode.success, "getResearcherById Successfully executed", getResponse, response);
                        }
                    }
                    else {
                        let thesisBlank = [{
                            masterThesis: null,
                            doctorThesis: null
                        }]
                        Return.responseWithCodeAndData(ReturnCode.success, "getResearcherById Successfully executed", thesisBlank, response);
                    }
                }
            }
        );
    }
});
router.get('/admin/thesis', async function (request, response) {
    var methodCode = "XF";
    var researcherId = null;

    var requiredData = [];
    requiredData.push(request.headers.token);
    var requiredReady = Validate.requiredData_Check(requiredData)

    console.log("Validation Success")

    if (!requiredReady) {
        var alert = "Input Not Valid, check if some data is required."
        console.log(alert);
        Return.responseWithCode(ReturnCode.clientError + methodCode + "001", alert, response)
    }
    else {
        var user = await auth.decodeTokenAdmin(request.headers.token)
        let executable = true
        if (user == "token is expired" || user == "user not found") {
            executable = false
            console.log(user);
            Return.responseWithCode(ReturnCode.clientError + methodCode + "001", user, response)
        }
        else if (user.researcherId != null && user.researcherId != 999999999999999999999999) {
            console.log("Validation 3")
            console.log(user.researcherId);
            var objectIdData = [];
            objectIdData.push(user.researcherId);
            var objectIdReady = Validate.objectIDData_Check(objectIdData)

            if (!objectIdReady) {
                executable = false
                var alert = "Input Not Valid, check if some data is not ObjectID for MongoDB."
                console.log(alert);
                Return.responseWithCode(ReturnCode.clientError + methodCode + "003", alert, response)
            }
            researcherId = user.researcherId;
        }

        if (executable) {
            flow.exec(
                function () {
                    Thesis_Control.getThesisByAdmin(researcherId, this);
                },
                function (code, err, getResponse) {
                    if (err) {
                        Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                    } else {
                        Return.responseWithCodeAndData(ReturnCode.success, "getThesisByAdmin Successfully executed", getResponse, response);
                    }
                }
            );
        }
    }
});
router.get('/admin/thesis/:thesisId', async function (request, response) {
    var methodCode = "XF";

    var requiredData = [];
    requiredData.push(request.params.thesisId);
    requiredData.push(request.headers.token);
    var requiredReady = Validate.requiredData_Check(requiredData)

    console.log("Validation 3")
    var objectIdData = [];
    objectIdData.push(request.params.thesisId);
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
    }
    else {
        var user = await auth.decodeTokenAdmin(request.headers.token)

        if (user == "token is expired" || user == "user not found") {
            console.log(user);
            Return.responseWithCode(ReturnCode.clientError + methodCode + "001", user, response)
        }
        else {
            flow.exec(
                function () {
                    Thesis_Control.getThesisForResearcherIdByAdmin(new ObjectId(request.params.thesisId), this);
                },
                function (code, err, getResponse) {
                    if (err) {
                        Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                    } else {
                        Return.responseWithCodeAndData(ReturnCode.success, "getThesisForResearcherIdByAdmin Successfully executed", getResponse, response);
                    }
                }
            );
        }
    }
});

//--------------------

router.post('/admin/thesis/', userController.checkUserInfo, async function (request, response) { //เพิ่ม dev. เป็น noti req.
    var methodCode = "XF";
    // console.log(request.headers)
    // console.log(request.body)
    var requiredData = [];
    requiredData.push(request.body.researcherId);
    requiredData.push(request.body.updateDetails);
    var requiredReady = Validate.requiredData_Check(requiredData)

    console.log("Validation 3")
    var objectIdData = [];
    objectIdData.push(request.body.researcherId);
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
                dataUpdate.dataType = 'thesis'

                if (request.body.dataId)
                    dataUpdate.dataId = request.body.dataId
                else
                    dataUpdate.dataId = null

                dataUpdate.updateType = 'new'
                dataUpdate.updateStatus = 'pending'
                dataUpdate.beforeDetails = null
                dataUpdate.updateDetails = new Object(request.body.updateDetails)
                dataUpdate.requestDateTime = new Date()
                dataUpdate.updateStatusChangeDateTime = null
                dataUpdate.requestBy = request.userInfo.name
                dataUpdate.executeBy = null
                DataUpdate_Control.newDataUpdateByResearcherId(new ObjectId(request.body.researcherId), dataUpdate, this);
            },
            function (code, err, callbackData) {
                if (err) {
                    Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                } else {
                    callbackData = JSON.parse(JSON.stringify(callbackData))
                    if (request.userInfo.roles.indexOf("admin") != -1 || request.userInfo.roles.indexOf("graduate_staff ") != -1)
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

router.post('/admin/thesis/:researcherId', userController.checkUserInfo, async function (request, response) { //แก้ไข dev. เป็น noti req.
    var methodCode = "XF";
    // console.log(request.headers)
    // console.log(request.body)
    var requiredData = [];

    requiredData.push(request.params.researcherId);
    requiredData.push(request.body.updateDetails);
    requiredData.push(request.body.dataId);
    var requiredReady = Validate.requiredData_Check(requiredData)

    console.log("Validation 3")
    var objectIdData = [];
    objectIdData.push(request.params.researcherId);
    requiredData.push(request.body.dataId);
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
                dataUpdate.dataType = 'thesis'
                dataUpdate.dataId = request.body.dataId
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
                    if (request.userInfo.roles.indexOf("admin") != -1 || request.userInfo.roles.indexOf("graduate_staff ") != -1)
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

router.delete('/admin/thesis/:researcherId', userController.checkUserInfo, function (request, response) { //ลบ dev. เป็น noti req.
    var methodCode = "XF";
    // console.log(request.headers)
    // console.log(request.body)
    var requiredData = [];

    requiredData.push(request.params.researcherId);
    // requiredData.push(request.query.updateDetails);
    requiredData.push(request.query.dataId);
    var requiredReady = Validate.requiredData_Check(requiredData)

    console.log("Validation 3")
    var objectIdData = [];
    objectIdData.push(request.params.researcherId);
    requiredData.push(request.query.dataId);
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
                dataUpdate.dataType = 'thesis'
                dataUpdate.dataId = request.query.dataId
                dataUpdate.updateType = 'delete'
                dataUpdate.updateStatus = 'pending'
                dataUpdate.beforeDetails = null
                dataUpdate.updateDetails = null
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
                    if (request.userInfo.roles.indexOf("admin") != -1 || request.userInfo.roles.indexOf("graduate_staff ") != -1)
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

module.exports = router;