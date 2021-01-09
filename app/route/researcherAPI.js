var express = require('express');
var router = express.Router();
var randomstring = require("randomstring");
var formidable = require('formidable')
var path = require('path')
var fs = require('fs');
let ejs = require("ejs");
let pdf = require("html-pdf");

var config = require('../../config/config.js');
const bcrypt = require('bcrypt')

// DATABASE SETUP
var ObjectId = require('mongodb').ObjectId;

var ReturnCode = require('../model/returnCode.js');
var Researcher = require('../model/researcher_model.js');
var User = require('../model/user.js');

var flow = require('../service/flow.js')
var Validate = require("../service/validation.js");
var auth = require("../controller/auth.js");
var Return = require("../service/return.js");
var Researcher_Control = require('../controller/researcher_control.js');
var User_Control = require('../controller/user_control.js');

const userController = require("../controller/auth")

router.get('/fuckme_errorplz/', function (request, response) {
    Return.responsePattern(405, ReturnCode.clientError + methodCode + "009", 'User ของคุณไม่มีสิทธิทำงานในส่วนนี้', null, null, response);
    let a = []
    console.log('ERROR1')
    console.log(a[0])
    console.log('ERROR2')
    console.log(a[0].a)
    console.log('ERROR3')
})

router.post('/admin/researcher/', userController.checkUserInfo, function (request, response) { //ตัวอย่าง API ที่มีรูปมาด้วย

    if (request.userInfo.roles.indexOf("staff") == -1) {
        Return.responsePattern(405, ReturnCode.clientError + methodCode + "009", 'User ของคุณไม่มีสิทธิทำงานในส่วนนี้', null, null, response);
    }
    else {
        console.log("newResearcher Start")
        let researcherPicFolder = "./public/file/image/researcherPic"
        var methodCode = "FP";

        console.log("File Location Detecting")
        let folderName = researcherPicFolder.split("/")
        let folderNameTmp = "."
        for (let i = 1; i < folderName.length; i++) {
            folderNameTmp = folderNameTmp + "/" + folderName[i]
            // console.log(folderNameTmp)
            if (!fs.existsSync(folderNameTmp)) {
                fs.mkdirSync(folderNameTmp);
            }
        }

        console.log("Parsing Request...")
        let responseJSON = {}
        let doneOnce = false

        let incomingForm = new formidable.IncomingForm();
        incomingForm.parse(request, function (err, fields, files) { // ใช้ตัวแปลงนี้ ถ้าเกิดส่งมาแบบผสม (ข้อมูล + ไฟล์ต่างๆ)
            // if (!doneOnce) {
            doneOnce = true
            console.log("Parsing Request COMPLETED...")
            if (err) {
                responseJSON.err = "ERROR in incomingForm.parse >>" + err
                console.log('ERROR: ' + err)
                res.status(200).json(responseJSON);
            } else {
                // console.log(fields)
                var requiredData = [];
                requiredData.push(fields.researcherName_TH);
                requiredData.push(fields.researcherName_EN);
                // requiredData.push(fields.scorpusId);
                // requiredData.push(fields.citizenId);
                requiredData.push(fields.email);
                requiredData.push(fields.academicPosition);
                // requiredData.push(fields.instructorXbachelor);
                // requiredData.push(fields.instructorXmaster);
                // requiredData.push(fields.instructorXdoctor);
                var requiredReady = Validate.requiredData_Check(requiredData)

                console.log("Validation 4")
                var isoDateData = [];
                if (fields.birthDate) isoDateData.push(fields.birthDate);
                if (fields.assignDate) isoDateData.push(fields.assignDate);
                if (fields.retiredDate) isoDateData.push(fields.retiredDate);
                var isoDateReady = Validate.isoDateData_Check(isoDateData)

                console.log("Validation 5")
                var jsonObjData = [];
                // if (fields.department) jsonObjData.push(fields.department);
                // if (fields.academicPosition) jsonObjData.push(fields.academicPosition);
                if (fields.insignia) jsonObjData.push(fields.insignia);
                if (fields.course) jsonObjData.push(fields.course);
                // if (fields.department) jsonObjData.push(fields.department);
                var jsonObjReady = Validate.jsonObjData_Check(jsonObjData)
                console.log("Validation Success")


                if (!requiredReady) {
                    var alert = "Input Not Valid, check if some data is required."
                    console.log(alert);
                    Return.responseWithCode(ReturnCode.clientError + methodCode + "001", alert, response)
                } else if (!isoDateReady) {
                    var alert = "Input Not Valid, check if some data is not applicable to ISODate format."
                    console.log(alert);
                    Return.responseWithCode(ReturnCode.clientError + methodCode + "004", alert, response)
                } else if (!jsonObjReady) {
                    var alert = "Input Not Valid, check if some data is not JSON format."
                    console.log(alert);
                    Return.responseWithCode(ReturnCode.clientError + methodCode + "005", alert, response)
                } else {
                    console.log("Start Researcher Creation")
                    var researcher = new Researcher();
                    console.log("Start uploading Files")
                    if (files) {
                        // console.log(files.uploadPicture.path, files.uploadPicture.name)
                        if (files.researcherPicture) {
                            console.log("FILEFOUNDED")
                            let oldpath1 = files.researcherPicture.path;
                            let fileExt1 = files.researcherPicture.name.split('.')[1];
                            let newfilename1 = randomstring.generate(12) + Date.now()
                            let newpath1 = researcherPicFolder + "/" + newfilename1 + "." + fileExt1
                            let rawData = fs.readFileSync(oldpath1)


                            researcher.researcherPicture = newpath1.replace(/\.\/public/i, `https://research.science.kmitl.ac.th/uploads`)

                            // fs.rename(oldpath1, newpath1, function (err) {
                            //     console.log("RENAME researcherPicture COMPLETE")
                            // });
                            fs.writeFile(newpath1, rawData, function (err) {
                                console.log("RENAME researcherPicture COMPLETE")
                            });
                        }
                        else {
                            console.log("FILENOTFOUND")
                            researcher.researcherPicture = fields.researcherPicture

                        }
                    }
                    //after files are all set
                    console.log("All file are uploaded.")

                    flow.exec(
                        function () {
                            // console.log(fields)
                            if (fields.researcherName_TH) researcher.researcherName_TH = fields.researcherName_TH
                            if (fields.researcherName_EN) researcher.researcherName_EN = fields.researcherName_EN
                            if (fields.scorpusId) researcher.scorpusId = fields.scorpusId
                            if (fields.citizenId) researcher.citizenId = null

                            let departmentObj = {}
                            if (fields.departmentName_TH) departmentObj.name_TH = fields.departmentName_TH
                            if (fields.departmentName_EN) departmentObj.name_EN = fields.departmentName_EN
                            researcher.department = departmentObj

                            if (fields.academicPosition) researcher.academicPosition = fields.academicPosition

                            let bachelorObj = {}
                            if (fields["bachelorDegree[degreeName_TH]"]) bachelorObj.degreeName_TH = fields["bachelorDegree[degreeName_TH]"]
                            if (fields["bachelorDegree[degreeName_EN]"]) bachelorObj.degreeName_EN = fields["bachelorDegree[degreeName_EN]"]
                            if (fields["bachelorDegree[graduationYear]"]) bachelorObj.graduationYear = fields["bachelorDegree[graduationYear]"]
                            if (fields["bachelorDegree[universityName_TH]"]) bachelorObj.universityName_TH = fields["bachelorDegree[universityName_TH]"]
                            if (fields["bachelorDegree[universityName_EN]"]) bachelorObj.universityName_EN = fields["bachelorDegree[universityName_EN]"]
                            if (fields["bachelorDegree[universityCountry_TH]"]) bachelorObj.universityCountry_TH = fields["bachelorDegree[universityCountry_TH]"]
                            if (fields["bachelorDegree[universityCountry_EN]"]) bachelorObj.universityCountry_EN = fields["bachelorDegree[universityCountry_EN]"]
                            researcher.bachelorDegree = bachelorObj

                            let masterObj = {}
                            if (fields["masterDegree[degreeName_TH]"]) masterObj.degreeName_TH = fields["masterDegree[degreeName_TH]"]
                            if (fields["masterDegree[degreeName_EN]"]) masterObj.degreeName_EN = fields["masterDegree[degreeName_EN]"]
                            if (fields["masterDegree[graduationYear]"]) masterObj.graduationYear = fields["masterDegree[graduationYear]"]
                            if (fields["masterDegree[universityName_TH]"]) masterObj.universityName_TH = fields["masterDegree[universityName_TH]"]
                            if (fields["masterDegree[universityName_EN]"]) masterObj.universityName_EN = fields["masterDegree[universityName_EN]"]
                            if (fields["masterDegree[universityCountry_TH]"]) masterObj.universityCountry_TH = fields["masterDegree[universityCountry_TH]"]
                            if (fields["masterDegree[universityCountry_EN]"]) masterObj.universityCountry_EN = fields["masterDegree[universityCountry_EN]"]
                            researcher.masterDegree = masterObj

                            let doctorObj = {}
                            if (fields["doctorDegree[degreeName_TH]"]) doctorObj.degreeName_TH = fields["doctorDegree[degreeName_TH]"]
                            if (fields["doctorDegree[degreeName_EN]"]) doctorObj.degreeName_EN = fields["doctorDegree[degreeName_EN]"]
                            if (fields["doctorDegree[graduationYear]"]) doctorObj.graduationYear = fields["doctorDegree[graduationYear]"]
                            if (fields["doctorDegree[universityName_TH]"]) doctorObj.universityName_TH = fields["doctorDegree[universityName_TH]"]
                            if (fields["doctorDegree[universityName_EN]"]) doctorObj.universityName_EN = fields["doctorDegree[universityName_EN]"]
                            if (fields["doctorDegree[universityCountry_TH]"]) doctorObj.universityCountry_TH = fields["doctorDegree[universityCountry_TH]"]
                            if (fields["doctorDegree[universityCountry_EN]"]) doctorObj.universityCountry_EN = fields["doctorDegree[universityCountry_EN]"]
                            researcher.doctorDegree = doctorObj

                            if (fields.birthDate) researcher.birthDate = new Date(fields.birthDate)
                            if (fields.assignDate) researcher.assignDate = new Date(fields.assignDate)
                            if (fields.retiredDate) researcher.retiredDate = new Date(fields.retiredDate)

                            // [
                            //     {
                            //         name: { type: String, default: null },
                            //         link: { type: String, default: null },
                            //         degree: { type: String, default: null }
                            //     }
                            // ]
                            let instructorObj = []
                            // if (fields.instructorXbachelor) instructorObj.bachelor = JSON.parse(fields.instructorXbachelor)
                            // if (fields.instructorXmaster) instructorObj.master = JSON.parse(fields.instructorXmaster)
                            // if (fields.instructorXdoctor) instructorObj.doctor = JSON.parse(fields.instructorXdoctor)
                            researcher.instructor = instructorObj

                            if (fields.targetIndustry_TH) researcher.targetIndustry_TH = fields.targetIndustry_TH
                            if (fields.targetIndustry_EN) researcher.targetIndustry_EN = fields.targetIndustry_EN
                            if (fields.keywords_TH) researcher.keywords_TH = fields.keywords_TH.split(",")
                            if (fields.keywords_EN) researcher.keywords_EN = fields.keywords_EN.split(",")

                            if (fields.internalPhone) researcher.internalPhone = fields.internalPhone
                            if (fields.mobilePhone) researcher.mobilePhone = fields.mobilePhone
                            if (fields.email) researcher.email = fields.email
                            if (fields.room_TH) researcher.room_TH = fields.room_TH
                            if (fields.room_EN) researcher.room_EN = fields.room_EN

                            let facebookObj = {}
                            if (fields.facebookXname) facebookObj.name = fields.facebookXname
                            if (fields.facebookXlink) facebookObj.link = fields.facebookXlink
                            researcher.facebook = facebookObj

                            let twitterObj = {}
                            if (fields.twitterXname) twitterObj.twitterXname = fields.twitterXname
                            if (fields.twitterXlink) twitterObj.twitterXlink = fields.twitterXlink
                            researcher.twitter = twitterObj

                            let instragramObj = {}
                            if (fields.instragramXname) instragramObj.instragramXname = fields.instragramXname
                            if (fields.instragramXlink) instragramObj.instragramXlink = fields.instragramXlink
                            researcher.instragram = instragramObj

                            let lineObj = {}
                            if (fields.lineXname) lineObj.lineXname = fields.lineXname
                            if (fields.lineXlink) lineObj.lineXlink = fields.lineXlink
                            researcher.line = lineObj

                            let personalSiteObj = {}
                            if (fields.personalSiteXname) personalSiteObj.personalSiteXname = fields.personalSiteXname
                            if (fields.personalSiteXlink) personalSiteObj.personalSiteXlink = fields.personalSiteXlink
                            researcher.personalSite = personalSiteObj

                            if (fields.insignia) researcher.insignia = JSON.parse(fields.insignia)
                            if (fields.course) researcher.course = JSON.parse(fields.course)

                            // researcher.course = []
                            // let courseNameList = []
                            // let courseUrlList = []
                            // if (fields.courseXname) courseNameList = fields.courseXname.split(",")
                            // if (fields.courseXurl) courseUrlList = fields.courseXurl.split(",")
                            // let courstListCount = 0
                            // if (courseNameList.length > courseUrlList.length)
                            //     courstListCount = courseNameList.length
                            // else
                            //     courstListCount = courseUrlList.length

                            // if (courstListCount > 0)
                            //     for (let i = 0; i < courstListCount; i++) {
                            //         let courseObj = {
                            //             name: courseNameList[i],
                            //             url: courseUrlList[i]
                            //         }
                            //         researcher.course.push(courseObj)
                            //     }

                            // console.log(researcher)
                            Researcher_Control.newResearcher(researcher, this);
                        },
                        function (code, err, researcherSaveResult) {
                            if (err) {
                                Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                            } else {
                                let user = new User()

                                bcrypt.genSalt(10).then((salt) => {
                                    let passwordString = randomstring.generate(8)
                                    let userName = fields.researcherName_TH.replace(/\s+/, '\x01').split('\x01')
                                    bcrypt.hash(passwordString, salt).then((password) => {
                                        user.email = fields.email
                                        user.password = password
                                        user.firstname = userName[0]
                                        user.lastname = userName[1] ? userName[1] : " "
                                        let departmentObj = {}
                                        if (fields.departmentName_TH) departmentObj.name_TH = fields.departmentName_TH
                                        if (fields.departmentName_EN) departmentObj.name_EN = fields.departmentName_EN
                                        user.department = departmentObj
                                        user.roles = "researcher"
                                        user.researcherId = researcherSaveResult._id
                                        user.tokenResetPassword = ""
                                        User_Control.newUser(user, passwordString, this)
                                    })
                                })

                            }
                        },
                        function (code, err, userSaveResult) {
                            if (err) {
                                Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                            } else {
                                let responseObj = {
                                    email: userSaveResult.email,
                                    firstname: userSaveResult.firstname,
                                    lastname: userSaveResult.lastname,
                                    department: userSaveResult.department,
                                    roles: userSaveResult.roles,
                                    researcherId: userSaveResult.researcherId,
                                }
                                Return.responseWithCodeAndData(ReturnCode.success, "new Researcher and User is successfully saved", responseObj, response);
                            }
                        }
                    );
                }
            }
            // }
        });
    }
});

router.get('/meta/researcher/department/', function (request, response) {
    var methodCode = "XK";

    flow.exec(
        function () {
            Researcher_Control.getAvailableDepartment(this);
        },
        function (code, err, getResponse) {
            if (err) {
                Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
            } else {
                Return.responseWithCodeAndData(ReturnCode.success, "getAvailableDepartment Successfully executed", getResponse, response);
            }
        }
    );

});

router.get('/meta/researcher/academicposition/', function (request, response) {
    var methodCode = "XK";

    flow.exec(
        function () {
            Researcher_Control.getAvailableAcademicPosition(this);
        },
        function (code, err, getResponse) {
            if (err) {
                Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
            } else {
                Return.responseWithCodeAndData(ReturnCode.success, "getAvailableAcademicPosition Successfully executed", getResponse, response);
            }
        }
    );

});

router.get('/meta/researcher/instructor', function (request, response) {
    var methodCode = "XK";

    flow.exec(
        function () {
            Researcher_Control.getAvailableInstructor(request.query.degree, this);
        },
        function (code, err, getResponse) {
            if (err) {
                Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
            } else {
                Return.responseWithCodeAndData(ReturnCode.success, "getAvailableInstructor Successfully executed", getResponse, response);
            }
        }
    );

});


// router.get('/researcher/', function (request, response) {
//     var methodCode = "KR";
//     var requiredData = [];
//     requiredData.push(request.query.needHidden);
//     var requiredReady = Validate.requiredData_Check(requiredData)

//     var booleanData = [];
//     booleanData.push(request.query.needHidden);
//     var booleanReady = Validate.booleanData_Check(booleanData)
//     // console.log(request.query)
//     if (!requiredReady) {
//         var alert = "Input Not Valid, check if some data is required."
//         console.log(alert);
//         Return.responseWithCode(ReturnCode.clientError + methodCode + "001", alert, response)
//     }
//     else if (!booleanReady) {
//         var alert = "Input Not Valid, check if some data must be 'true' or 'false'"
//         console.log(alert);
//         Return.responseWithCode(ReturnCode.clientError + methodCode + "002", alert, response)
//     }
//     else {
//         flow.exec(
//             function () {
//                 Researcher_Control.getAllResearcher(request.query.needHidden, this);
//             },
//             function (code, err, getResponse) {
//                 if (err) {
//                     Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
//                 } else {
//                     Return.responseWithCodeAndData(ReturnCode.success, "getAllResearcher Successfully executed", getResponse, response);
//                 }
//             }
//         );
//     }
// });

router.delete('/admin/researcher/:researcherId', function (request, response) {
    var methodCode = "XF";

    var requiredData = [];
    requiredData.push(request.params.researcherId);
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
                Researcher_Control.softDeleteResearcher(new ObjectId(request.params.researcherId), this);
            },
            function (code, err, getResponse) {
                if (err) {
                    Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                } else {
                    Return.responseWithCodeAndData(ReturnCode.success, "getResearcherById Successfully soft DELETED", null, response);
                }
            }
        );
    }
});

router.get('/researcher/:researcherId', userController.checkUserInfo_exception, function (request, response) {
    var methodCode = "XF";

    var requiredData = [];
    requiredData.push(request.params.researcherId);
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
                Researcher_Control.checkResearcherByID(new ObjectId(request.params.researcherId), this);
            },
            function (code, err, getResponse) {
                if (err) {
                    Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                } else {
                    if (getResponse) {
                        getResponse = JSON.parse(JSON.stringify(getResponse))
                        if (request.userInfo.researcherId == request.params.researcherId)
                            getResponse.owner = true
                        else
                            getResponse.owner = false
                        Return.responseWithCodeAndData(ReturnCode.success, "getResearcherById Successfully executed", getResponse, response);
                    } else {
                        Return.responseWithCodeAndData(ReturnCode.success, "getResearcherById Successfully executed; no researcher with ID sented", getResponse, response);
                    }
                }
            }
        );
    }
});

router.get('/researcher/', function (request, response) {
    var methodCode = "KF";

    var requiredData = [];
    requiredData.push(request.query.pageNum);
    requiredData.push(request.query.pageSize);
    var requiredReady = Validate.requiredData_Check(requiredData)

    var numberData = [];
    numberData.push(request.query.pageNum);
    numberData.push(request.query.pageSize);
    var numberReady = Validate.numberData_Check(numberData)

    var booleanData = [];
    booleanData.push(request.query.needHidden);
    booleanData.push(request.query.matchResearcherName);
    booleanData.push(request.query.matchKeyword);
    booleanData.push(request.query.matchResearchOutput);
    booleanData.push(request.query.matchIntellectual);
    booleanData.push(request.query.matchCourse);
    booleanData.push(request.query.matchTarget);
    booleanData.push(request.query.matchThesis);
    booleanData.push(request.query.deptartmentMath);
    booleanData.push(request.query.deptartmentBiology);
    booleanData.push(request.query.deptartmentPhysics);
    booleanData.push(request.query.deptartmentComputerScience);
    booleanData.push(request.query.deptartmentChemitry);
    booleanData.push(request.query.deptartmentStatisic);
    var booleanReady = Validate.booleanData_Check(booleanData)
    // console.log(request.query)

    console.log("Validation Success")

    if (!requiredReady) {
        var alert = "Input Not Valid, check if some data is required."
        console.log(alert);
        Return.responseWithCode(ReturnCode.clientError + methodCode + "001", alert, response)
    } else if (!numberReady) {
        var alert = "Input Not Valid, check if some data is not number parsable."
        console.log(alert);
        Return.responseWithCode(ReturnCode.clientError + methodCode + "003", alert, response)
    } else if (!booleanReady) {
        var alert = "Input Not Valid, check if some data must be 'true' or 'false'"
        console.log(alert);
        Return.responseWithCode(ReturnCode.clientError + methodCode + "002", alert, response)
    }
    else {

        if (!request.query.queryText) {
            console.log("NO QUERYText")
            let queryObj = []
            if (request.query.deptartmentMath == "true")
                queryObj.push({ "department.name_TH": "คณิตศาสตร์" })
            if (request.query.deptartmentComputerScience == "true")
                queryObj.push({ "department.name_TH": "วิทยาการคอมพิวเตอร์" })
            if (request.query.deptartmentStatisic == "true")
                queryObj.push({ "department.name_TH": "สถิติ" })
            if (request.query.deptartmentChemitry == "true")
                queryObj.push({ "department.name_TH": "เคมี" })
            if (request.query.deptartmentBiology == "true")
                queryObj.push({ "department.name_TH": "ชีววิทยา" })
            if (request.query.deptartmentPhysics == "true")
                queryObj.push({ "department.name_TH": "ฟิสิกส์" })
            // if (request.query.needHidden != "true")
            //     queryObj.push({ show: true })

            // queryObj.push({ show: true })
            if (queryObj == [])
                queryObj = { $and: [{ show: true }, { $or: [{ retiredDate: null }, { retiredDate: { $gte: new Date() } }] }, { show: true }] }
            else {
                queryObj = { $or: queryObj }
                queryObj = { $and: [{ show: true }, { $or: [{ retiredDate: null }, { retiredDate: { $gte: new Date() } }] }, queryObj] }
            }

            console.log(`QUERYOBJ -> ${queryObj}`)
            flow.exec(
                function () {
                    Researcher_Control.getResearcherForHomePage(queryObj, parseInt(request.query.pageNum), parseInt(request.query.pageSize), this);
                },
                function (code, err, getResponse) {
                    if (err) {
                        Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                    } else {
                        Return.responseWithCodeAndData(ReturnCode.success, "getResearcherForHomePage Successfully executed", getResponse, response);
                    }
                }
            );
        }
        else {

            console.log("WITH QUERYText")
            let projectionObj = {}
            let fieldObj = {}
            let sortObj = {}
            let matchingQueryObj = []
            let departmentQueryObj = []
            if (request.query.deptartmentMath == "true")
                departmentQueryObj.push({ "department.name_TH": "คณิตศาสตร์" })
            if (request.query.deptartmentComputerScience == "true")
                departmentQueryObj.push({ "department.name_TH": "วิทยาการคอมพิวเตอร์" })
            if (request.query.deptartmentStatisic == "true")
                departmentQueryObj.push({ "department.name_TH": "สถิติ" })
            if (request.query.deptartmentChemitry == "true")
                departmentQueryObj.push({ "department.name_TH": "เคมี" })
            if (request.query.deptartmentBiology == "true")
                departmentQueryObj.push({ "department.name_TH": "ชีววิทยา" })
            if (request.query.deptartmentPhysics == "true")
                departmentQueryObj.push({ "department.name_TH": "ฟิสิกส์" })
            // if (request.query.needHidden != "true")
            //     departmentQueryObj.push({ show: true })

            projectionObj.keyword_EN = 1
            projectionObj.keyword_TH = 1
            projectionObj.researcherPicture = 1
            projectionObj.researcherName_TH = 1
            projectionObj.researcherName_EN = 1
            projectionObj.department = 1

            let queryText = request.query.queryText

            let bypassCriteria = false
            if (request.query.matchResearcherName != "true" &&
                request.query.matchTarget != "true" &&
                request.query.matchCourse != "true" &&
                request.query.matchKeyword != "true" &&
                request.query.matchResearchOutput != "true" &&
                request.query.matchIntellectual != "true" &&
                request.query.matchThesis != "true")
                bypassCriteria = true

            if (request.query.matchResearcherName == "true" || bypassCriteria) {
                matchingQueryObj.push({ 'researcherName_TH': { $regex: new RegExp(request.query.queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } })
                matchingQueryObj.push({ 'researcherName_EN': { $regex: new RegExp(request.query.queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } })
                fieldObj.researcherNameMatchFirst = { $cond: { if: { $or: [{ $regexMatch: { input: "$researcherName_TH", regex: new RegExp("^" + queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' } }, { $regexMatch: { input: "$researcherName_EN", regex: new RegExp("^" + queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' } }] }, then: 1, else: 0 } }
                fieldObj.researcherNameMatch = { $cond: { if: { $or: [{ $regexMatch: { input: "$researcherName_TH", regex: new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' } }, { $regexMatch: { input: "$researcherName_EN", regex: new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' } }] }, then: 1, else: 0 } }
                sortObj.researcherNameMatchFirst = -1
            }
            else {
                fieldObj.researcherNameMatchFirst = 0
                fieldObj.researcherNameMatch = 0
            }

            if (request.query.matchTarget == "true" || bypassCriteria) {
                projectionObj.targetIndustry_EN = 1
                projectionObj.targetIndustry_TH = 1
                matchingQueryObj.push({ 'targetIndustry_TH': { $regex: new RegExp(request.query.queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } })
                matchingQueryObj.push({ 'targetIndustry_EN': { $regex: new RegExp(request.query.queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } })
                fieldObj.targetIndustryMatch = { $cond: { if: { $or: [{ $regexMatch: { input: "$targetIndustry_TH", regex: new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' } }, { $regexMatch: { input: "$targetIndustry_EN", regex: new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' } }] }, then: 1, else: 0 } }
                sortObj.targetIndustryMatch = -1
            }
            else {
                fieldObj.targetIndustryMatch = 0
            }

            if (request.query.matchCourse == "true" || bypassCriteria) {
                projectionObj.matchCourse = {
                    $filter: {
                        input: "$course",
                        as: "each_course",
                        cond: {
                            $regexMatch: { input: "$$each_course.name", regex: new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' }
                        }
                    }
                }
                matchingQueryObj.push({ 'course.name': { $regex: new RegExp(request.query.queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } })
                fieldObj.courseCount = { $cond: { if: { $isArray: "$matchCourse" }, then: { $size: "$matchCourse" }, else: 0 } }
                sortObj.courseCount = -1
            }
            else {
                fieldObj.courseCount = 0
            }

            if (request.query.matchKeyword == "true" || bypassCriteria) {
                projectionObj.keywords_TH = 1
                projectionObj.keywords_EN = 1
                matchingQueryObj.push({ 'keywords_TH': { $regex: new RegExp(request.query.queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } })
                matchingQueryObj.push({ 'keywords_EN': { $regex: new RegExp(request.query.queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } })

                fieldObj.keywordMatch_EN = {
                    $cond: {
                        if: { $isArray: "$keywords_EN" }, then: {
                            $filter: {
                                input: "$keywords_EN",
                                as: "each_keywords_EN",
                                cond: {
                                    $regexMatch: { input: "$$each_keywords_EN", regex: new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' }
                                }
                            }
                        }, else: []
                    }
                }
                fieldObj.keywordMatch_TH = {
                    $cond: {
                        if: { $isArray: "$keywords_TH" }, then: {
                            $filter: {
                                input: "$keywords_TH",
                                as: "each_keywords_TH",
                                cond: {
                                    $regexMatch: { input: "$$each_keywords_TH", regex: new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' }
                                }
                            }
                        }, else: []
                    }
                }
                fieldObj.keywordMatchCount_EN = {
                    $cond: {
                        if: { $isArray: "$keywords_EN" }, then: {
                            $size: {
                                $filter: {
                                    input: "$keywords_EN",
                                    as: "each_keywords_EN",
                                    cond: {
                                        $regexMatch: { input: "$$each_keywords_EN", regex: new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' }
                                    }
                                }
                            }
                        }, else: []
                    }
                }
                fieldObj.keywordMatchCount_TH = {
                    $cond: {
                        if: { $isArray: "$keywords_TH" }, then: {
                            $size: {
                                $filter: {
                                    input: "$keywords_TH",
                                    as: "each_keywords_TH",
                                    cond: {
                                        $regexMatch: { input: "$$each_keywords_TH", regex: new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' }
                                    }
                                }
                            }
                        }, else: []
                    }
                }
            }
            else {
                fieldObj.keywordMatch_EN = []
                fieldObj.keywordMatch_TH = []
                fieldObj.keywordMatchCount_EN = []
                fieldObj.keywordMatchCount_TH = []
            }

            if (request.query.matchResearchOutput == "true" || bypassCriteria) {
                projectionObj.matchPublication = {
                    $filter: {
                        input: "$publication",
                        as: "each_publication",
                        cond: { $regexMatch: { input: "$$each_publication.name", regex: new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' } }
                    }
                }
                matchingQueryObj.push({ 'publication.name': { $regex: new RegExp(request.query.queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } })
                fieldObj.publicationCount = { $cond: { if: { $isArray: "$matchPublication" }, then: { $size: "$matchPublication" }, else: 0 } }
                sortObj.publicationCount = -1
            }
            else {
                fieldObj.publicationCount = 0
            }

            if (request.query.matchIntellectual == "true" || bypassCriteria) {
                projectionObj.matchIntProp = {
                    $filter: {
                        input: "$intProp",
                        as: "each_intProp",
                        cond: {
                            $or: [
                                { $regexMatch: { input: "$$each_intProp.name_TH", regex: new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' } },
                                { $regexMatch: { input: "$$each_intProp.name_EN", regex: new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' } }
                            ]
                        }
                    }
                }
                matchingQueryObj.push({ 'intProp.name_TH': { $regex: new RegExp(request.query.queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } })
                matchingQueryObj.push({ 'intProp.name_EN': { $regex: new RegExp(request.query.queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } })
                fieldObj.intPropCount = { $cond: { if: { $isArray: "$matchIntProp" }, then: { $size: "$matchIntProp" }, else: 0 } }
                sortObj.intPropCount = -1
            }
            else {
                fieldObj.intPropCount = 0
            }

            if (request.query.matchThesis == "true" || bypassCriteria) {
                projectionObj.matchThesis = {
                    $filter: {
                        input: "$thesis",
                        as: "each_thesis",
                        cond: {
                            $or: [
                                { $regexMatch: { input: "$$each_thesis.thesisName_TH", regex: new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' } },
                                { $regexMatch: { input: "$$each_thesis.thesisName_EN", regex: new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), options: 'i' } }
                            ]
                        }
                    }
                }
                matchingQueryObj.push({ 'researcherName_TH': { $regex: new RegExp(request.query.queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } })
                matchingQueryObj.push({ 'researcherName_EN': { $regex: new RegExp(request.query.queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } })
                fieldObj.thesisCount = { $cond: { if: { $isArray: "$matchThesis" }, then: { $size: "$matchThesis" }, else: 0 } }
                sortObj.thesisCount = -1
            }
            else {
                fieldObj.thesisCount = 0
            }

            let queryObj = []
            if (departmentQueryObj.length == 0) {
                if (matchingQueryObj.length == 0)
                    queryObj = {}
                else
                    queryObj.push({ $or: matchingQueryObj })
            }
            else if (matchingQueryObj.length == 0) {
                if (departmentQueryObj.length == 0)
                    queryObj = {}
                else
                    queryObj.push({ $or: departmentQueryObj })
            }
            else {
                queryObj.push({ $or: departmentQueryObj })
                queryObj.push({ $or: matchingQueryObj })
            }

            // if (request.query.needHidden != "true") {
            queryObj.push({ show: true })
            // }
            if (request.query.needRetired != "true") {
                queryObj.push({ retiredDate: { $gte: new Date() } })
            }

            if (queryObj.length >= 2)
                queryObj = { $and: queryObj }
            else if (queryObj.length == 1)
                queryObj = queryObj[0]
            else
                queryObj = {}

            flow.exec(
                function () {
                    Researcher_Control.getResearcherByKeyword(queryObj, projectionObj, fieldObj, sortObj, parseInt(request.query.pageNum), parseInt(request.query.pageSize), this);
                },
                function (code, err, getResponse) {
                    if (err) {
                        Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                    } else {
                        Return.responseWithCodeAndData(ReturnCode.success, "getResearcherByKeyword Successfully executed", getResponse, response);
                    }
                }
            );
        }
    }
});

router.get('/admin/researcher', async function (request, response) {
    var methodCode = "KF";
    var researcherId = null;
    var requiredData = [];
    requiredData.push(request.headers.token);
    var requiredReady = Validate.requiredData_Check(requiredData)

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
                    console.log(`>>> RESEARCHERID --> ${researcherId}`)
                    Researcher_Control.getResearcherListByAdmin(researcherId, this);
                },
                function (code, err, getResponse) {
                    if (err) {
                        Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                    } else {
                        Return.responseWithCodeAndData(ReturnCode.success, "getResearcherListByAdmin Successfully executed", getResponse, response);
                    }
                }
            );
        }
    }
});

router.get('/admin/researcher/:researcherId', async function (request, response) {
    var methodCode = "XF";

    var requiredData = [];
    requiredData.push(request.params.researcherId);
    requiredData.push(request.headers.token);
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
                    Researcher_Control.getkResearcherForIdByAdmin(new ObjectId(request.params.researcherId), this);
                },
                function (code, err, getResponse) {
                    if (err) {
                        Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                    } else {
                        Return.responseWithCodeAndData(ReturnCode.success, "getkResearcherForIdByAdmin Successfully executed", getResponse, response);
                    }
                }
            );
        }
    }
});

router.get('/gen_cv/:researcherId', function (request, response) {
    var methodCode = "XF";

    var requiredData = [];
    requiredData.push(request.params.researcherId);
    var requiredReady = Validate.requiredData_Check(requiredData)

    console.log("Validation 3")
    var objectIdData = [];
    objectIdData.push(request.params.researcherId);
    var objectIdReady = Validate.objectIDData_Check(objectIdData)

    console.log("Validation Success")
    console.log(request.params.researcherId)

    if (!requiredReady) {
        var alert = "Input Not Valid, check if some data is required."
        console.log(alert);
        Return.responseWithCode(ReturnCode.clientError + methodCode + "001", alert, response)
    }
    else if (!objectIdReady) {
        var alert = "Input Not Valid, check if some data is not ObjectID for MongoDB."
        console.log(alert);
        Return.responseWithCode(ReturnCode.clientError + methodCode + "003", alert, response)
    }
    else {
        flow.exec(
            function () {
                Researcher_Control.getDataGenPDF(new ObjectId(request.params.researcherId), this);
            },
            function (code, err, getResponse) {
                if (err) {
                    Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                } else {
                    flow.exec(
                        function () {
                            Researcher_Control.GenPDF(getResponse, getResponse.id, this);
                        },
                        function (code, err, res) {
                            if (err) {
                                Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
                            } else {
                                Return.responseWithCodeAndData(ReturnCode.success, "GenPDF Successfully executed", res, response);
                            }
                        }
                    );
                }
            }
        );
    }
});

///-------------------

// router.get('/researcher/dataUpdate/', function (request, response) {
//     var methodCode = "XF";

//     var requiredData = [];
//     requiredData.push(request.query.researcherId);
//     var requiredReady = Validate.requiredData_Check(requiredData)

//     console.log("Validation 3")
//     var objectIdData = [];
//     objectIdData.push(request.query.researcherId);
//     var objectIdReady = Validate.objectIDData_Check(objectIdData)

//     console.log("Validation Success")

//     if (!requiredReady) {
//         var alert = "Input Not Valid, check if some data is required."
//         console.log(alert);
//         Return.responseWithCode(ReturnCode.clientError + methodCode + "001", alert, response)
//     } else if (!objectIdReady) {
//         var alert = "Input Not Valid, check if some data is not ObjectID for MongoDB."
//         console.log(alert);
//         Return.responseWithCode(ReturnCode.clientError + methodCode + "003", alert, response)
//     } else {
//         flow.exec(
//             function () {
//                 DataUpdate_Control.getAllDataUpdate(new ObjectId(request.query.researcherId), this);
//             },
//             function (code, err, callbackData) {
//                 if (err) {
//                     Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
//                 } else {
//                     Return.responseWithCodeAndData(ReturnCode.success, "dataUpdate is successfully get", callbackData, response);
//                 }
//             }
//         );
//     }
// });

// router.post('/researcher/dataUpdate/', function (request, response) {
//     var methodCode = "XF";

//     var requiredData = [];
//     requiredData.push(request.body.researcherId);
//     requiredData.push(request.body.dataType);
//     requiredData.push(request.body.updateType);
//     requiredData.push(request.body.updateDetails);
//     var requiredReady = Validate.requiredData_Check(requiredData)

//     console.log("Validation 3")
//     var objectIdData = [];
//     requiredData.push(request.body.researcherId);
//     var objectIdReady = Validate.objectIDData_Check(objectIdData)

//     console.log("Validation Success")

//     if (!requiredReady) {
//         var alert = "Input Not Valid, check if some data is required."
//         console.log(alert);
//         Return.responseWithCode(ReturnCode.clientError + methodCode + "001", alert, response)
//     } else if (!objectIdReady) {
//         var alert = "Input Not Valid, check if some data is not ObjectID for MongoDB."
//         console.log(alert);
//         Return.responseWithCode(ReturnCode.clientError + methodCode + "003", alert, response)
//     } else {
//         flow.exec(
//             function () {

//                 let dataUpdate = {}
//                 dataUpdate.dataType = request.body.dataType

//                 if (request.body.dataId)
//                     dataUpdate.dataId = request.body.dataId
//                 else
//                     dataUpdate.dataId = null

//                 dataUpdate.updateType = request.body.updateType
//                 dataUpdate.updateStatus = 'pending'
//                 dataUpdate.beforeDetails = null
//                 dataUpdate.updateDetails = new Object(request.body.updateDetails)
//                 dataUpdate.requestDateTime = new Date()
//                 dataUpdate.updateStatusChangeDateTime = null
//                 DataUpdate_Control.newDataUpdateByResearcherId(new ObjectId(request.body.researcherId), dataUpdate, this);
//             },
//             function (code, err, callbackData) {
//                 if (err) {
//                     Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
//                 } else {
//                     Return.responseWithCodeAndData(ReturnCode.success, "new dataUpdate is successfully saved", callbackData, response);
//                 }
//             }
//         );
//     }
// });

// router.put('/researcher/dataUpdate/', function (request, response) {
//     var methodCode = "XF";

//     var requiredData = [];
//     requiredData.push(request.body.dataUpdateId);
//     requiredData.push(request.body.updateStatus);
//     var requiredReady = Validate.requiredData_Check(requiredData)

//     console.log("Validation 3")
//     var objectIdData = [];
//     objectIdData.push(request.body.dataUpdateId);
//     var objectIdReady = Validate.objectIDData_Check(objectIdData)

//     console.log("Validation Success")

//     if (!requiredReady) {
//         var alert = "Input Not Valid, check if some data is required."
//         console.log(alert);
//         Return.responseWithCode(ReturnCode.clientError + methodCode + "001", alert, response)
//     } else if (!objectIdReady) {
//         var alert = "Input Not Valid, check if some data is not ObjectID for MongoDB."
//         console.log(alert);
//         Return.responseWithCode(ReturnCode.clientError + methodCode + "003", alert, response)
//     } else {
//         flow.exec(
//             function () {
//                 DataUpdate_Control.dataUpdateExecution(new ObjectId(request.body.dataUpdateId), request.body.updateStatus, this);
//             },
//             function (code, err, callbackData) {
//                 if (err) {
//                     Return.responseWithCode(ReturnCode.serviceError + methodCode + code, err, response);
//                 } else {
//                     Return.responseWithCodeAndData(ReturnCode.success, "new dataUpdate is successfully executed", callbackData, response);
//                 }
//             }
//         );
//     }
// });

module.exports = router;