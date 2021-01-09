const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const gmail = google.gmail('v1');
var config = require('./config/config.js');
const key = require('./app/service/keys/researcherMisMailerKeys.json');

async function sendMessage(to, from, subject, html) {
	let raw = makeBody(to, from, subject, html);
	// console.log(raw)

	let client = await getClient()
	google.options({
		auth: client
	});

	const res = await gmail.users.messages.send({
		userId: key.client_id,
		requestBody: {
			raw: raw,
		},
	});
}

function makeBody(to, from, subject, message) {
	message = 'aaaaaaaaaaaaaaaaqqqqqqqqqqqqqqsdasdadasdasd'
	var str = ["Content-Type: multipart/mixed; charset=\"UTF-8\"\n",
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
const path = require('path');
async function getClient() {
	const JWT = google.auth.JWT;
	const authClient = new JWT({
		keyFile: path.resolve(__dirname, 'app/service/keys/researcherMisMailerKeys.json'),
		scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
		subject: 'mailer@researchmismailer.iam.gserviceaccount.com' // google admin email address to impersonate
	});

	await authClient.authorize(); // once authorized, can do whatever you want
	
	return authClient

	// try {
	// 	// console.log(key.client_email)
	// 	// console.log(key.private_key)
	// 	let auth = new GoogleAuth({
	// 		credentials: {
	// 			client_email: key.client_email,
	// 			private_key: key.private_key,
	// 		},
	// 		scopes: [
	// 			"https://mail.google.com/",
	// 			"https://www.googleapis.com/auth/gmail.compose",
	// 			"https://www.googleapis.com/auth/gmail.modify",
	// 			"https://www.googleapis.com/auth/gmail.send"],
	// 		// clientOptions: { subject: "xxdsaf" }
	// 	});
	// 	const client = await auth.getClient();
	// 	if (client)
	// 		return client
	// } catch (e) {
	// 	console.log('error accured while getClient', e);
	// 	return e;
	// }
}



sendMessage('krystallizer26@gmail.com', 'ศูนย์ทำเนียบนักวิจัย สจล. <webmaster-sci@kmitl.ac.th>', 'Your permission has been approved',
	`<!DOCTYPE html>
                    <html lang="th">
								<head>
									<meta charset="utf-8" />
									<style>
										* {
											box - sizing: border-box;
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
											text - align: center;
                          }
                          footer > a {
											color: rgb(255, 210, 0);
                          }
                        </style>
								</head>
								<body>
									<div class="container">

										<div class="content">
											<h4 style="font-size: 24px;">Dear xxx,</h4>
											<p style="font-size: 18px;">Welcome to Research Directory. Your account has already been created for accessing to the system. Please use these credential to login.</p>
											<h5 style="font-size: 18px;">E-mail: <span style="font-size: 18px;">xxx</span> </h5>
											<h5 style="font-size: 18px;">Password: <span style="font-size: 18px;">yyy</span> </h5>
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
							</html>`
)