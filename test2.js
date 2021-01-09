const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const key = require('./app/service/keys/researcherMisMailerKeys.json');

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
fs.readFile('./app/service/keys/researcherMisMailerOAuth.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content), listLabels);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
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
async function listLabels(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    let path = 'https://research.science.kmitl.ac.th/uploads/file/image/logo.png'
    let raw = makeBody('krystallizer26@gmail.com', 'Researcher Directory System <webmaster-sci@kmitl.ac.th>', 'Your permission has been approved',
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

                </style>
			</head>
                <body>
					<div class="container">
                        <img
                            class="header"
                            src="${path}"
                        />
						<div class="content">
							<h4 style="font-size: 24px;">Dear xxx,</h4>
							<p style="font-size: 18px;">Welcome to Research Directory. Your account has already been created for accessing to the system. Please use these credential to login.</p>
							<h5 style="font-size: 18px;">E-mail: <span style="font-size: 18px;">xxx</span> </h5>
							<h5 style="font-size: 18px;">Password: <span style="font-size: 18px;">yyy</span> </h5>
							<br />
							<p style="font-size: 18px;">Best Regards.</p>
							<p style="font-size: 18px;">Research Directory.</p>
						</div>
                        <footer style="padding: 2em; color: white; background-color: #2f3b7a;">
							Faculty of Science, King Mongkut's Institute of Technology Ladkrabang
                            <br />Chalongkrung Rd. Ladkrabang District Bangkok 10520 <br />Tel.
                            02-329-8400 to 8411 <br />Fax 02-329-8412 <br />Faculty of Science,
                            KMITL <br /><a style="color: rgb(255, 210, 0);box-sizing: border-box;" href="http://www.science.kmitl.ac.th/" target="_blank" >www.science.kmitl.ac.th</a>
							<br /><a style="color: rgb(255, 210, 0);box-sizing: border-box;" href="https://www.facebook.com/SciKmitl" target="_blank" >Sci KMITL</a>
							<p style="text-align: center;box-sizing: border-box;">Copyright © Science@KMITL 2019</p>
						</footer>
					</div>
				</body>
		</html>`);
    console.log("SENDING")

    const res = await gmail.users.messages.send({
        auth: auth,
        userId: 'me',
        resource: {
            raw: raw
        }
    }, function () {
        console.log("S E N T")
    });
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