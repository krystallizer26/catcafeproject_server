const uuidv4 = require('uuid/v4');
var User = require('../model/user')
const bcrypt = require('bcrypt')
const HttpError = require('../model/http-error')
const jwt = require("jwt-simple");
var config = require('../../config/config');
var ObjectId = require('mongodb').ObjectId;
const nodemailer = require('nodemailer');
var GSuiteMailer = require('../service/mailer.js');
var Researcher = require('../model/researcher_model.js');

var randomstring = require("randomstring");
let User_Control = require('../controller/user_control.js')
const { callbackPromise } = require('nodemailer/lib/shared');

module.exports = {
  createUser: async function (req, res, next) {
    let user = new User()

    let roles = ['staff']
    if (Array.isArray(req.body.roles))
      roles = req.body.roles

    bcrypt.genSalt(10).then((salt) => {
      let passwordString = randomstring.generate(12)
      bcrypt.hash(passwordString, salt).then((password) => {
        user.email = req.body.email
        user.password = password
        user.firstname = req.body.firstname
        user.lastname = req.body.lastname
        // let departmentObj = {}
        // if (fields.departmentName_TH) departmentObj.name_TH = fields.departmentName_TH
        // if (fields.departmentName_EN) departmentObj.name_EN = fields.departmentName_EN
        // user.department = departmentObj
        user.roles = roles
        user.researcherId = new ObjectId('999999999999999999999999')
        user.tokenResetPassword = ""
        User_Control.newUser(user, passwordString, function (code, err, data) {
          res.json({ message: 'Created successfully' })
        })
      })
    })

  },
  signIn: async function (req, res, next) {

    let user = await User.findOne({ $and: [{ email: req.body.email }, { isBlocked: false },] })
    if (!user) {
      return next(new HttpError(404, "user not found"))
    }

    const invalidPassword = await bcrypt.compare(req.body.password, user.password)
    if (!invalidPassword) {
      return next(new HttpError(422, "password is invalid"))
    }

    const payload = {
      expired: new Date().setDate(new Date().getDate() + 7),
      userId: user.id
    };

    const token = jwt.encode(payload, config.secretKey);
    res.json({ token })
  },
  getUserInfo: async function (req, res, next) {
    if (!req.headers.token) {
      next(new HttpError(422, "No token provided"))
    } else {
      let user = await decodeToken(req.headers.token, next)
      console.log("DECODED TOKEN", user)
      let researcher = null

      let userInfo = {}

      if (user.roles && user.roles.indexOf("researcher") != -1) {
        researcher = await Researcher.findOne({ _id: new ObjectId(user.researcherId) })
        if (researcher == null)
          next(new HttpError(422, "researcher's id not found"))
        else
          userInfo = {
            researcherId: user.researcherId,
            email: researcher.email,
            name: researcher.researcherName_TH,
            roles: user.roles,
            avatar: researcher.researcherPicture,
            department: researcher.department
          }
      }
      else if (user.roles && user.roles.indexOf("staff") != -1) {
        user = await User.findOne({ _id: new ObjectId(user._id) })
        userInfo = {
          email: user.email,
          name: user.firstname + " " + user.lastname,
          roles: user.roles,
          avatar: user.userPicture,
          department: user.department
        }
      }
      console.log('USER INFO', userInfo)
      req.userInfo = userInfo
      res.json(userInfo)
    }
  },
  checkUserInfo: async function (req, res, next) {
    if (!req.headers.token) {
      next(new HttpError(422, "No token provided"))
    } else {
      let user = await decodeToken(req.headers.token, next)

      let researcher = null

      let userInfo = {}

      if (user.roles && user.roles.indexOf("researcher") != -1) {
        researcher = await Researcher.findOne({ _id: new ObjectId(user.researcherId) })
        if (researcher == null)
          next(new HttpError(422, "researcher's id not found"))
        else
          userInfo = {
            userId: user._id,
            researcherId: user.researcherId,
            email: researcher.email,
            name: researcher.researcherName_TH,
            roles: user.roles,
            avatar: researcher.researcherPicture,
            department: researcher.department
          }
      }
      else if (user.roles && user.roles.indexOf("staff") != -1) {
        user = await User.findOne({ _id: new ObjectId(user._id) })
        userInfo = {
          userId: user._id,
          email: user.email,
          name: user.firstname + " " + user.lastname,
          roles: user.roles,
          avatar: user.userPicture,
          department: user.department
        }
      }
      console.log('USER INFO', userInfo)
      req.userInfo = userInfo
      // res.json(userInfo)
      next()
    }
  },
  checkUserInfo_exception: async function (req, res, next) {
    console.log(`TOKEN: `, req.headers.token)
    if (req.headers.token == null || req.headers.token == undefined || req.headers.token == 'null') {
      console.log(`NO TOKEN`)
      userInfo = {
        researcherId: null,
        email: null,
        name: null,
        roles: [],
        avatar: null,
        department: null
      }
      req.userInfo = userInfo
      next()
    } else {
      console.log(`WITH TOKEN`)
      let user = await decodeToken(req.headers.token, next)

      let researcher = null
      let userInfo = {}

      if (user.roles && user.roles.indexOf("researcher") != -1) {
        researcher = await Researcher.findOne({ _id: new ObjectId(user.researcherId) })
        userInfo = {
          researcherId: user.researcherId,
          email: researcher.email,
          name: researcher.researcherName_TH,
          roles: user.roles,
          avatar: researcher.researcherPicture,
          department: researcher.department
        }
      }
      else if (user.roles && user.roles.indexOf("staff") != -1) {
        user = await User.findOne({ _id: new ObjectId(user._id) })
        userInfo = {
          email: user.email,
          name: user.name,
          roles: user.roles,
          avatar: user.userPicture,
          department: user.department
        }
      }
      console.log('USER INFO', userInfo)
      req.userInfo = userInfo
      // res.json(userInfo)
      next()
    }
  },
  forgotPassword: async function (req, res, next) {
    user = await User.findOne({ email: req.body.email })

    if (user === null) {
      return next(new HttpError(422, "email is invalid"))
    }

    user.tokenResetPassword = await uuidv4()
    user.tokenResetPassword_Expired = (new Date()).setDate(new Date().getDate() + 3);
    await user.save()

    let path = 'https://research.science.kmitl.ac.th/uploads/file/image/logo.png'
    GSuiteMailer.sendingMailViaGSuite(req.body.email, 'Researcher Directory System <webmaster-sci@kmitl.ac.th>', 'Your password reset request is sent.',
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
              <h4 style="font-size: 24px;">Dear ${user.firstname} ${user.lastname},</h4>
              <p style="font-size: 18px;">Please click on the link below to access the password reset: ${user.tokenResetPassword}</p>
              <h5 style="font-size: 18px;">https://research.science.kmitl.ac.th/confirm_password/${user.tokenResetPassword}</h5>
              <p style="font-size: 18px;">After that you can change password via website any time. If you have any problem to login to the system, please contact administrator.</p>
              <br />
              <p style="font-size: 18px;">Best Regards.</p>
              <p style="font-size: 18px;">Research Directory.</p>
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
        </html>`, function () {
      res.json({ send: "success" })
    })
  },
  resetPassword: async function (req, res, next) {
    user = User.findOne({ tokenResetPassword: req.body.tokenResetPassword })

    if (user === null) {
      return next(new HttpError(422, "tokenResetPassword is invalid"))
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
      return next(new HttpError(422, "new password is invalid"))
    }

    let salt = await bcrypt.genSalt(10);
    let encryptedPassword = await bcrypt.hash(req.body.newPassword, salt)

    user.password = encryptedPassword
    await user.save()

    res.json({ reset: "success" })
  },
  changePassword: async function (req, res, next) {
    console.log(`changePassword TOKEN: `, req.headers.token)
    if (req.headers.token == null || req.headers.token == undefined || req.headers.token == 'null') {
      console.log(`NO TOKEN`)
      return next(new HttpError(422, "No Token"))
    } else {
      console.log(`WITH TOKEN`)
      let user = await decodeToken(req.headers.token, next)
      console.log(JSON.stringify(user))

      console.log(`CHANGEPASSWORD`)
      console.log(req.body)
      console.log(`CHANGEPASSWORD`)
      console.log(`COMPARE: `, req.body.password, user.password)
      const invalidPassword = await bcrypt.compare(req.body.password, user.password)

      if (!invalidPassword) {
        return next(new HttpError(422, "Your current password is not correct."))
      }

      if (req.body.newPassword !== req.body.confirmPassword) {
        return next(new HttpError(422, "New password are not the same"))
      }

      let salt = await bcrypt.genSalt(10);
      let encryptedPassword = await bcrypt.hash(req.body.newPassword, salt)

      user.password = encryptedPassword
      await user.save()

      res.json({ reset: "success" })
    }

    // console.log(`CHANGEPASSWORD`)
    // console.log(req.body)
    // console.log(`CHANGEPASSWORD`)
    // console.log(`COMPARE: `, req.body.password, user.password)
    // user = await decodeToken(req.headers.token, next)
    // const invalidPassword = await bcrypt.compare(req.body.password, user.password)

    // if (!invalidPassword) {
    //   return next(new HttpError(422, "Your current password is not correct."))
    // }

    // if (req.body.newPassword !== req.body.confirmPassword) {
    //   return next(new HttpError(422, "New password are not the same"))
    // }

    // let salt = await bcrypt.genSalt(10);
    // let encryptedPassword = await bcrypt.hash(req.body.newPassword, salt)

    // user.password = encryptedPassword
    // await user.save()

    // res.json({ reset: "success" })
  },
  changePassword_member: async function (req, res, next) {
    // console.log(`CHANGEPASSWORD`)
    // console.log(req.body)
    // console.log(`CHANGEPASSWORD`)
    Researcher.findOne({ _id: new ObjectId(req.body.memberId) }, { email: 1 }, function (err, researcherResult) {
      if (!researcherResult) {
        return next(new HttpError(422, "No Researcher with id requested"))
      }
      else {
        User.findOne({ email: researcherResult.email }, {}, async function (err, userResult) {
          console.log(`COMPARE: `, req.body.password, userResult.password)
          userResult = await decodeToken(req.headers.token, next)
          const invalidPassword = await bcrypt.compare(req.body.password, user.password)

          if (!invalidPassword) {
            return next(new HttpError(422, "Your current password is not correct."))
          }

          if (req.body.newPassword !== req.body.confirmPassword) {
            return next(new HttpError(422, "New password are not the same"))
          }

          let salt = await bcrypt.genSalt(10);
          let encryptedPassword = await bcrypt.hash(req.body.newPassword, salt)

          userResult.password = encryptedPassword
          await userResult.save()

          res.json({ reset: "success" })
        })
      }
    })
  },
  confirm_changePassword: async function (req, res, next) {
    console.log('resetToken', req.body.token)

    user = await User.findOne({ $and: [{ tokenResetPassword: req.body.token, tokenResetPassword_Expired: { $ne: null }, tokenResetPassword_Expired: { $gte: new Date() } }] })

    if (user === null) {
      return next(new HttpError(422, "token is invalid or is expired"))
    }
    else if (req.body.password === null) {
      return next(new HttpError(422, "no new password sent"))
    }
    else {
      let newPassword = req.body.password

      let salt = await bcrypt.genSalt(10);
      let encryptedPassword = await bcrypt.hash(newPassword, salt)

      user.password = encryptedPassword
      user.tokenResetPassword = null
      await user.save()

      let path = 'https://research.science.kmitl.ac.th/uploads/file/image/logo.png'
      GSuiteMailer.sendingMailViaGSuite(user.email, 'Researcher Directory System <webmaster-sci@kmitl.ac.th>', 'Your password has been changed',
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
          <h4 style="font-size: 24px;">Dear ${user.firstname} ${user.lastname},</h4>
          <p style="font-size: 18px;">Your password has already been reset for accessing to the system. Please use this one to login.</p>
          <h5 style="font-size: 18px;">E-mail: <span style="font-size: 18px;">${user.email}</span> </h5>
          <h5 style="font-size: 18px;">Password: <span style="font-size: 18px;">${newPassword}</span> </h5>
          <p style="font-size: 18px;">After that you can change password via website any time. If you have any problem to login to the system, please contact administrator.</p>
          <br />
          <p style="font-size: 18px;">Best Regards.</p>
          <p style="font-size: 18px;">Research Directory.</p>
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
    </html>`, function () {
        res.json({ reset: "success" })
      })
    }

    // user = await decodeToken(req.headers.token, next)
    // const invalidPassword = await bcrypt.compare(req.body.password, user.password)

    // if (!invalidPassword) {
    //   return next(new HttpError(422, "password is invalid"))
    // }

    // if (req.body.newPassword !== req.body.confirmPassword) {
    //   return next(new HttpError(422, "new password is invalid"))
    // }

    // let salt = await bcrypt.genSalt(10);
    // let encryptedPassword = await bcrypt.hash(req.body.newPassword, salt)

    // user.password = encryptedPassword
    // await user.save()
  },
  decodeTokenAdmin: async function (token) {
    const payload = jwt.decode(token, config.secretKey)
    isExpired = payload.expired > new Date().getTime()
    if (!isExpired) {
      return "token is expired"
    }

    let user = await User.findById(payload.userId)
    if (!user) {
      return "user not found"
    }
    return user
  },
  getAllStaff: function (callback) {
    User.find({ "roles": { $in: ["appliances", "staff"] } }, { 'password': false }, function (err, cb) {
      callback(null, err, cb)
    })
  },
  getStaffById: function (staffId, callback) {
    User.find({ '_id': staffId }, { 'password': false }, function (err, cb) {
      callback(null, err, cb)
    })
  },
  editStaff: function (staffId, firstname, lastname, rolesFromRequest, callback) {

    let roles = ['staff']
    if (Array.isArray(rolesFromRequest))
      roles = rolesFromRequest

    User.updateOne({ "_id": new ObjectId(staffId) }, { "$set": { "firstname": firstname, "lastname": lastname, "roles": roles } }, function (err, cb) {
      callback(null, err, cb)
    })
  },

  reinitializeUserForResearcher: function (callback) {

    Researcher.find({}, { email: 1, researcherName_TH: 1 }, function (err, cb) {
      let responseObj = {
        researcherWithNoEmail: [],
        alreadyGeneratedUser: [],
        newlyGeneratedUser: [],
        notInCriteriaUser: []
      }
      let counter = 0
      let maxRound = cb.length

      if (err)
        callback("001", err, null)
      else {
        cb.forEach((researcher, index) => {
          if (!researcher.email) {
            responseObj.researcherWithNoEmail.push(researcher)
            counter++
            if (maxRound == counter)
              callback("002", null, responseObj)
          }
          else {
            User.findOne({ email: researcher.email }, { email: 1 }, function (err, cb2) {
              if (cb2) {
                responseObj.alreadyGeneratedUser.push(researcher)
                counter++
                if (maxRound == counter)
                  callback("002", null, responseObj)
              }
              else {
                let user = new User()

                bcrypt.genSalt(10).then((salt) => {
                  let passwordString = randomstring.generate(8)
                  let userName = researcher.researcherName_TH.replace(/\s+/, '\x01').split('\x01')

                  bcrypt.hash(passwordString, salt).then((password) => {
                    user.email = researcher.email
                    user.password = password
                    user.firstname = userName[0]
                    user.lastname = userName[1] ? userName[1] : " "
                    let departmentObj = {
                      departmentName_TH: null,
                      departmentName_EN: null
                    }
                    user.department = departmentObj
                    user.roles = "researcher"
                    user.researcherId = researcher._id
                    user.tokenResetPassword = null
                    user.isBlocked = false

                    if (true) {
                      User_Control.newUser(user, passwordString, function () {
                        responseObj.newlyGeneratedUser.push(researcher)
                        counter++
                        if (maxRound == counter)
                          callback("002", null, responseObj)
                      })
                    } else {
                      responseObj.notInCriteriaUser.push(researcher)
                      counter++
                      if (maxRound == counter)
                        callback("002", null, responseObj)
                    }

                  })
                })
              }
            })
          }
        })
      }
    })
  }
};

async function decodeToken(token, next) {
  const payload = jwt.decode(token, config.secretKey)
  isExpired = payload.expired > new Date().getTime()
  if (!isExpired) {
    return next(new HttpError(403, "token is expired"))
  }

  let user = await User.findById(payload.userId)
  if (!user) {
    return next(new HttpError(404, "user not found"))
  }
  return user
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'webmaster-sci@kmitl.ac.th',
    pass: 'uSbrtFjT9a'
  }
});
