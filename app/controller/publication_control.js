var Researcher = require('../model/researcher_model.js');

// var Position_Control = require("./position_control.js");
// var Division_Control = require("./division_control.js");
// var Department_Control = require("./department_control.js");

var ObjectId = require('mongodb').ObjectId;
var flow = require('../service/flow.js')

module.exports = {
    upsertPublicationFromSheet: function (researcherCitizenId, publicationObj, callback) {
        var query = { $and: [{ citizenId: researcherCitizenId }] },
            pullFromArray = { $pull: { 'publication': { name: publicationObj.name } } },
            pushToArray = { $push: { 'publication': publicationObj } };
        // console.log(update)

        // console.log("Start Upserting...")
        Researcher.updateOne(query, pullFromArray, function (error, saveResponse) {
            // console.log(error)
            // console.log(saveResponse)
            if (error) {
                var alert = "[func. upsertPublicationFromSheet] FAIL, Error: " + error.message;
                console.log(alert);
                callback("161", alert, null);
            } else {
                Researcher.updateOne(query, pushToArray, function (error, saveResponse) {
                    // console.log(error)
                    // console.log(saveResponse)
                    if (error) {
                        var alert = "[func. upsertPublicationFromSheet] FAIL, Error: " + error.message;
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
    getPublicationByResearcherId: function (researcherId, reqPublicationLevel, callback) {
        let query = { _id: researcherId, show: true }

        // let projection = {'publication.name': true, 'publication.doi': true, 'publication.publicationLevel': true }
        let projection = {}

        Researcher.find(query, projection, function (error, researcherResponse) {
            if (error) {
                var alert = "[func. getPublicationByResearcherId] Error: " + error.message;
                callback("171", alert, null)
            } else if (researcherResponse.length > 0) {

                let keyword = '';
                if (reqPublicationLevel == 1) {
                    keyword = 'วารสารฯ ระดับนานาชาติ';
                }
                else if (reqPublicationLevel == 2) {
                    keyword = 'วารสารฯ ระดับชาติ';
                }
                else if (reqPublicationLevel == 3) {
                    keyword = 'การประชุมฯ';
                }
                else if (reqPublicationLevel == 4) {
                    keyword = 'อื่นๆ';
                }
                // console.log(researcherResponse)
                if (researcherResponse[0]) {
                    //console.log(keyword);
                    let listPublication = researcherResponse[0].publication;
                    let search = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                    let resultListPublication = listPublication.filter(item => search.test(item.publicationLevel));

                    function compareValues() {
                        return function compare(a, b) {
                            let bandA = a.year_buddhist;
                            let bandB = b.year_buddhist;

                            let comparison = 0;
                            if (bandA > bandB) {
                                comparison = -1;
                            } else if (bandA < bandB) {
                                comparison = 1;
                            }
                            return comparison;
                        }
                    }

                    researcherResponse[0].publication = resultListPublication.sort(compareValues());
                }
                else {
                    researcherResponse = []
                }
                callback("172", null, researcherResponse)
            }
            else {
                var alert = "[func. getPublicationByResearcherId] Error: lrngth 0";
                callback("171", alert, null)
            }

        });
    },
    getPublicationByAdmin: function (researcherId, callback) {
        let projection = {
            _id: true,
            researcherName_TH: true,
            researcherName_EN: true,
            'publication._id': true,
            'publication.name': true,
            'publication.publicationLocation': true,
            'publication.publicationLevel': true,
            'publication.owner': true,
            'publication.year_buddhist': true,
            'publication.show': true
        }

        if (researcherId == null) {
            let query = { show: true }
            Researcher.find(query, projection, function (error, researcherResponse) {
                if (error) {
                    var alert = "[func. getPublicationByAdmin] Error: " + error.message;
                    callback("171", alert, null)
                } else {

                    researcherResponse.forEach((eachResearcher, index) => {
                        researcherResponse[index].publication = eachResearcher.publication.filter(eachPublication => eachPublication.show == true)
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
                    var alert = "[func. getPublicationByAdmin] Error: " + error.message;
                    callback("171", alert, null)
                } else {

                    researcherResponse.forEach((eachResearcher, index) => {
                        researcherResponse[index].publication = eachResearcher.publication.filter(eachPublication => eachPublication.show == true)
                        if (index == researcherResponse.length - 1)
                            callback("172", null, researcherResponse)
                    });

                }
            });
        }
    },
    getPublicationForResearcherIdByAdmin: function (publicationId, callback) {

        let query = [{ $unwind: "$publication" }, { $match: { $and: [{ "publication._id": publicationId }, { "publication.show": true }] } }
            , { $project: { "_id": true, "researcherName_TH": true, "researcherName_EN": true, "publication": true } }]

        Researcher.aggregate(query, function (error, researcherResponse) {
            if (error) {
                var alert = "[func. getPublicationForResearcherIdByAdmin] Error: " + error.message;
                callback("171", alert, null)
            } else {
                callback("172", null, researcherResponse[0])
            }
        });
    },
};

//----------------