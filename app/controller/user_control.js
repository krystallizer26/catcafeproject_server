var User = require('../model/user.js');
var Researcher = require('../model/researcher_model.js');
var GSuiteMailer = require('../service/mailer.js');
var nodemailer = require('nodemailer');
const mailgun = require("mailgun-js");

// var Position_Control = require("./position_control.js");
// var Division_Control = require("./division_control.js");
// var Department_Control = require("./department_control.js");

var ObjectId = require('mongodb').ObjectId;
var flow = require('../service/flow.js');
var config = require('../../config/config.js');

const mg = mailgun({ apiKey: config.mailgun_apiKey, domain: config.mailgun_domain });

module.exports = {
  newUser: function (user, passwordString, callback) {
    user.save(function (error, saveResponse) {
      if (error) {
        var alert = "[func. newResearcher] Error in saving Researcher Error: " + error.message;
        Researcher.deleteOne({ "_id": new ObjectId(user.researcherId) }, function () {
          console.log(`id: ${user.researcherId} deleted due to not able to create user + ${error}`)
        })
        callback("171", alert, null)
      }
      else {

        let path = 'https://research.science.kmitl.ac.th/uploads/file/image/logo.png'
        let to = user.email
        let from = 'webmaster-sci@kmitl.ac.th'
        let subject = 'Your permission has been approved'
        let content =
          `<!DOCTYPE html>
        <html lang="th">
          <head>
            <meta charset="utf-8" />
            <style>
              * {
                box-sizing: border-box;
              }
              body {
                margin: 0;
                font-family: sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI",
                  "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
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
            </style>
          </head>
          <body>
            <div class="container">
              <img class="header" src="${path}" />
              <div class="content">
                <h4 style="font-size: 24px">
                  Dear ${user.firstname} ${user.lastname},
                </h4>
                <p style="font-size: 18px">
                  Welcome to Research Directory. Your account has already been created
                  for accessing to the system. Please use these credential to login.
                </p>
                <h5 style="font-size: 18px">
                  E-mail: <span style="font-size: 18px">${user.email}</span>
                </h5>
                <h5 style="font-size: 18px">
                  Password: <span style="font-size: 18px">${passwordString}</span>
                </h5>
                <br />
                Download instruction manual
                <a
                  href="https://drive.google.com/drive/folders/198Jw5vALModEnWuHD1jqutN3hPagHR4b?usp=sharing"
                >
                  Click here
                </a>
                <br />
                Watch the video manual
                <a
                  href="https://drive.google.com/drive/folders/1_bavRxDYQqo7Yc9uHq-9wNNELOknhcW0?usp=sharing"
                >
                  Click here
                </a>
                <br />
                <p style="font-size: 18px">Best Regards.</p>
                <p style="font-size: 18px">Research Directory, Science@KMITL</p>
              </div>
              <footer style="padding: 2em; color: white; background-color: #2f3b7a">
                Faculty of Science, King Mongkut's Institute of Technology Ladkrabang
                <br />Chalongkrung Rd. Ladkrabang District Bangkok 10520 <br />Tel.
                02-329-8400 to 8411 <br />Fax 02-329-8412 <br />Faculty of Science,
                KMITL <br /><a
                  style="color: rgb(255, 210, 0); box-sizing: border-box"
                  href="http://www.science.kmitl.ac.th/"
                  target="_blank"
                  >www.science.kmitl.ac.th</a
                >
                <br /><a
                  style="color: rgb(255, 210, 0); box-sizing: border-box"
                  href="https://www.facebook.com/SciKmitl"
                  target="_blank"
                  >Facebook : Sci KMITL</a
                >
                <p style="text-align: center; box-sizing: border-box">
                  Copyright © Science@KMITL 2019
                </p>
              </footer>
            </div>
          </body>
        </html>
        `

        GSuiteMailer.sendingMailViaGSuite(to, from, subject, content, function () {
          callback("172", null, saveResponse)
        })
      }
    });
  }
};


//----------------