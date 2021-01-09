var Researcher = require('../model/researcher_model.js');

// var Position_Control = require("./position_control.js");
// var Division_Control = require("./division_control.js");
// var Department_Control = require("./department_control.js");


var ObjectId = require('mongodb').ObjectId;
var flow = require('../service/flow.js')

module.exports = {

    getAllDataUpdate: function (query, filter, callback) {
        let aggregatePipeline = [
            { $match: query },
            { $project: { "_id": true, "researcherName_TH": true, "researcherName_EN": true, "updateLog": true } },
            { $unwind: "$updateLog" },
            { $match: filter },
            { $sort: { "updateLog.requestDateTime": -1 } }
        ]
        // { $or: [{ "updateLog.dataType": "publication" }, { "updateLog.dataType": "thesis" }] }
        console.log(aggregatePipeline)
        Researcher.aggregate(aggregatePipeline, function (error, researcherResponse) {
            if (error) {
                var alert = "[func. getAllDataUpdate] Error: " + error.message;
                callback("171", alert, null)
            } else {
                callback("172", null, researcherResponse)
            }
        });
    },
    countAllNotSeenDataUpdate: function (query, filter, callback) {
        let aggregatePipeline = [
            { $match: query },
            { $project: { "_id": true, "researcherName_TH": true, "researcherName_EN": true, "updateLog": true } },
            { $unwind: "$updateLog" },
            { $match: filter },
            { $sort: { "updateLog.requestDateTime": -1 } }
        ]
        // { $or: [{ "updateLog.dataType": "publication" }, { "updateLog.dataType": "thesis" }] }
        console.log(aggregatePipeline)
        Researcher.aggregate(aggregatePipeline, function (error, researcherResponse) {
            if (error) {
                var alert = "[func. countAllNotSeenDataUpdate] Error: " + error.message;
                callback("171", alert, null)
            } else {
                let responseObj = {}
                // console.log(JSON.stringify(researcherResponse))
                if (researcherResponse == null)
                    responseObj.count = 0
                else
                    responseObj.count = researcherResponse.length

                callback("172", null, responseObj)
            }
        });
    },
    getAllNotReadDataUpdateCount: function (researcherId, callback) {
        Researcher.findOne(
            { _id: researcherId, "updateLog.isSelfSeen": false },
            { "updateLog.$": 1 }, function (error, researcherResponse) {
                if (error) {
                    var alert = "[func. getAllNotReadDataUpdateCount] Error: " + error.message;
                    callback("171", alert, null)
                } else {
                    let responseData = {
                        count: researcherResponse.updateLog.length,
                        unseenList: researcherResponse.updateLog
                    }
                    callback("171", null, responseData)
                }
            }
        );
    },
    clearAllNotReadDataUpdate: function (userId, callback) {
        let query = {}
        let updateCriteria = { "$addToSet": { "updateLog.$[].isSeenBy": userId } }
        //  { "updateLog.$": { "$push": { "isSeenBy": userId } } }
        console.log('query: ' + JSON.stringify(query))
        console.log('updateCriteria: ' + JSON.stringify(updateCriteria))
        Researcher.updateMany(
            query,
            updateCriteria, function (error, researcherResponse) {
                if (error) {
                    var alert = "[func. clearAllNotReadDataUpdate] Error: " + error.message;
                    callback("171", alert, null)
                } else {
                    callback("171", null, null)
                }
            }
        );
    },
    getEachDataUpdate: function (dataUpdateId, callback) {

        let query = { 'updateLog': { $elemMatch: { '_id': dataUpdateId } } }
        let projection = { '_id': true, "researcherName_TH": true, "updateLog": { $elemMatch: { '_id': dataUpdateId } } }
        Researcher.findOne(query, projection, function (error, researcherResponse) {
            if (error || !researcherResponse) {
                var alert = "[func. getAllDataUpdate] Error: " + error;
                callback("171", alert, null)
            }
            else if (!researcherResponse) {
                var alert = "[func. getAllDataUpdate] Error: NO _id";
                callback("171", alert, null)
            } else {
                let researcherId = new ObjectId(researcherResponse._id)
                let dataUpdateObject = researcherResponse.updateLog[0]

                let updateConfirmation = {
                    researcherId: researcherResponse._id,
                    researcherName_TH: researcherResponse.researcherName_TH,
                    dataType: dataUpdateObject.dataType,
                    updateType: dataUpdateObject.updateType,
                    updateStatus: dataUpdateObject.updateStatus,
                    requestDateTime: dataUpdateObject.requestDateTime,
                    updateStatusChangeDateTime: dataUpdateObject.updateStatusChangeDateTime,
                    requestBy: dataUpdateObject.requestBy,

                    currentData: null,
                    updateDetails: researcherResponse.updateLog[0].updateDetails
                }

                if (dataUpdateObject.updateType == 'update') {
                    console.log('executing update')

                    if (dataUpdateObject.updateStatus == 'pending') {


                        if (dataUpdateObject.dataType == 'researcher') {
                            query = { '_id': researcherId }
                            projection = { "updateLog": false }

                            Researcher.findOne(query, projection, function (error, researcherResponse2) {
                                if (error) {
                                    var alert = "[func. getEachDataUpdate] Error: " + error.message;
                                    callback("171", alert, null)
                                } else {
                                    updateConfirmation.currentData = researcherResponse2
                                    callback("172", null, updateConfirmation)
                                }
                            });
                        }
                        else if (dataUpdateObject.dataType == 'develop') {
                            query = { '_id': researcherId, "develop": { "$elemMatch": { "_id": dataUpdateObject.dataId } } }
                            projection = { "develop": { "$elemMatch": { "_id": dataUpdateObject.dataId } } }
                            Researcher.findOne(query, projection, function (error, researcherResponse2) {
                                if (error) {
                                    var alert = "[func. getEachDataUpdate] Error: " + error.message;
                                    callback("171", alert, null)
                                } else {
                                    updateConfirmation.currentData = researcherResponse2.develop[0]
                                    callback("172", null, updateConfirmation)
                                }
                            });
                        }
                        else if (dataUpdateObject.dataType == 'intProp') {
                            query = { '_id': researcherId, "intProp": { "$elemMatch": { "_id": dataUpdateObject.dataId } } }
                            projection = { "intProp": { "$elemMatch": { "_id": dataUpdateObject.dataId } } }
                            Researcher.findOne(query, projection, function (error, researcherResponse2) {
                                if (error) {
                                    var alert = "[func. getEachDataUpdate] Error: " + error.message;
                                    callback("171", alert, null)
                                } else {
                                    updateConfirmation.currentData = researcherResponse2.intProp[0]
                                    callback("172", null, updateConfirmation)
                                }
                            });

                        }
                        else if (dataUpdateObject.dataType == 'reward') {
                            query = { '_id': researcherId, "reward": { "$elemMatch": { "_id": dataUpdateObject.dataId } } }
                            projection = { "reward": { "$elemMatch": { "_id": dataUpdateObject.dataId } } }
                            Researcher.findOne(query, projection, function (error, researcherResponse2) {
                                if (error) {
                                    var alert = "[func. getEachDataUpdate] Error: " + error.message;
                                    callback("171", alert, null)
                                } else {
                                    updateConfirmation.currentData = researcherResponse2.reward[0]
                                    callback("172", null, updateConfirmation)
                                }
                            });

                        }
                        else if (dataUpdateObject.dataType == 'researchFund') {
                            query = { '_id': researcherId, "researchFund": { "$elemMatch": { "_id": dataUpdateObject.dataId } } }
                            projection = { "researchFund": { "$elemMatch": { "_id": dataUpdateObject.dataId } } }
                            Researcher.findOne(query, projection, function (error, researcherResponse2) {
                                if (error) {
                                    var alert = "[func. getEachDataUpdate] Error: " + error.message;
                                    callback("171", alert, null)
                                } else {
                                    updateConfirmation.currentData = researcherResponse2.researchFund[0]
                                    callback("172", null, updateConfirmation)
                                }
                            });

                        }
                        else if (dataUpdateObject.dataType == 'thesis') {
                            query = { '_id': researcherId, "thesis": { "$elemMatch": { "_id": dataUpdateObject.dataId } } }
                            projection = { "thesis": { "$elemMatch": { "_id": dataUpdateObject.dataId } } }
                            Researcher.findOne(query, projection, function (error, researcherResponse2) {
                                if (error) {
                                    var alert = "[func. getEachDataUpdate] Error: " + error.message;
                                    callback("171", alert, null)
                                } else {
                                    updateConfirmation.currentData = researcherResponse2.thesis[0]
                                    callback("172", null, updateConfirmation)
                                }
                            });

                        }
                        else if (dataUpdateObject.dataType == 'publication') {
                            query = { '_id': researcherId, "publication": { "$elemMatch": { "_id": dataUpdateObject.dataId } } }
                            projection = { "publication": { "$elemMatch": { "_id": dataUpdateObject.dataId } } }
                            Researcher.findOne(query, projection, function (error, researcherResponse2) {
                                if (error) {
                                    var alert = "[func. getEachDataUpdate] Error: " + error.message;
                                    callback("171", alert, null)
                                } else {
                                    updateConfirmation.currentData = researcherResponse2.publication[0]
                                    callback("172", null, updateConfirmation)
                                }
                            });

                        }
                        else {
                            var alert = "[func. dataUpdateExecution] FAIL, Error: dataType " + dataUpdateObject.dataType + " is not supported";
                            console.log(alert);
                            callback("164", alert, null);
                        }
                    }
                    else {
                        callback("164", alert, updateConfirmation);
                    }
                }
                else if (dataUpdateObject.updateType == 'new' || dataUpdateObject.updateType == 'delete') {
                    if (dataUpdateObject.dataType == 'researcher') {
                        callback('??', `ARE YOU SERIOUS??\nYOU CAN'T REQUEST RESEARCHER CREATION YOU KNOW?`, null);
                    }
                    else if (dataUpdateObject.dataType == 'develop' ||
                        dataUpdateObject.dataType == 'intProp' ||
                        dataUpdateObject.dataType == 'reward' ||
                        dataUpdateObject.dataType == 'researchFund' ||
                        dataUpdateObject.dataType == 'thesis' ||
                        dataUpdateObject.dataType == 'publication') {

                        callback("172", null, updateConfirmation)
                    }
                    else {
                        var alert = "[func. getEachDataUpdate] FAIL, Error: dataType " + dataUpdateObject.dataType + " is not supported";
                        console.log(alert);
                        callback("164", alert, null);
                    }
                }
                else {
                    var alert = "[func. getEachDataUpdate] FAIL, Error: updateType " + dataUpdateObject.updateType + " is not supported";
                    console.log(alert);
                    callback("164", alert, null);
                }

                // callback("172", null, researcherResponse)
            }
        });
    },
    newDataUpdateByResearcherId: function (researcherId, dataUpdate, callback) {
        let query = { '_id': researcherId }
        let pushToArray = { $push: { 'updateLog': dataUpdate } };
        console.log(`newDataUpdateByResearcherId >> `, query, pushToArray)
        Researcher.findOneAndUpdate(query, pushToArray, { 'select': "updateLog", 'new': true, 'useFindAndModify': false }, function (error, saveResponse) {
            // console.log(error)
            // console.log(saveResponse)
            if (error) {
                var alert = "[func. newDataUpdateByResearcherId] FAIL, Error: " + error.message;
                console.log(alert);
                // console.log(JSON.stringify(pushToArray, null, 4));
                callback("161", alert, null);
            } else {
                // console.log(saveResponse)
                callback("162", null, saveResponse)
            }
        });
    },

    dataUpdateExecution: function (researcherId, dataUpdateId, updateStatus, executer, callback) {
        var query = { '_id': researcherId, 'updateLog': { $elemMatch: { '_id': dataUpdateId, 'updateStatus': 'pending' } } }
        let projection = { '_id': 1, "updateLog": { $elemMatch: { '_id': dataUpdateId, 'updateStatus': 'pending' } } }
        // console.log(query)
        // console.log(projection)
        Researcher.findOne(query, projection, function (error, searchResponse) {
            if (error) {
                var alert = "[func. dataUpdateExecution] FAIL, Error: " + error.message;
                console.log(alert);
                callback("161", alert, null);
            } else if (searchResponse) {
                console.log(`dataUpdateExecution >> SEARCHING `, searchResponse)
                if (searchResponse.updateLog) {
                    if (updateStatus == 'reject') {
                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                            callback(code, err, data);
                        })
                    }
                    else if (updateStatus == 'accept') {
                        let fieldUpdate = {}

                        let dataUpdateObject = searchResponse.updateLog[0]
                        dataUpdateObject = JSON.parse(JSON.stringify(dataUpdateObject))

                        // console.log(searchResponse)
                        // console.log({ '$set': dataUpdateObject.updateDetails })

                        if (dataUpdateObject.updateType == 'update') {
                            console.log('executing update')

                            if (dataUpdateObject.dataType == 'researcher') {
                                Researcher.updateOne({ '_id': new ObjectId(searchResponse._id) }, { '$set': dataUpdateObject.updateDetails }, function (err2, updateResponse) {
                                    // console.log('err', err2, 'updateResult', updateResponse)
                                    confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                        callback(code, err, data);
                                    })
                                })
                            }
                            else if (dataUpdateObject.dataType == 'develop') {
                                let updateDetails_alter = {}
                                let key = Object.keys(dataUpdateObject.updateDetails);
                                key.forEach(element => {
                                    let newField = `develop.$.${element}`
                                    updateDetails_alter[newField] = dataUpdateObject.updateDetails[element]
                                });
                                console.log(`ON Id`, searchResponse._id, `dataId`, dataUpdateObject.dataId, "SET", updateDetails_alter)
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id), 'develop': { "$elemMatch": { '_id': dataUpdateObject.dataId } } },
                                    { '$set': updateDetails_alter },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'intProp') {
                                let updateDetails_alter = {}
                                let key = Object.keys(dataUpdateObject.updateDetails);
                                key.forEach(element => {
                                    let newField = `intProp.$.${element}`
                                    updateDetails_alter[newField] = dataUpdateObject.updateDetails[element]
                                });
                                console.log(updateDetails_alter)
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id), 'intProp': { "$elemMatch": { '_id': dataUpdateObject.dataId } } },
                                    { '$set': updateDetails_alter },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'reward') {
                                let updateDetails_alter = {}
                                let key = Object.keys(dataUpdateObject.updateDetails);
                                key.forEach(element => {
                                    let newField = `reward.$.${element}`
                                    updateDetails_alter[newField] = dataUpdateObject.updateDetails[element]
                                });
                                console.log(updateDetails_alter)
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id), 'reward': { "$elemMatch": { '_id': dataUpdateObject.dataId } } },
                                    { '$set': updateDetails_alter },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'researchFund') {
                                let updateDetails_alter = {}
                                let key = Object.keys(dataUpdateObject.updateDetails);
                                key.forEach(element => {
                                    let newField = `researchFund.$.${element}`
                                    updateDetails_alter[newField] = dataUpdateObject.updateDetails[element]
                                });
                                console.log(updateDetails_alter)
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id), 'researchFund': { "$elemMatch": { '_id': dataUpdateObject.dataId } } },
                                    { '$set': updateDetails_alter },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'thesis') {
                                let updateDetails_alter = {}
                                let key = Object.keys(dataUpdateObject.updateDetails);
                                key.forEach(element => {
                                    let newField = `thesis.$.${element}`
                                    updateDetails_alter[newField] = dataUpdateObject.updateDetails[element]
                                });
                                console.log(updateDetails_alter)
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id), 'thesis': { "$elemMatch": { '_id': dataUpdateObject.dataId } } },
                                    { '$set': updateDetails_alter },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'publication') {
                                let updateDetails_alter = {}
                                let key = Object.keys(dataUpdateObject.updateDetails);
                                key.forEach(element => {
                                    let newField = `publication.$.${element}`
                                    updateDetails_alter[newField] = dataUpdateObject.updateDetails[element]
                                });
                                console.log(updateDetails_alter)
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id), 'publication': { "$elemMatch": { '_id': dataUpdateObject.dataId } } },
                                    { '$set': updateDetails_alter },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else {
                                var alert = "[func. dataUpdateExecution] FAIL, Error: dataType " + dataUpdateObject.dataType + " is not supported";
                                console.log(alert);
                                callback("164", alert, null);
                            }
                        }
                        else if (dataUpdateObject.updateType == 'new') {
                            if (dataUpdateObject.dataType == 'researcher') {
                                callback('??', `ARE YOU SERIOUS??\nYOU CAN'T REQUEST RESEARCHER CREATION YOU KNOW?`, null);
                            }
                            else if (dataUpdateObject.dataType == 'develop') {
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id) },
                                    { '$push': { 'develop': dataUpdateObject.updateDetails } },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'develop') {
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id) },
                                    { '$push': { 'develop': dataUpdateObject.updateDetails } },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'intProp') {
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id) },
                                    { '$push': { 'intProp': dataUpdateObject.updateDetails } },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'reward') {
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id) },
                                    { '$push': { 'reward': dataUpdateObject.updateDetails } },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'researchFund') {
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id) },
                                    { '$push': { 'researchFund': dataUpdateObject.updateDetails } },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'thesis') {
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id) },
                                    { '$push': { 'thesis': dataUpdateObject.updateDetails } },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'publication') {
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id) },
                                    { '$push': { 'publication': dataUpdateObject.updateDetails } },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else {
                                var alert = "[func. dataUpdateExecution] FAIL, Error: dataType " + dataUpdateObject.dataType + " is not supported";
                                console.log(alert);
                                callback("164", alert, null);
                            }
                        }
                        else if (dataUpdateObject.updateType == 'delete') {
                            console.log('executing delete')

                            if (dataUpdateObject.dataType == 'researcher') {
                                callback('??', `ARE YOU SERIOUS??\nYOU CAN'T REQUEST RESEARCHER DELETE YOU KNOW?`, null);
                            }
                            else if (dataUpdateObject.dataType == 'develop') {
                                // console.log(updateDetails_alter)
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id), 'develop': { "$elemMatch": { '_id': dataUpdateObject.dataId } } },
                                    { '$set': { 'develop.$.show': false } },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'intProp') {
                                // console.log(updateDetails_alter)
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id), 'intProp': { "$elemMatch": { '_id': dataUpdateObject.dataId } } },
                                    { '$set': { 'intProp.$.show': false } },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'reward') {
                                // console.log(updateDetails_alter)
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id), 'reward': { "$elemMatch": { '_id': dataUpdateObject.dataId } } },
                                    { '$set': { 'reward.$.show': false } },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'researchFund') {
                                // console.log(updateDetails_alter)
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id), 'researchFund': { "$elemMatch": { '_id': dataUpdateObject.dataId } } },
                                    { '$set': { 'researchFund.$.show': false } },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'thesis') {
                                // console.log(updateDetails_alter)
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id), 'thesis': { "$elemMatch": { '_id': dataUpdateObject.dataId } } },
                                    { '$set': { 'thesis.$.show': false } },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else if (dataUpdateObject.dataType == 'publication') {
                                // console.log(updateDetails_alter)
                                Researcher.findOneAndUpdate(
                                    { '_id': new ObjectId(searchResponse._id), 'publication': { "$elemMatch": { '_id': dataUpdateObject.dataId } } },
                                    { '$set': { 'publication.$.show': false } },
                                    function (err2, updateResponse) {
                                        // console.log('err', err2, 'updateResult', updateResponse)
                                        confirmDataUpdate(searchResponse._id, dataUpdateId, updateStatus, executer, (code, err, data) => {
                                            callback(code, err, data);
                                        })
                                    })
                            }
                            else {
                                var alert = "[func. dataUpdateExecution] FAIL, Error: dataType " + dataUpdateObject.dataType + " is not supported";
                                console.log(alert);
                                callback("164", alert, null);
                            }
                        }
                        else {
                            var alert = "[func. dataUpdateExecution] FAIL, Error: updateType " + dataUpdateObject.updateType + " is not supported";
                            console.log(alert);
                            callback("164", alert, null);
                        }

                    }
                    else {
                        var alert = "[func. dataUpdateExecution] FAIL, Error: " + updateStatus + " is not supported as new updateStatus";
                        console.log(alert);
                        callback("164", alert, null);
                    }
                }
                else {
                    var alert = "[func. dataUpdateExecution] FAIL, Error: NO updateLog with pending status is founded";
                    console.log(alert);
                    callback("164", alert, null);
                }
            }
            else {
                var alert = "[func. dataUpdateExecution] FAIL, Error: no pending dataUpdate status at 'pending' with _id " + dataUpdateId;
                console.log(alert)
                callback("163", alert, null);
            }
        });
    }
};

//----------------

function confirmDataUpdate(researcherId, dataUpdateId, status, executer, callback) {
    var query = { '_id': researcherId, 'updateLog': { $elemMatch: { '_id': dataUpdateId, 'updateStatus': 'pending' } } }
    var update = { '$set': { 'updateLog.$.updateStatus': status, 'updateLog.$.updateStatusChangeDateTime': new Date(), 'updateLog.$.executeBy': executer } }
    // console.log(`confirmDataUpdate` , query, update)
    Researcher.findOneAndUpdate(query, update, { 'new': true, 'projection': { 'updateLog': 1 } }, function (error, searchResponse) {
        if (error) {
            var alert = "[func. confirmDataUpdate] FAIL, Error: " + error.message;
            console.log(alert);
            console.log(JSON.stringify(pushToArray, null, 4));
            callback("161", alert, null);
        } else {
            query = { '_id': researcherId }
            let updateLastEditDate = { '$set': { 'dateTime_lastEdit': new Date() } }
            if (status == 'accept') {
                Researcher.updateOne(query, updateLastEditDate, function (error, searchResponse) {
                    if (error) {
                        var alert = "[func. confirmDataUpdate] FAIL, Error: " + error.message;
                        console.log(alert);
                        console.log(JSON.stringify(pushToArray, null, 4));
                        callback("161", alert, null);
                    } else {
                        callback("162", null, searchResponse)
                    }
                })
            } else {
                callback("162", null, searchResponse)
            }
        }
    });
}