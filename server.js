console.log("<npm start> should be called to start the server.")

var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var logger = require('morgan');
var fs = require('fs');

var app = express();
var config = require('./config/config.js');

// MongoDB Session Store Setup ===================================
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var jwt = require('jwt-simple');

var sessionStore = new MongoDBStore({
  uri: config.dbUrl,
  collection: 'sessionStore'
});
// Catch errors
// sessionStore.on('error', function (error) {
//     assert.ifError(error);
//     assert.ok(false);
// });
// ===============================================================

var app = express();
app.use(express.static('public'))

const mongooseOption = {
  socketTimeoutMS: 30000,
  keepAlive: true,
  reconnectTries: 30000,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
};

var scheduler = require('node-schedule');

mongoose.connect(config.dbUrl, mongooseOption, function (err) {
  if (err) {
    console.log("********************************!!! WARNING plzzz !!!*********************************");
    console.log("                          Can't connect to Database. naka e dok");
    console.log("             Please Start database first than restarting this server.");
    console.log("**************************************************************************************");

    console.log(err)
  } else {
    console.log("======================== DB is CONNECTED =========================")
    app.use('/api/services', require('./app/service/googleSheetScraper.js'));
    let periodicTask = require('./app/service/periodicTask.js')
    let mailer = require('./app/service/mailer.js')
    mailer.triggerOAuth()
    let rule = new scheduler.RecurrenceRule();
    // rule.dayOfWeek = 3
    rule.hour = 0;
    rule.minute = 16;

    console.log("SETting UP Elsvier scrapper")
    // let j = scheduler.scheduleJob(rule, function () {
    //   console.log("EXECUTING Elsvier scrapper")
    // พังอยู่นะค้าาาาาาาาาาาาาาาา ใช้อันยิง req มา re เถอะค่ะ
    //   periodicTask.reScrapeElsvier()
    // });
  }
});


app.use(logger('dev')); // log every request to the console
app.use(bodyParser.json({
  limit: '1000mb',
  parameterLimit: 300000
}));
app.use(bodyParser.urlencoded({
  limit: '1000mb',
  extended: true,
  parameterLimit: 300000
}));
app.use(bodyParser.raw({ limit: '1000mb' }));
app.use(bodyParser.text({ limit: '1000mb' }));

// ROUTES FOR OUR API
// =============================================================================
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,token');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  // Pass to next layer of middleware
  next();
});

//partial API
app.use('/api', require('./app/route/testAPI.js'));
app.use('/api', require('./app/route/researcherAPI.js'));
app.use('/api', require('./app/route/publicationAPI.js'));
app.use('/api', require('./app/route/developmentAPI.js'));
app.use('/api', require('./app/route/intPropAPI.js'));
app.use('/api', require('./app/route/researchFundAPI.js'));
app.use('/api', require('./app/route/rewardAPI.js'));
app.use('/api', require('./app/route/thesisAPI.js'));
app.use('/api', require('./app/route/researcherAPI_dataUpdate.js'));
app.use('/api', require('./app/route/userAPI.js'));
app.use('/api/auth', require('./app/route/authAPI.js'));
app.use('/api', require('./app/service/fileUpload.js'));

// Error handler
app.use(function (err, req, res, next) {
  let code = err.code || 500
  let message = err.message || "Internal server error"
  res.status(code).json({ code, message });
});

// START THE SERVER
// =============================================================================

var http = require('http');
let port = process.env.PORT || 5713;
var https = require('https');

if (!config.httpsMode) {
  port = process.env.PORT || config.httpport;
  var httpServer = http.createServer(app);

  httpServer.listen(port, function () {
    console.log(`=========== HTTP Server started @port ${port} successfully ==========`)
  })
}
else {
  port = process.env.PORT || config.httpsport;
  var httpsServer = https.createServer({
    key: fs.readFileSync('./config/privkey.pem'),
    cert: fs.readFileSync('./config/cert.pem')
  }, app)

  httpsServer.listen(port, function () {
    console.log(`========== HTTPS Server started @port ${port} successfully ==========`)
  })
}
