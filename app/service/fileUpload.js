var express = require('express');
var router = express.Router();
var randomstring = require("randomstring");
var formidable = require('formidable')
var path = require('path')
var fs = require('fs');

// DATABASE SETUP
var ObjectId = require('mongodb').ObjectId;

var ReturnCode = require('../model/returnCode.js');
let config = require('../../config/config.js');
var Researcher = require('../model/researcher_model.js');
var User = require('../model/user.js');

var flow = require('./flow.js')
var Validate = require("./validation.js");
var auth = require("../controller/auth.js");
var Return = require("./return.js");
var Researcher_Control = require('../controller/researcher_control.js');
var User_Control = require('../controller/user_control.js');

let researcherPicFolder = "./public/file/image/researcherPic"
console.log("File Location Detecting")
let folderName = researcherPicFolder.split("/")
let folderNameTmp = "."
for (let i = 1; i < folderName.length; i++) {
    folderNameTmp = folderNameTmp + "/" + folderName[i]
    console.log("checking DIR == " + folderNameTmp)
    if (!fs.existsSync(folderNameTmp)) {
        console.log("NO DIR")
        fs.mkdirSync(folderNameTmp);
    }
    else {
        console.log("DIR already available")
    }
}

router.post('/researcher/upload/pic', function (request, response) { //ตัวอย่าง API ที่มีรูปมาด้วย
    console.log("/researcher/upload/pic")
    var methodCode = "KJT";

    // console.log("File Location Detecting")
    // let folderName = researcherPicFolder.split("/")
    // let folderNameTmp = "."
    // for (let i = 1; i < folderName.length; i++) {
    //     folderNameTmp = folderNameTmp + "/" + folderName[i]
    //     console.log("checking DIR == " + folderNameTmp)
    //     if (!fs.existsSync(folderNameTmp)) {
    //         console.log("NO DIR")
    //         fs.mkdirSync(folderNameTmp);
    //     }
    //     else {
    //         console.log("DIR already available")
    //     }
    // }

    console.log("Parsing Request...")
    let responseJSON = {}
    // let doneOnce = false

    let incomingForm = new formidable.IncomingForm();
    incomingForm.parse(request, function (err, fields, files) { // ใช้ตัวแปลงนี้ ถ้าเกิดส่งมาแบบผสม (ข้อมูล + ไฟล์ต่างๆ)
        // if (!doneOnce) {
        // doneOnce = true
        console.log("Parsing Request COMPLETED...")
        if (err) {
            responseJSON.err = "ERROR in incomingForm.parse >>" + err
            console.log('ERROR: ' + err)
            res.status(200).json(responseJSON);
        } else {

            if (files) {

                if (files.researcherPicture) {
                    let oldpath1 = files.researcherPicture.path;
                    let fileExt1 = files.researcherPicture.name.split('.')[1];
                    let newfilename1 = randomstring.generate(12) + Date.now()
                    let newpath1 = researcherPicFolder + "/" + newfilename1 + "." + fileExt1
                    let rawData = fs.readFileSync(oldpath1) 

                    // console.log(files.researcherPicture)
                    fs.writeFile(newpath1, rawData, function (err) {
                        let obj = {
                            newFilePath: newpath1.replace(/\.\/public/i,`https://research.science.kmitl.ac.th/uploads`)
                        }
                        console.log(oldpath1)
                        console.log(newpath1)
                        Return.responseWithCodeAndData(ReturnCode.success, "New file is saved successfully", obj, response);
                    });

                    // fs.rename(oldpath1, newpath1, function (err) {
                    //     let obj = {
                    //         newFilePath: newpath1.replace(/\.\/public/i,`https://research.science.kmitl.ac.th/uploads`)
                    //     }
                    //     console.log(oldpath1)
                    //     console.log(newpath1)
                    //     Return.responseWithCodeAndData(ReturnCode.success, "New file is saved successfully", obj, response);
                    // });
                }
                else {
                    Return.responseWithCodeAndData(ReturnCode.success, "No file is sent", null, response);
                }

            }
        }
        // }
    });
});

module.exports = router;