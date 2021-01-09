var Researcher = require("../model/researcher_model.js");
var User = require("../model/user.js");

// var Position_Control = require("./position_control.js");
// var Division_Control = require("./division_control.js");
// var Department_Control = require("./department_control.js");

var ObjectId = require("mongodb").ObjectId;
var flow = require("../service/flow.js");
var ejs = require("ejs");
var pdf = require("html-pdf");
var path = require("path");
var config = require("../../config/config.js");
var dateFormat = require("dateformat");
var fs = require("fs");

module.exports = {
  newResearcher: function (researcher, callback) {
    researcher.save(function (error, saveResponse) {
      if (error) {
        var alert =
          "[func. newResearcher] Error in saving Researcher Error: " +
          error.message;
        callback("171", alert, null);
      } else {
        // console.log(`${researcher.citizenId} is saved...`)
        callback("172", null, saveResponse);
      }
    });
  },
  softDeleteResearcher: function (researcherId, callback) {
    Researcher.findOneAndUpdate(
      { _id: researcherId },
      { $set: { show: false } },
      function (error, result) {
        if (error) {
          var alert =
            "[func. softDeleteResearcher] Error in deleting Error: " +
            error.message;
          callback("171", alert, null);
        } else {
          User.findOneAndUpdate(
            { researcherId: researcherId },
            { $set: { isBlocked: true } },
            function (error, result) {
              if (error) {
                var alert =
                  "[func. softDeleteResearcher] Error in deleting Error: " +
                  error.message;
                callback("171", alert, null);
              } else {
                callback("172", null, result);
              }
            }
          );
        }
      }
    );
  },
  checkResearcherByID: function (researcherId, callback) {
    let query = { _id: researcherId };

    let projection = {
      citizenId: 0,
      insignia: 0,
      retiredDate: 0,
      assignDate: 0,
      birthDate: 0,
      birthDateText: 0,
      mobilePhone: 0,
      room_TH: 0,
    };

    Researcher.findOne(query, projection, function (error, researcherResponse) {
      if (error) {
        var alert =
          "[func. checkResearcherByID] Error in finding Researcher Error: " +
          error.message;
        callback("171", alert, null);
      } else {
        function compareValues(column) {
          return function compare(a, b) {
            // Use toUpperCase() to ignore character casing
            let bandA = null;
            let bandB = null;

            if (column == "d" || column == "f") {
              bandA = a.startDate;
              bandB = b.startDate;
            } else if (column == "i") {
              bandA = a.applyDate;
              bandB = b.applyDate;
            } else if (column == "p") {
              bandA = a.year_buddhist;
              bandB = b.year_buddhist;
            } else {
              bandA = a.recieveDate;
              bandB = b.recieveDate;
            }

            let comparison = 0;
            if (bandA > bandB) {
              comparison = -1;
            } else if (bandA < bandB) {
              comparison = 1;
            }
            return comparison;
          };
        }

        if (researcherResponse) {
          researcherResponse = JSON.parse(JSON.stringify(researcherResponse));

          let listPublication = researcherResponse.publication;
          let search = new RegExp("วารสารฯ ระดับนานาชาติ", "i");
          let resultListPublication = listPublication.filter((item) =>
            search.test(item.publicationLevel)
          );
          researcherResponse.publication = resultListPublication
            .sort(compareValues("p"))
            .slice(0, 3);
          researcherResponse.develop = researcherResponse.develop
            .sort(compareValues("d"))
            .slice(0, 3);
          researcherResponse.researchFund = researcherResponse.researchFund
            .sort(compareValues("f"))
            .slice(0, 3);
          researcherResponse.reward = researcherResponse.reward
            .sort(compareValues("r"))
            .slice(0, 3);
          researcherResponse.intProp = researcherResponse.intProp
            .sort(compareValues("i"))
            .slice(0, 3);
          researcherResponse.thesis = researcherResponse.thesis
            .sort(compareValues("i"))
            .slice(0, 3);

          let round = researcherResponse.thesis.length;
          let completed = 0;
          if (round > 0) {
            researcherResponse.thesis.forEach(async (element, index) => {
              let result = null;

              let resultStatus = null;
              let resultDate = null;
              let publicationList = [];
              let needFindPub = false;

              if (element.graduation == null) {
                if (element.thesisExam == null) {
                  if (element.thesisOutlineExam == null) {
                    if (element.thesisTopicAnnounce == null) {
                      if (element.thesisTopicProposal == null) {
                        if (element.instructorAssignDate == null) {
                          resultStatus = "Waiting for instructor assignment";
                          resultDate = null;
                        } else {
                          resultStatus =
                            "Instructor assignment completed, waiting for thesis topic proposal";
                          resultDate = element.instructorAssignDate;
                        }
                      } else {
                        resultStatus =
                          "Thesis topic proposal completed, waiting for thesis topic announcement";
                        resultDate = element.thesisTopicProposal;
                      }
                    } else {
                      resultStatus =
                        "Thesis topic announcement completed, during outline examination";
                      resultDate = element.thesisTopicAnnounce;
                    }
                  } else {
                    resultStatus =
                      "Pass outline examination, during thesis examination";
                    resultDate = element.thesisOutlineExam;
                  }
                } else {
                  resultStatus = "Pass thesis examination, during graduation";
                  resultDate = element.thesisExam;
                }
              } else {
                resultStatus = "Graduated";
                resultDate = element.graduation;
                needFindPub = true;
              }

              if (needFindPub) {
                Researcher.findOne(
                  { _id: researcherId },
                  {
                    publication: {
                      $elemMatch: { studentId: element.student.studentId },
                    },
                  },
                  function (err, publicationList) {
                    console.log(`publicationList >> ${publicationList}`);
                    researcherResponse.thesis[index].studentStatus = {
                      resultStatus: resultStatus,
                      resultDate: resultDate,
                      publicationList: publicationList,
                    };
                    completed++;

                    console.log(`ROUND >> ${completed} / ${round}`);
                    if (completed == round) {
                      callback("172", null, researcherResponse);
                    }
                  }
                );
              } else {
                researcherResponse.thesis[index].studentStatus = {
                  resultStatus: resultStatus,
                  resultDate: resultDate,
                  publicationList: [],
                };
                completed++;

                console.log(`ROUND >> ${completed} / ${round}`);
                if (completed == round) {
                  callback("172", null, researcherResponse);
                }
              }
            });
          } else {
            callback("172", null, researcherResponse);
          }
        } else {
          callback("172", null, researcherResponse);
        }
      }
    });
  },
  getAllResearcher: function (needHidden, callback) {
    let query = {};
    if (needHidden == "false") {
      query = { show: true };
    }

    let projection = {
      publication: false,
      reward: false,
      intProp: false,
      develop: false,
      researchFund: false,
    };

    Researcher.find(query, projection, function (error, researcherResponse) {
      if (error) {
        var alert =
          "[func. getAllResearcher] Error in finding Researcher Error: " +
          error.message;
        callback("171", alert, null);
      } else {
        callback("172", null, researcherResponse);
      }
    });
  },
  getAvailableDepartment: function (callback) {
    Researcher.find({ show: true }).distinct(
      "department",
      function (error, result) {
        if (error) {
          var alert =
            "[func. getAllResearcher] Error in finding Error: " + error.message;
          callback("171", alert, null);
        } else {
          callback("172", null, result);
        }
      }
    );
  },
  getAvailableAcademicPosition: function (callback) {
    Researcher.find({ show: true }).distinct(
      "academicPosition",
      function (error, result) {
        if (error) {
          var alert =
            "[func. getAvailableAcademicPosition] Error in finding Error: " +
            error.message;
          callback("171", alert, null);
        } else {
          callback("172", null, result);
        }
      }
    );
  },
  getAvailableInstructor: function (degree, callback) {
    Researcher.find({ show: true, "instructorV2.degree": degree }).distinct(
      "instructorV2.name",
      function (error, result) {
        if (error) {
          var alert =
            "[func. getAvailableInstructor_master] Error in finding Error: " +
            error.message;
          callback("171", alert, null);
        } else {
          callback("172", null, result);
        }
      }
    );
  },
  upsertResearcherFromSheet: function (researcher, callback) {
    var query = { citizenId: researcher.citizenId },
      update = researcher,
      options = {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        useFindAndModify: false,
      };
    // console.log(update)

    // console.log("Start Upserting...")
    Researcher.updateOne(
      query,
      update,
      options,
      function (error, saveResponse) {
        // console.log(error)
        if (error) {
          var alert =
            "[func. upsertResearcherFromSheet] FAIL, Error: " + error.message;
          console.log(alert);
          console.log(update);
          callback("161", alert, null);
        } else {
          // console.log(saveResponse)
          callback("162", null, saveResponse);
        }
      }
    );
  },
  getResearcherForHomePage: function (queryObj, pageNum, pageSize, callback) {
    let needSkip = (pageNum - 1) * pageSize;
    if (needSkip < 0) {
      let alert = `Something wrong with query... unable to gather data with required query`;
      callback("172", alert, null);
    } else {
      console.log("skip", needSkip, "size", pageSize);
      Researcher.aggregate(
        [
          { $match: queryObj },
          { $sort: { dateTime_lastEdit: -1 } },
          { $skip: needSkip },
          { $limit: pageSize },
          {
            $project: {
              keywords_EN: 1,
              keywords_TH: 1,
              researcherName_EN: 1,
              researcherName_TH: 1,
              researcherPicture: 1,
            },
          },
        ],
        function (error, researcherResponse) {
          if (error) {
            var alert =
              "[func. getResearcherForHomePage] Error in finding Researcher Error: " +
              error.message;
            callback("171", alert, null, null);
          } else {
            Researcher.countDocuments(queryObj, function (err, Response) {
              if (err) {
                var alert =
                  "[func. getResearcherForHomePage] Error in finding Researcher Error: " +
                  error.message;
                callback("171", alert, null, null);
              } else {
                let returnObj = {};
                returnObj.pageSize = pageSize;
                returnObj.currentPage = pageNum;
                returnObj.maxPage = Math.ceil(Response / pageSize);
                returnObj.maxResearcherCount = Response;
                returnObj.dataInPage = researcherResponse;
                // console.log()
                callback("172", null, returnObj);
              }
            });
          }
        }
      );
    }
  },
  getResearcherByKeyword: function (
    query,
    projectionObj,
    fieldObj,
    sortObj,
    pageNum,
    pageSize,
    callback
  ) {
    let needSkip = (pageNum - 1) * pageSize;
    // let needSkip = 2
    if (needSkip < 0) {
      let alert = `Something wrong with query... unable to gather data with required query`;
      callback("172", alert, null);
    } else {
      let aggregateObj = [];
      aggregateObj.push({ $match: query });
      aggregateObj.push({ $project: projectionObj });
      aggregateObj.push({ $addFields: fieldObj });
      if (
        Object.keys(fieldObj.keywordMatchCount_EN).length > 0 &&
        Object.keys(fieldObj.keywordMatchCount_TH).length > 0
      )
        aggregateObj.push({
          $addFields: {
            keywordMatch_all: {
              $add: ["$keywordMatchCount_EN", "$keywordMatchCount_TH"],
            },
          },
        });
      else aggregateObj.push({ $addFields: { keywordMatch_all: [] } });
      if (Object.keys(sortObj).length > 0)
        aggregateObj.push({ $sort: sortObj });
      aggregateObj.push({ $skip: needSkip });

      console.log(JSON.stringify(aggregateObj, null, 4));
      Researcher.aggregate(aggregateObj, function (error, researcherResponse) {
        if (error) {
          var alert =
            "[func. getResearcherByKeyword] Error in finding Researcher Error: " +
            error.message;
          callback("171", alert, null, null);
        } else {
          Researcher.countDocuments(query, function (err, Response) {
            if (err) {
              var alert =
                "[func. getResearcherByKeyword] Error in finding Researcher Error: " +
                error;
              callback("171", alert, null, null);
            } else {
              let returnObj = {};
              returnObj.pageSize = pageSize;
              returnObj.currentPage = pageNum;
              returnObj.maxPage = Math.ceil(Response / pageSize);
              returnObj.maxResearcherCount = Response;
              returnObj.dataInPage = researcherResponse;
              callback("172", null, returnObj);
            }
          });
        }
      });
    }
  },
  getResearcherForKeyword: function (
    pageNum,
    pageSize,
    filter,
    searchWord,
    callback
  ) {
    let needHidden = filter[0];
    let researcherName = filter[1];
    let keyword = filter[2];
    let researchOutput = filter[3];
    let intellectual = filter[4];
    let target = filter[5];
    let thesis = filter[6];
    let course = filter[7];
    let math = filter[8];
    let biology = filter[9];
    let physics = filter[10];
    let com = filter[11];
    let chamitry = filter[12];
    let stat = filter[13];
    let query = {};
    let queryName = null;

    if (needHidden == "false") {
      query = { show: true };
    }

    let needSkip = (pageNum - 1) * pageSize;
    if (needSkip < 0) {
      let alert = `Something wrong with query... unable to gather data with required query`;
      callback("172", alert, null);
    }

    // let projection = { researcherPicture: true, researcherName_TH: true, researcherName_EN: true, researchFund: true }

    Researcher.find(query, function (error, researcherResponse) {
      if (error) {
        var alert = "[func. getResearcherForKeyword] Error: " + error.message;
        callback("171", alert, null);
      } else {
        if (researcherName == "true") {
          (queryName = { researcherName_TH: /searchWord/ }),
            { researcherName_TH: /searchWord/ };
        }
        callback("172", null, researcherResponse);
      }
    });
    callback("171", null, null);
  },
  getResearcherListByAdmin: function (researcherId, callback) {
    // let needSkip = (pageNum - 1) * pageSize
    // if (needSkip < 0) {
    //     let alert = `Something wrong with query... unable to gather data with required query`
    //     callback("172", alert, null)
    // }
    // else {
    if (researcherId == null) {
      let queryObj = { show: true };
      Researcher.aggregate(
        [
          { $match: queryObj },
          { $sort: { dateTime_lastEdit: -1 } },
          {
            $project: {
              _id: 1,
              department: 1,
              academicPosition: 1,
              researcherName_EN: 1,
              researcherName_TH: 1,
              email: 1,
            },
          },
        ],
        function (error, researcherResponse) {
          if (error) {
            var alert =
              "[func. getResearcherListByAdmin] Error in finding Researcher Error: " +
              error.message;
            callback("171", alert, null, null);
          } else {
            callback("172", null, researcherResponse);
          }
        }
      );
    } else {
      let queryObj = { $and: [{ _id: researcherId }, { show: true }] };
      Researcher.aggregate(
        [
          { $match: queryObj },
          { $sort: { dateTime_lastEdit: -1 } },
          {
            $project: {
              _id: 1,
              department: 1,
              academicPosition: 1,
              researcherName_EN: 1,
              researcherName_TH: 1,
              email: 1,
            },
          },
        ],
        function (error, researcherResponse) {
          if (error) {
            var alert =
              "[func. getResearcherListByAdmin] Error in finding Researcher Error: " +
              error.message;
            callback("171", alert, null, null);
          } else {
            callback("172", null, researcherResponse);
          }
        }
      );
    }
    //}
  },
  getkResearcherForIdByAdmin: function (researcherId, callback) {
    let query = { _id: researcherId };

    let projection = {
      citizenId: 0,
      __v: 0,
      room_EN: 0,
      linkedIn: 0,
      publication: 0,
      researchFund: 0,
      reward: 0,
      intProp: 0,
      instructor: 0,
      develop: 0,
    };

    Researcher.findOne(query, projection, function (error, researcherResponse) {
      if (error) {
        var alert =
          "[func. getkResearcherForIdByAdmin] Error in finding Researcher Error: " +
          error.message;
        callback("171", alert, null);
      } else {
        callback("172", null, researcherResponse);
      }
    });
  },
  getDataGenPDF: function (researcherId, callback) {
    let query = { _id: researcherId };

    let projection = {
      elsvierData: 1,
      _id: 1,
      researcherName_EN: 1,
      reward: 1,
      department: 1,
      keywords_EN: 1,
      mobilePhone: 1,
      researcherPicture: 1,
      personalSite: 1,
      email: 1,
      bachelorDegree: 1,
      masterDegree: 1,
      doctorDegree: 1,
      academicPosition: 1,
      assignDate: 1,
      publication: 1,
    };

    Researcher.findOne(query, projection, function (error, researcherResponse) {
      if (error) {
        var alert =
          "[func. checkResearcherByID] Error in finding Researcher Error: " +
          error.message;
        callback("171", alert, null);
      } else {
        function compareValues(column) {
          return function compare(a, b) {
            // Use toUpperCase() to ignore character casing
            let bandA = null;
            let bandB = null;

            if (column == "p") {
              bandA = a.year_buddhist;
              bandB = b.year_buddhist;
            } else {
              bandA = a.recieveDate;
              bandB = b.recieveDate;
            }

            let comparison = 0;
            if (bandA > bandB) {
              comparison = -1;
            } else if (bandA < bandB) {
              comparison = 1;
            }
            return comparison;
          };
        }
        let listPublication = researcherResponse.publication;
        let search1 = new RegExp("วารสารฯ ระดับนานาชาติ", "i");
        let search2 = new RegExp("การประชุมฯ", "i");
        let tmpEducation = null;
        let confer = listPublication
          .filter((item) => search2.test(item.publicationLevel))
          .sort(compareValues("p"));
        let hIndex = "N/A";
        let documentCount = "N/A";
        let citationCount = "N/A";

        if (researcherResponse.doctorDegree != null) {
          tmpEducation = researcherResponse.doctorDegree;
        } else if (researcherResponse.masterDegree != null) {
          tmpEducation = researcherResponse.masterDegree;
        } else {
          tmpEducation = researcherResponse.bachelorDegree;
        }
        researcherResponse.reward = researcherResponse.reward.sort(
          compareValues("r")
        );

        researcherResponse.reward.forEach((element) => {
          element.work = dateFormat(element.recieveDate, "dd mmmm yyyy");
        });

        confer.forEach((element) => {
          if (
            dateFormat(element.conferenceStartDate, "mmmm") ==
            dateFormat(element.conferenceFinishDate, "mmmm")
          ) {
            element.bookPublisher =
              dateFormat(element.conferenceStartDate, "dd") +
              " - " +
              dateFormat(element.conferenceFinishDate, "dd mmmm yyyy");
          } else {
            element.bookPublisher =
              dateFormat(element.conferenceStartDate, "dd mmmm") +
              " - " +
              dateFormat(element.conferenceFinishDate, "dd mmmm yyyy");
          }
        });

        if (researcherResponse.elsvierData.hIndex != null) {
          hIndex = researcherResponse.elsvierData.hIndex;
        }
        if (researcherResponse.elsvierData.documentCount != null) {
          documentCount = researcherResponse.elsvierData.documentCount;
        }
        if (researcherResponse.elsvierData.citationCount != null) {
          citationCount = researcherResponse.elsvierData.citationCount;
        }

        var test = "";

        let researcherPicFolder = "./public/file/image/researcherPic";

        if (researcherResponse.researcherPicture != null) {
          let temp = researcherResponse.researcherPicture.replace(
            `https://research.science.kmitl.ac.th/uploads`,
            "./public"
          );
          // console.log(temp)
          // temp = researcherResponse.researcherPicture
          try {
            test = `data:image/jpeg;base64,${fs.readFileSync(temp, {
              encoding: "base64",
            })}`;
          } catch (e) {
            test = `data:image/jpeg;base64,${fs.readFileSync(
              "./public/file/image/researcherPic/defaultForCV.jpg",
              { encoding: "base64" }
            )}`;
          }
        }

        let setData = [];
        setData.push({
          hIndex: hIndex,
          documentCount: documentCount,
          citationCount: citationCount,
          Address:
            "Department of " +
            researcherResponse.department.name_EN +
            ", Faculty Of Science, KMITL, Ladkrabang, Bangkok 10520",
          //   tel: researcherResponse.mobilePhone,
          email: researcherResponse.email,
          web: researcherResponse.personalSite.link,
          researcherPicture: test,
          keywords_EN: researcherResponse.keywords_EN,
          awards: researcherResponse.reward,
          researcherName: researcherResponse.researcherName_EN,
          publicationsInter: listPublication
            .filter((item) => search1.test(item.publicationLevel))
            .sort(compareValues("p")),
          publicationsConferance: confer,
          education: tmpEducation,
          id: researcherResponse._id,
          // tmpdoc: researcherResponse.doctorDegree,
          // tmpmaster: researcherResponse.masterDegree,
          // tmpbac: researcherResponse.bachelorDegree
        });
        callback("172", null, setData[0]);
      }
    });
  },
  GenPDF: function (setData, fileName, callback) {
    let researcherCvFolder = "./public/file/cv";
    let folderName = researcherCvFolder.split("/");
    let folderNameTmp = ".";
    for (let i = 1; i < folderName.length; i++) {
      folderNameTmp = folderNameTmp + "/" + folderName[i];
      // console.log(folderNameTmp)
      if (!fs.existsSync(folderNameTmp)) {
        fs.mkdirSync(folderNameTmp);
      }
    }
    ejs.renderFile(
      path.join(__dirname, "report-template.ejs"),
      { objData: setData },
      (err, data) => {
        if (err) {
          var alert =
            "[func. GenPDF] Error in finding Researcher Error: " + err.message;
          callback("171", alert, null);
        } else {
          let savePath = researcherCvFolder + "/" + fileName + ".pdf";
          console.log(savePath);
          let options = {
            header: {
              height: "20mm",
            },
            footer: {
              height: "20mm",
            },
          };
          pdf.create(data, options).toFile(savePath, function (error, data) {
            if (error) {
              var alert =
                "[func. GenPDF] Error in finding Researcher Error: " +
                error.message;
              callback("171", alert, null);
            } else {
              data = savePath.replace(
                /\.\/public/i,
                `https://research.science.kmitl.ac.th/uploads`
              );
              callback("172", null, data);
            }
          });
        }
      }
    );
  },
};

//----------------
