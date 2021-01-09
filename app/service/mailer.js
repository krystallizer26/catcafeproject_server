const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const key = require('./keys/researcherMisMailerKeys.json');

// If modifying these scopes, delete token.json.
const SCOPES = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send'
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
console.log("START mailer.js")

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */

var gmail = null
var gmail_auth = null

function authorize(credentials,callback ) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    console.log("Reading Token")
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));

        console.log("Calling back")
        callback(oAuth2Client);
        // OAuthFinalObj = oAuth2Client
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function getReady(auth) {
    console.log("G E T R E A D Y")
    gmail = google.gmail({ version: 'v1', auth });
    gmail_auth = auth
    console.log("GO!")
    // const res = await gmail.users.messages.send({
    //     auth: auth,
    //     userId: 'me',
    //     resource: {
    //         raw: raw
    //     }
    // }, function () {
    //     console.log("S E N T")
    // });
}

async function sendingMail(to, from, subject, content, callback) {
    let path = 'https://research.science.kmitl.ac.th/uploads/file/image/logo.png'
    let raw = makeBody(to, from, subject, content)

    const res = await gmail.users.messages.send({
        auth: gmail_auth,
        userId: 'me',
        resource: {
            raw: raw
        }
    }, function () {
        console.log("MAIL IS S E N T")
        callback('OK')
    });
}

module.exports = {
    triggerOAuth: function(){
        console.log("triggerOAuth")
        fs.readFile(__dirname+'/keys/researcherMisMailerOAuth.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Gmail API.
            console.log("Authorization")
            authorize(JSON.parse(content), getReady);
        });
    },
    sendingMailViaGSuite: function (to, from, subject, content, callback) {
        sendingMail(to, from, subject, content, function () {
            callback("OK")
        })
    }
}
function makeBody(to, from, subject, message) {
    // message = "testText"
    var str = ["Content-Type: text/html; charset=\"UTF-8\"\n",
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "to: ", to, "\n",
        "from: ", from, "\n",
        "subject: ", subject, "\n\n",
        message
    ].join('');

    var encodedMail = new Buffer(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
    return encodedMail;
}