var Researcher = require('../model/researcher_model.js');

// var Position_Control = require("./position_control.js");
// var Division_Control = require("./division_control.js");
// var Department_Control = require("./department_control.js");

var ObjectId = require('mongodb').ObjectId;
var flow = require('../service/flow.js')

module.exports = {
    upsertThesisFromSheet: function (researcherCitizenId, thesisObj, callback) {
        var query = { $and: [{ citizenId: researcherCitizenId }] },
            pullFromArray = { $pull: { 'thesis': { thesisName_TH: thesisObj.thesisName_TH } } },
            pushToArray = { $push: { 'thesis': thesisObj } };
        // if (thesisObj.thesisName_EN == "Approximation methods for solving new problems and split general system of variational inequalities") {
        //     console.log(JSON.stringify(query, null, 4))
        //     console.log(JSON.stringify(pullFromArray, null, 4))
        //     console.log(JSON.stringify(pushToArray, null, 4))
        // }
        // console.log(query)

        // console.log("Start Upserting...")
        Researcher.updateOne(query, pullFromArray, function (error, saveResponse) {
            // console.log(error)
            // console.log(saveResponse)
            if (error) {
                var alert = "[func. upsertThesisFromSheet] FAIL, Error: " + error.message;
                console.log(alert);
                callback("161", alert, null);
            } else {
                Researcher.updateOne(query, pushToArray, function (error, saveResponse) {
                    // console.log(error)
                    // console.log(saveResponse)
                    // console.log(JSON.stringify(pushToArray,null,4))
                    if (error) {
                        var alert = "[func. upsertThesisFromSheet] FAIL, Error: " + error.message;
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
    getThesisByResearcherId: function (researcherId, callback) {
        // let query = []
        // if(level == 'master') {
        //     query.push({masterDegreeCourse: {$ne: ""}})
        // }
        // if(level == 'doctor') {
        //     query.push({masterDegreeCourse: {$ne: ""}})
        // }
        let query = { _id: researcherId }

        let projection = { researcherPicture: true, researcherName_TH: true, researcherName_EN: true, thesis: true }
        Researcher.aggregate([
            { $match: query },
            {
                $addFields: {
                    "thesis": { studentStatus: null },
                    "thesis": { publicationMatch: [] }
                }
            },
            {
                $project: {
                    "researcherPicture": true,
                    "researcherName_TH": true,
                    "researcherName_EN": true,
                    "thesis": true
                }
            }
        ], function (error, researcherResponse) {
            if (error) {
                var alert = "[func. getThesisByResearcherId] Error: " + error.message;
                callback("171", alert, null)
            } else if (researcherResponse.length > 0) {
                let addData = 0
                researcherResponse[0].thesis.forEach((thesis, index) => {
                    // console.log(thesis.thesisName_TH)

                    console.log(new RegExp(`^.*${thesis.thesisName_TH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'ig'))
                    console.log(new RegExp(`^.*${thesis.thesisName_EN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'ig'))

                    let query2 = { $or: [{ 'publication.name': { $regex: new RegExp(`^.*${thesis.thesisName_TH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'ig') } }, { 'publication.name': { $regex: new RegExp(`^.*${thesis.thesisName_EN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'ig') } }] }
                    let projection2 = { publication: true }
                    console.log('query2>> \n', JSON.stringify(query2))
                    Researcher.find(query2, projection2, function (error, publicationResponse) {
                        console.log('\nthesisnameTH\n', thesis.thesisName_TH, '\nthesisnameEN\n', thesis.thesisName_EN, '\npubliMatch\n', publicationResponse)
                        console.log('==================')
                        researcherResponse[0].thesis[index].publicationMatch = publicationResponse

                        if (error) {
                            var alert = "[func. getThesisByResearcherId] Error: " + error.message;
                            callback("171", alert, null)
                        } else {
                            addData++
                            if (addData >= researcherResponse[0].thesis.length) {
                                callback("172", null, researcherResponse)
                            }
                        }
                    });
                    // callback("172", null, researcherResponse)
                })
            }
            else {
                var alert = "[func. getThesisByResearcherId] Error: length 0";
                callback("171", alert, null)
            }
        });
    },
    getThesisStatus: async function (researcherId, thesis, callback) {

        let resultStatus = null
        let resultDate = null
        // let publicationList = []
        let needFindPub = false
        if (thesis.graduation == null) {
            if (thesis.thesisExam == null) {
                if (thesis.thesisOutlineExam == null) {
                    if (thesis.thesisTopicAnnounce == null) {
                        if (thesis.thesisTopicProposal == null) {
                            if (thesis.instructorAssignDate == null) {
                                resultStatus = "Waiting for instructor assignment"
                                resultDate = null
                            }
                            else {
                                resultStatus = "Instructor assignment completed, waiting for thesis topic proposal"
                                resultDate = thesis.instructorAssignDate
                            }
                        }
                        else {
                            resultStatus = "Thesis topic proposal completed, waiting for thesis topic announcement"
                            resultDate = thesis.thesisTopicProposal
                        }
                    }
                    else {
                        resultStatus = "Thesis topic announcement completed, during outline examination"
                        resultDate = thesis.thesisTopicAnnounce
                    }
                }
                else {
                    resultStatus = "Pass outline examination, during thesis examination"
                    resultDate = thesis.thesisOutlineExam
                }
            }
            else {
                resultStatus = "Pass thesis examination, during graduation"
                resultDate = thesis.thesisExam
            }
        }
        else {
            resultStatus = "Graduated"
            resultDate = thesis.graduation
            needFindPub = true
        }

        if (needFindPub) {
            Researcher.findOne({ "_id": researcherId }, { "publication": { "$elemMatch": { "studentId": thesis.student.studentId } } }, function (err, publicationList) {
                // console.log(`publicationList >> ${publicationList}`)
                let returnObj = {
                    resultStatus: resultStatus,
                    resultDate: resultDate,
                    publicationList: publicationList
                }
                console.log(`RETURNOBJ >> ${JSON.stringify(returnObj)}`)
                callback(returnObj)
            })
        }
        else {
            callback({
                resultStatus: resultStatus,
                resultDate: resultDate,
                publicationList: []
            })
        }
    },
    getThesisByResearcherId: function (researcherId, callback) {
        // let query = []
        // if(level == 'master') {
        //     query.push({masterDegreeCourse: {$ne: ""}})
        // }
        // if(level == 'doctor') {
        //     query.push({masterDegreeCourse: {$ne: ""}})
        // }
        let query = { _id: researcherId }

        let projection = { researcherPicture: true, researcherName_TH: true, researcherName_EN: true, thesis: true }
        Researcher.aggregate([
            { $match: query },
            {
                $addFields: {
                    "thesis": { studentStatus: null },
                    "thesis": { publicationMatch: [] }
                }
            },
            {
                $project: {
                    "researcherPicture": true,
                    "researcherName_TH": true,
                    "researcherName_EN": true,
                    "thesis": true
                }
            }
        ], function (error, researcherResponse) {
            if (error) {
                var alert = "[func. getThesisByResearcherId] Error: " + error.message;
                callback("171", alert, null)
            } else {
                let addData = 0
                // console.log(researcherResponse)
                // if (true) {
                if (researcherResponse.length > 0) {
                    if (researcherResponse[0].thesis.length > 0) {
                        function compareValues() {
                            return function compare(a, b) {
                                // Use toUpperCase() to ignore character casing
                                let bandA = a.applyDate;
                                let bandB = b.applyDate;

                                let comparison = 0;
                                if (bandA > bandB) {
                                    comparison = -1;
                                } else if (bandA < bandB) {
                                    comparison = 1;
                                }
                                return comparison;
                            }
                        }
                        researcherResponse[0].thesis = researcherResponse[0].thesis.sort(compareValues());
                        researcherResponse[0].thesis.forEach((thesis, index) => {
                            // console.log(thesis.thesisName_TH)

                            console.log(new RegExp(`^.*${thesis.thesisName_TH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'ig'))
                            console.log(new RegExp(`^.*${thesis.thesisName_EN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'ig'))

                            let query2 = { $or: [{ 'publication.name': { $regex: new RegExp(`^.*${thesis.thesisName_TH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'ig') } }, { 'publication.name': { $regex: new RegExp(`^.*${thesis.thesisName_EN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'ig') } }] }
                            let projection2 = { publication: true }
                            console.log('query2>> \n', JSON.stringify(query2))
                            Researcher.find(query2, projection2, function (error, publicationResponse) {
                                console.log('\nthesisnameTH\n', thesis.thesisName_TH, '\nthesisnameEN\n', thesis.thesisName_EN, '\npubliMatch\n', publicationResponse)
                                console.log('==================')
                                /***** เอาแค่ ชื่อ + doi *****/
                                researcherResponse[0].thesis[index].publicationMatch = []
                                // researcherResponse[0].thesis[index].publicationMatch = publicationResponse

                                if (error) {
                                    var alert = "[func. getThesisByResearcherId] Error: " + error.message;
                                    callback("171", alert, null)
                                } else {
                                    addData++
                                    if (addData >= researcherResponse[0].thesis.length) {
                                        callback("172", null, researcherResponse)
                                    }
                                }
                            });
                            // callback("172", null, researcherResponse)
                        })
                    }
                    else {
                        callback("172", null, researcherResponse)
                    }
                }
                else {
                    callback("172", null, researcherResponse)
                }
            }
        });
    },
    getThesisByAdmin: function (researcherId, callback) {
        let projection = { _id: true, researcherName_TH: true, researcherName_EN: true, thesis: true }

        if (researcherId == null) {
            let query = { show: true }
            Researcher.find(query, projection, function (error, researcherResponse) {
                if (error) {
                    var alert = "[func. getThesisByAdmin] Error: " + error.message;
                    callback("171", alert, null)
                } else {

                    researcherResponse.forEach((eachResearcher, index) => {
                        researcherResponse[index].thesis = eachResearcher.thesis.filter(eachPublication => eachPublication.show == true)
                        if (index == researcherResponse.length - 1)
                            callback("172", null, researcherResponse)
                    });
                }
            });
        } else {
            let query = { _id: researcherId, show: true }
            Researcher.find(query, projection, function (error, researcherResponse) {
                if (error) {
                    var alert = "[func. getThesisByAdmin] Error: " + error.message;
                    callback("171", alert, null)
                } else {
                    researcherResponse.forEach((eachResearcher, index) => {
                        researcherResponse[index].thesis = eachResearcher.thesis.filter(eachPublication => eachPublication.show == true)
                        if (index == researcherResponse.length - 1)
                            callback("172", null, researcherResponse)
                    });
                }
            });
        }
    },
    getThesisForResearcherIdByAdmin: function (thesisId, callback) {

        let query = [{ $unwind: "$thesis" }, { $match: { $and: [{ "thesis._id": thesisId }, { "thesis.show": true }] } }
            , { $project: { "_id": true, "researcherName_TH": true, "researcherName_EN": true, "thesis": true } }]

        Researcher.aggregate(query, function (error, researcherResponse) {
            if (error) {
                var alert = "[func. getThesisForResearcherIdByAdmin] Error: " + error.message;
                callback("171", alert, null)
            } else {
                callback("172", null, researcherResponse[0])
            }
        });

    },
};

//----------------