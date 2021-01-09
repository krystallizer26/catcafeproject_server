var Researcher = require('../model/researcher_model.js');

// var Position_Control = require("./position_control.js");
// var Division_Control = require("./division_control.js");
// var Department_Control = require("./department_control.js");

var ObjectId = require('mongodb').ObjectId;
var flow = require('../service/flow.js')

module.exports = {
    upsertRewardFromSheet: function (researcherCitizenId, reward, callback) {
        var query = { $and: [{ citizenId: researcherCitizenId }] },
            pullFromArray = { $pull: { 'reward': { name: reward.name } } },
            pushToArray = { $push: { 'reward': reward } };
        // console.log(update)

        // console.log("Start Upserting...")
        Researcher.updateOne(query, pullFromArray, function (error, saveResponse) {
            // console.log(error)
            // console.log(saveResponse)
            if (error) {
                var alert = "[func. upsertRewardFromSheet] FAIL, Error: " + error.message;
                console.log(alert);
                callback("161", alert, null);
            } else {
                Researcher.updateOne(query, pushToArray, function (error, saveResponse) {
                    // console.log(error)
                    // console.log(saveResponse)
                    // console.log(JSON.stringify(pushToArray))
                    if (error) {
                        var alert = "[func. upsertRewardFromSheet] FAIL, Error: " + error.message;
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
    getRewardByResearcherId: function (researcherId, callback) {
        let query = { _id: researcherId, show: true }

        let projection = { researcherPicture: true, researcherName_TH: true, researcherName_EN: true, reward: true }

        Researcher.find(query, projection, function (error, researcherResponse) {
            if (error) {
                var alert = "[func. getRewardByResearcherId] Error: " + error.message;
                callback("171", alert, null)
            } else if (researcherResponse.length > 0) {

                function compareValues() {
                    return function compare(a, b) {
                        // Use toUpperCase() to ignore character casing
                        let bandA = a.recieveDate;
                        let bandB = b.recieveDate;

                        let comparison = 0;
                        if (bandA > bandB) {
                            comparison = -1;
                        } else if (bandA < bandB) {
                            comparison = 1;
                        }
                        return comparison;
                    }
                }
                researcherResponse[0].reward = researcherResponse[0].reward.sort(compareValues());

                callback("172", null, researcherResponse)
            }
            else {
                var alert = "[func. getRewardByResearcherId] Error: length0";
                callback("171", alert, null)
            }
        });
    },
    getRewardByAdmin: function (researcherId, callback) {
        let projection = {
            _id: true, researcherName_TH: true, researcherName_EN: true,
            'reward._id': true, 'reward.name': true, 'reward.announceLocation_TH': true,
            'reward.announceLocation_EN': true, 'reward.year_buddhist': true, 'reward.show': true
        }

        if (researcherId == null) {
            let query = { show: true }
            Researcher.find(query, projection, function (error, researcherResponse) {
                if (error) {
                    var alert = "[func. getRewardByAdmin] Error: " + error.message;
                    callback("171", alert, null)
                } else {

                    researcherResponse.forEach((eachResearcher, index) => {
                        researcherResponse[index].reward = eachResearcher.reward.filter(eachPublication => eachPublication.show == true)
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
                    var alert = "[func. getRewardByAdmin] Error: " + error.message;
                    callback("171", alert, null)
                } else {
                    researcherResponse.forEach((eachResearcher, index) => {
                        researcherResponse[index].reward = eachResearcher.reward.filter(eachPublication => eachPublication.show == true)
                        if (index == researcherResponse.length - 1)
                            callback("172", null, researcherResponse)
                    });
                }
            });
        }

    },
    getRewardForResearcherIdByAdmin: function (rewardId, callback) {

        let query = [{ $unwind: "$reward" }, { $match: { $and: [{ "reward._id": rewardId }, { "reward.show": true }] } }
            , { $project: { "_id": true, "researcherName_TH": true, "researcherName_EN": true, "reward": true } }]

        Researcher.aggregate(query, function (error, researcherResponse) {
            if (error) {
                var alert = "[func. getRewardForResearcherIdByAdmin] Error: " + error.message;
                callback("171", alert, null)
            } else {
                callback("172", null, researcherResponse[0])
            }
        });
    },
};

//----------------