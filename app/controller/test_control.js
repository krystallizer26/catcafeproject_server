var Researcher = require('../model/researcher_model.js');
var nodemailer = require('nodemailer');
//var pic = require('../files/a.jpg');

// var Position_Control = require("./position_control.js");
// var Division_Control = require("./division_control.js");
// var Department_Control = require("./department_control.js");

var ObjectId = require('mongodb').ObjectId;
var config = require('../../config/config.js');
var flow = require('../service/flow.js')

module.exports = {
    upsertThesisFromSheet: function (researcherCitizenId, thesis, callback) {
        var query = { $and: [{ citizenId: researcherCitizenId }] },
            pullFromArray = { $pull: { 'thesis': { researchName_TH: thesis.researchName_TH } } },
            pushToArray = { $push: { 'thesis': thesis } };
        // console.log(update)

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
                    // console.log(JSON.stringify(pushToArray))
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
        let query = { _id: researcherId }

        let projection = { researcherPicture: true, researcherName_TH: true, researcherName_EN: true, thesis: true }

        Researcher.find(query, projection, function (error, researcherResponse) {
            if (error) {
                var alert = "[func. getThesisByResearcherId] Error: " + error.message;
                callback("171", alert, null)
            } else {
                callback("172", null, researcherResponse)
            }
        });
    },
    newUser: function (user, passwordString,callback) {
        {

          let path = 'https://research.science.kmitl.ac.th/uploads/file/image/logo.png'
          console.log(path);
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'webmaster-sci@kmitl.ac.th',
                        pass: 'uSbrtFjT9a'
                    }
                });

                var mailOptions = {
                    from: 'ศูนย์ทำเนียบนักวิจัย สจล.',
                    to: 'sukirt58@gmail.com',
                    subject: 'Your permission has been approved',
                    html: `<!DOCTYPE html>
                    <html lang="th">
                      <head>
                        <meta charset="utf-8" />
                        <style>
                          * {
                            box-sizing: border-box;
                          }
                          body {
                            margin: 0;
                            font-family: sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
                              "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
                              "Helvetica Neue", sans-serif;
                            -webkit-font-smoothing: antialiased;
                            -moz-osx-font-smoothing: grayscale;
                    
                            width: 100%;
                            height: auto;
                            overflow-x: hidden;
                          }
                          div.container {
                            width: 100%;
                            max-width: 1024px;
                            margin: 0 auto;
                          }
                          img.header {
                            width: 100%;
                            padding: 1em 2em 2em;
                            background-color: #2f3b7a;
                          }
                          div.content {
                            padding: 3em 2em;
                          }
                    
                          footer {
                            padding: 2em;
                            color: white;
                            background-color: #2f3b7a;
                          }
                          footer > p {
                            text-align: center;
                          }
                          footer > a {
                            color: rgb(255, 210, 0);
                          }
                        </style>
                      </head>
                      <body>
                        <div class="container">
                          <img
                            class="header"
                            src="${path}"
                          />
                          <div class="content">
                          <h4 style="font-size: 24px;">Dear AAAAAA</h4>
                          <p style="font-size: 20px;">Welcome to Research Directory. Your account has already been created for accessing to the system. Please use these credential to login.</p>
                          <h5 style="font-size: 18px;">E-mail: <span style="font-size: 20px;"> Dsdsdsd </span> </h5>
                          <h5 style="font-size: 18px;">Password: <span style="font-size: 20px;"> 22222 </span> </h5>
                          <br />
                          <p style="font-size: 20px;">Best Regards.</p>
                          <p style="font-size: 20px;">Research Directory.</p>
                          </div>
                          <footer>
                            Faculty of Science, King Mongkut's Institute of Technology Ladkrabang
                            <br />Chalongkrung Rd. Ladkrabang District Bangkok 10520 <br />Tel.
                            02-329-8400 to 8411 <br />Fax 02-329-8412 <br />Faculty of Science,
                            KMITL <br /><a href="http://www.science.kmitl.ac.th/" target="_blank" >www.science.kmitl.ac.th</a>
                            <br /><a href="https://www.facebook.com/SciKmitl" target="_blank" >Sci KMITL</a>
                            <p>Copyright © Science@KMITL 2019</p>
                          </footer>
                        </div>
                      </body>
                    </html>`,
                    // attachments: [{
                    //     filename: message + ".csv",
                    //     content: csvOutput
                    // }]
                };

                // console.log("sending mail")
                transporter.sendMail(mailOptions, function (error, info) {
                    console.log(error)
                    console.log(info)
                });

                callback("172", null, saveResponse)
            }
    }
};

//----------------