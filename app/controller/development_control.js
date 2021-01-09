var Researcher = require('../model/researcher_model.js');

// var Position_Control = require("./position_control.js");
// var Division_Control = require("./division_control.js");
// var Department_Control = require("./department_control.js");

var ObjectId = require('mongodb').ObjectId;
var flow = require('../service/flow.js')

module.exports = {
    upsertDevelopmentFromSheet: function (researcherCitizenId, develop, callback) {
        var query = { $and: [{ citizenId: researcherCitizenId }] },
            pullFromArray = { $pull: { 'develop': { meetingName: develop.meetingName } } },
            pushToArray = { $push: { 'develop': develop } };
        // console.log(update)

        // console.log("Start Upserting...")
        Researcher.updateOne(query, pullFromArray, function (error, saveResponse) {
            // console.log(error)
            // console.log(saveResponse)
            if (error) {
                var alert = "[func. upsertDevelopmentFromSheet] FAIL, Error: " + error.message;
                console.log(alert);
                callback("161", alert, null);
            } else {
                Researcher.updateOne(query, pushToArray, function (error, saveResponse) {
                    // console.log(error)
                    // console.log(saveResponse)
                    if (error) {
                        var alert = "[func. upsertDevelopmentFromSheet] FAIL, Error: ";
                        console.log(alert, error.message);
                        console.log(JSON.stringify(pushToArray, null, 4));
                        callback("161", alert, null);
                    } else {
                        // console.log(saveResponse)
                        callback("162", null, saveResponse)
                    }
                });
            }
        });
    },
    getDevelopmentByResearcherId: function (researcherId, callback) {
        let query = { _id: researcherId }

        let projection = { researcherPicture: true, researcherName_TH: true, researcherName_EN: true, develop: true }

        Researcher.find(query, projection, function (error, researcherResponse) {
            if (error) {
                var alert = "[func. getDevelopmentByResearcherId] Error: " + error.message;
                callback("171", alert, null)
            } else if (researcherResponse.length > 0) {

                function compareValues() {
                    return function compare(a, b) {
                        // Use toUpperCase() to ignore character casing
                        let bandA = a.startDate;
                        let bandB = b.startDate;

                        let comparison = 0;
                        if (bandA > bandB) {
                            comparison = -1;
                        } else if (bandA < bandB) {
                            comparison = 1;
                        }
                        return comparison;
                    }
                }
                researcherResponse[0].develop = researcherResponse[0].develop.sort(compareValues());

                callback("172", null, researcherResponse)
            }
            else {
                var alert = "[func. getDevelopmentByResearcherId] Error: length 0";
                callback("171", alert, null)
            }
        });
    },
    getDevelopmentByAdmin: function (researcherId, callback) {

        let projection = {
            _id: true, researcherName_TH: true, researcherName_EN: true,
            'develop._id': true, 'develop.meetingName': true, 'develop.location': true, 'develop.country': true,
            'develop.startDate': true, 'develop.finishDate': true, 'develop.show': true
        }

        if (researcherId == null) {
            let query = { show: true }
            Researcher.find(query, projection, function (error, researcherResponse) {
                if (error) {
                    var alert = "[func. getDevelopmentByAdmin] Error: " + error.message;
                    callback("171", alert, null)
                } else {

                    researcherResponse.forEach((eachResearcher, index) => {
                        researcherResponse[index].develop = eachResearcher.develop.filter(eachPublication => eachPublication.show == true)
                        if (index == researcherResponse.length - 1)
                            callback("172", null, researcherResponse)
                    });
                }
            });
        }
        else {
            let query = { _id: researcherId, show: true }
            Researcher.find(query, projection, function (error, researcherResponse) {
                if (error) {
                    var alert = "[func. getDevelopmentByAdmin] Error: " + error.message;
                    callback("171", alert, null)
                } else {

                    researcherResponse.forEach((eachResearcher, index) => {
                        researcherResponse[index].develop = eachResearcher.develop.filter(eachPublication => eachPublication.show == true)
                        if (index == researcherResponse.length - 1)
                            callback("172", null, researcherResponse)
                    });
                }
            });
        }
    },
    getDevelopmentForResearcherIdByAdmin: function (developId, callback) {

        let query = [{ $unwind: "$develop" }, { $match: { $and: [{ "develop._id": developId }, { "develop.show": true }] } }
            , { $project: { "_id": true, "researcherName_TH": true, "researcherName_EN": true, "develop": true } }]

        Researcher.aggregate(query, function (error, researcherResponse) {
            if (error) {
                var alert = "[func. getDevelopmentForResearcherIdByAdmin] Error: " + error.message;
                callback("171", alert, null)
            } else {
                callback("172", null, researcherResponse[0])
            }
        });
    }
};

//----------------