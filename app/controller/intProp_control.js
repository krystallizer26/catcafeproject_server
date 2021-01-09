var Researcher = require('../model/researcher_model.js');

// var Position_Control = require("./position_control.js");
// var Division_Control = require("./division_control.js");
// var Department_Control = require("./department_control.js");

var ObjectId = require('mongodb').ObjectId;
var flow = require('../service/flow.js')

module.exports = {
    upsertIntPropFromSheet: function (researcherCitizenId, intProp, callback) {
        var query = { $and: [{ citizenId: researcherCitizenId }] },
            pullFromArray = { $pull: { 'intProp': { name_TH: intProp.name_TH } } },
            pushToArray = { $push: { 'intProp': intProp } };
        // console.log(update)

        // console.log("Start Upserting...")
        Researcher.updateOne(query, pullFromArray, function (error, saveResponse) {
            // console.log(error)
            // console.log(saveResponse)
            if (error) {
                var alert = "[func. upsertIntPropFromSheet] FAIL, Error: " + error.message;
                console.log(alert);
                callback("161", alert, null);
            } else {
                Researcher.updateOne(query, pushToArray, function (error, saveResponse) {
                    // console.log(error)
                    // console.log(saveResponse)
                    // console.log(JSON.stringify(pushToArray))
                    if (error) {
                        var alert = "[func. upsertIntPropFromSheet] FAIL, Error: " + error.message;
                        console.log(alert);
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
    getIntPropByResearcherId: function (researcherId, callback) {
        let query = { _id: researcherId }

        let projection = { researcherPicture: true, researcherName_TH: true, researcherName_EN: true, intProp: true }

        Researcher.find(query, projection, function (error, researcherResponse) {
            if (error) {
                var alert = "[func. gettIntPropByResearcherId] Error: " + error.message;
                callback("171", alert, null)
            } else if (researcherResponse.length > 0) {

                function compareValues() {
                    return function compare(a, b) {
                        // Use toUpperCase() to ignore character casing
                        let bandA = a.grantedDate;
                        let bandB = b.grantedDate;

                        let comparison = 0;
                        if (bandA > bandB) {
                            comparison = -1;
                        } else if (bandA < bandB) {
                            comparison = 1;
                        }
                        return comparison;
                    }
                }
                researcherResponse[0].intProp = researcherResponse[0].intProp.sort(compareValues());
                callback("172", null, researcherResponse)
            }
            else {
                var alert = "[func. gettIntPropByResearcherId] Error: length 0";
                callback("171", alert, null)
            }

        });
    },
    getIntPropByAdmin: function (researcherId, callback) {

        let projection = {
            _id: true, researcherName_TH: true, researcherName_EN: true,
            'intProp._id': true, 'intProp.name_TH': true, 'intProp.name_EN': true, 'intProp.coverage': true,
            'intProp.show': true
        }
        if (researcherId == null) {
            let query = { show: true }
            Researcher.find(query, projection, function (error, researcherResponse) {
                if (error) {
                    var alert = "[func. gettIntPropByResearcherId] Error: " + error.message;
                    callback("171", alert, null)
                } else {

                    researcherResponse.forEach((eachResearcher, index) => {
                        researcherResponse[index].intProp = eachResearcher.intProp.filter(eachPublication => eachPublication.show == true)
                        if (index == researcherResponse.length - 1)
                            callback("172", null, researcherResponse)
                    });
                }
            });
        } else {
            let query = { _id: researcherId, show: true }
            Researcher.find(query, projection, function (error, researcherResponse) {
                if (error) {
                    var alert = "[func. gettIntPropByResearcherId] Error: " + error.message;
                    callback("171", alert, null)
                } else {

                    researcherResponse.forEach((eachResearcher, index) => {
                        researcherResponse[index].intProp = eachResearcher.intProp.filter(eachPublication => eachPublication.show == true)
                        if (index == researcherResponse.length - 1)
                            callback("172", null, researcherResponse)
                    });
                }
            });
        }
    },
    getIntPropForResearcherIdByAdmin: function (intPropId, callback) {

        let query = [{ $unwind: "$intProp" }, { $match: { $and: [{ "intProp._id": intPropId }, { "intProp.show": true }] } }
            , { $project: { "_id": true, "researcherName_TH": true, "researcherName_EN": true, "intProp": true } }]

        Researcher.aggregate(query, function (error, researcherResponse) {
            if (error) {
                var alert = "[func. getIntPropForResearcherIdByAdmin] Error: " + error.message;
                callback("171", alert, null)
            } else {
                callback("172", null, researcherResponse[0])
            }
        });
    }
};

//----------------