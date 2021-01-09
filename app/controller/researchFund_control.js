var Researcher = require('../model/researcher_model.js');

// var Position_Control = require("./position_control.js");
// var Division_Control = require("./division_control.js");
// var Department_Control = require("./department_control.js");

var ObjectId = require('mongodb').ObjectId;
var flow = require('../service/flow.js')

module.exports = {
    upsertResearchFundFromSheet: function (researcherCitizenId, researchFund, callback) {
        var query = { $and: [{ citizenId: researcherCitizenId }] },
            pullFromArray = { $pull: { 'researchFund': { researchName_TH: researchFund.researchName_TH } } },
            pushToArray = { $push: { 'researchFund': researchFund } };
        // console.log(update)

        // console.log("Start Upserting...")
        Researcher.updateOne(query, pullFromArray, function (error, saveResponse) {
            // console.log(error)
            // console.log(saveResponse)
            if (error) {
                var alert = "[func. upsertResearchFundFromSheet] FAIL, Error: " + error.message;
                console.log(alert);
                callback("161", alert, null);
            } else {
                Researcher.updateOne(query, pushToArray, function (error, saveResponse) {
                    // console.log(error)
                    // console.log(saveResponse)
                    // console.log(JSON.stringify(pushToArray))
                    if (error) {
                        var alert = "[func. upsertResearchFundFromSheet] FAIL, Error: " + error.message;
                        console.log(alert);
                        console.log(JSON.stringify(pushToArray,null,4));
                        callback("161", alert, null);
                    } else {
                        // console.log(saveResponse)
                        callback("162", null, saveResponse)
                    }
                });
            }
        });
    },
    getResearchFundByResearcherId: function (researcherId, callback) {
        let query = { _id: researcherId }

        let projection = { researcherPicture: true, researcherName_TH: true, researcherName_EN: true, researchFund: true }

        Researcher.find(query, projection, function (error, researcherResponse) {
            if (error) {
                var alert = "[func. getResearchFundByResearcherId] Error: " + error.message;
                callback("171", alert, null)
            } else if(researcherResponse.length > 0) {

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
                researcherResponse[0].researchFund = researcherResponse[0].researchFund.sort(compareValues());

                callback("172", null, researcherResponse)
            }
            else{
                var alert = "[func. getResearchFundByResearcherId] Error: length0 " ;
                callback("171", alert, null)
            }
        });
    },
    getResearchFundByAdmin: function (researcherId, callback) {
        let projection = { _id: true, researcherName_TH: true, researcherName_EN: true, 
            'researchFund._id': true,'researchFund.researchName_TH': true,'researchFund.researchName_EN': true,
            'researchFund.fundName': true,'researchFund.fundSource': true,'researchFund.year_buddhist': true,
            'researchFund.show': true}
        if(researcherId == null){
            let query = { show: true}
            Researcher.find(query, projection, function (error, researcherResponse) {
                if (error) {
                    var alert = "[func. getResearchFundByAdmin] Error: " + error.message;
                    callback("171", alert, null)
                } else {

                    researcherResponse.forEach((eachResearcher, index) => {
                        researcherResponse[index].researchFund = eachResearcher.researchFund.filter(eachPublication => eachPublication.show == true)
                        if (index == researcherResponse.length - 1)
                            callback("172", null, researcherResponse)
                    });
                }
            });
        }
        else{
            let query = { _id: researcherId, show: true }
            Researcher.find(query, projection, function (error, researcherResponse) {
                if (error) {
                    var alert = "[func. getResearchFundByAdmin] Error: " + error.message;
                    callback("171", alert, null)
                } else {
                    
                    researcherResponse.forEach((eachResearcher, index) => {
                        researcherResponse[index].researchFund = eachResearcher.researchFund.filter(eachPublication => eachPublication.show == true)
                        if (index == researcherResponse.length - 1)
                            callback("172", null, researcherResponse)
                    });
                }
            });
        }
    }, 
    getResearchFundForResearcherIdByAdmin: function (researchFundId, callback) {

        let query = [{$unwind: "$researchFund"}, {$match: {$and: [{"researchFund._id" : researchFundId}, {"researchFund.show" : true}]}}
        ,{ $project:{"_id": true, "researcherName_TH": true, "researcherName_EN": true,"researcherPicture": true, "researchFund": true }}]

        Researcher.aggregate(query, function (error, researcherResponse) {
            if (error) {
                var alert = "[func. getResearchFundForResearcherIdByAdmin] Error: " + error.message;
                callback("171", alert, null)
            } else {
                callback("172", null, researcherResponse[0])
            }
        });
    }
};

//----------------