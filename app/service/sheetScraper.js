// let express = require('express');
// let router = express.Router();
// let request = require('request');
// // let rp = require('request-promise-native');

// const fs = require('fs');
// const readline = require('readline');
// const { google } = require('googleapis');
// const OAuth2Client = google.auth.OAuth2;
// let sheets = google.sheets('v4');

// const sheetId = '1rH1YNqXyK7xyo7ypaLLmzbICHuqaAR7CyhiU37DltCE'; // research database
// // const sheetId = '1FQK00JrBtazJ247OmvPoPjfGympWwV5zLDpeP5iJdQ0';  // my test sheet
// const apiKey = 'AIzaSyCGj1-hvQBoDF7CuUryVze0KaMKcrNRVSM';

// // GOOGLE SHEETS API SETUP =====================================
// const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// const CLIENT_SECRET_PATH = './googleapis_credentials/client_secret.json';
// const TOKEN_PATH = './googleapis_credentials/credentials.json';

// let clientAuth = null;

// // DATA SETUP =================================================

// /**
//  * Create an OAuth2 client with the given credentials, and then execute the
//  * given callback function.
//  * @param {Object} credentials The authorization client credentials.
//  */
// function authorize(credentials) {
//     const { client_secret, client_id, redirect_uris } = credentials.installed;
//     clientAuth = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

//     // Check if we have previously stored a token.
//     fs.readFile(TOKEN_PATH, (err, token) => {
//         if (err) getNewToken(clientAuth);
//         else {
//             console.log('SHEET: read token file SUCCESS!');
//             clientAuth.setCredentials(JSON.parse(token));
//         }
//     });
// }

// /**
//  * Get and store new token after prompting for user authorization, and then
//  * execute the given callback with the authorized OAuth2 client.
//  * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
//  */
// function getNewToken(oAuth2Client) {
//     const authUrl = oAuth2Client.generateAuthUrl({
//         access_type: 'offline',
//         scope: SCOPES,
//     });
//     console.log('Authorize this app by visiting this url:', authUrl);
//     const rl = readline.createInterface({
//         input: process.stdin,
//         output: process.stdout,
//     });
//     rl.question('Enter the code from that page here: ', (code) => {
//         rl.close();
//         oAuth2Client.getToken(code, (err, token) => {
//             if (err) console.log('Error get token : ' + err);
//             else {
//                 oAuth2Client.setCredentials(token);
//                 // Store the token to disk for later program executions
//                 fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
//                     if (err) console.error(err);
//                     console.log('Token stored to', TOKEN_PATH);
//                 });
//             }
//         });
//     });
// }

// // Load client secrets from a local file.
// fs.readFile(CLIENT_SECRET_PATH, (err, content) => {
//     if (err) console.log('Error loading client secret file:', err);
//     else {
//         // Authorize a client with credentials, then call the Google Sheets API.
//         console.log('SHEET: read client_secret.json SUCCESS!');
//         authorize(JSON.parse(content));
//     }
// });

// //----------------------------------

// function scrapResearcher(callback) {
//     sheets.spreadsheets.values.batchGet({
//         spreadsheetId: sheetId,
//         ranges: ["'นักวิจัย'"],
//         auth: clientAuth
//     }, function(err, { data }) {
//         if (err) {
//             res.json({
//                 code: 'FAILED',
//                 message: 'The API returned an error: ' + err + ": data >> " + data
//             });
//         } else {
//             console.log("START SCRAPING")
//             // scrapingResearcher(data.valueRanges[0].values, function(message) {
//             //     callback(message)
//             // })
//         }
//     });
// }
// scrapResearcher()

// async function scrapingResearcher(rows, callback) {
//     let j = 0;
//     for (let i = 1; i < rows.length; i++) { // skip header row (i=0)
//         let scrapingData = {
//             researcherName_TH: validateValueInRow(rows[i], 0),
//             researcherName_EN: validateValueInRow(rows[i], 2),
//             personalID: validateValueInRow(rows[i], 1),
//             departmentName_TH: validateValueInRow(rows[i], 3),
//             academicPositionName_TH: validateValueInRow(rows[i], 4),
//             academicPositionName_EN: validateValueInRow(rows[i], 6),
//             positionName_TH: validateValueInRow(rows[i], 5),
//             bachelorGraduation: validateValueInRow(rows[i], 7),
//             masterGraduation: validateValueInRow(rows[i], 8),
//             doctoralGraduation: validateValueInRow(rows[i], 9),
//             assignDate: validateValueInRow(rows[i], 10),
//             birthDate: validateValueInRow(rows[i], 11),
//             retirementStatus: validateValueInRow(rows[i], 12),
//             target: validateValueInRow(rows[i], 28),
//             bachelorTeachingDepartmentName_TH: validateValueInRow(rows[i], 13),
//             bachelor_AcademicYear: validateValueInRow(rows[i], 14),
//             bachelor_FacultyBoard_Comment: validateValueInRow(rows[i], 15),
//             bachelor_CouncilBoard_Comment: validateValueInRow(rows[i], 16),
//             bachelor_InstituteBoard_Comment: validateValueInRow(rows[i], 17),
//             masterTeachingDepartmentName_TH: validateValueInRow(rows[i], 18),
//             master_AcademicYear: validateValueInRow(rows[i], 19),
//             master_FacultyBoard_Comment: validateValueInRow(rows[i], 20),
//             master_CouncilBoard_Comment: validateValueInRow(rows[i], 21),
//             master_InstituteBoard_Comment: validateValueInRow(rows[i], 22),
//             doctoryTeachingDepartmentName_TH: validateValueInRow(rows[i], 23),
//             doctory_AcademicYear: validateValueInRow(rows[i], 24),
//             doctory_FacultyBoard_Comment: validateValueInRow(rows[i], 25),
//             doctory_CouncilBoard_Comment: validateValueInRow(rows[i], 26),
//             doctory_InstituteBoard_Comment: validateValueInRow(rows[i], 27),
//             keyword1_TH: validateValueInRow(rows[i], 34),
//             keyword2_TH: validateValueInRow(rows[i], 35),
//             keyword3_TH: validateValueInRow(rows[i], 36),
//             keyword4_TH: validateValueInRow(rows[i], 37),
//             keyword5_TH: validateValueInRow(rows[i], 38),
//             keyword1_EN: validateValueInRow(rows[i], 29),
//             keyword2_EN: validateValueInRow(rows[i], 30),
//             keyword3_EN: validateValueInRow(rows[i], 31),
//             keyword4_EN: validateValueInRow(rows[i], 32),
//             keyword5_EN: validateValueInRow(rows[i], 33),
//             scopusBefore2560: validateValueInRow(rows[i], 39),
//             citationBefore2560: validateValueInRow(rows[i], 40),
//             hIndex: validateValueInRow(rows[i], 41),
//             citationTotal: validateValueInRow(rows[i], 42),
//             citationAfter2560: validateValueInRow(rows[i], 43),
//             citationLifeTime: validateValueInRow(rows[i], 44),
//             citationTCI: validateValueInRow(rows[i], 45),
//             publicationTotal: validateValueInRow(rows[i], 46),
//             publication2560: validateValueInRow(rows[i], 47),
//             publicationLifeTime: validateValueInRow(rows[i], 48),
//             publicationTCI: validateValueInRow(rows[i], 49),
//             organizationTel: validateValueInRow(rows[i], 50),
//             mobileTel: validateValueInRow(rows[i], 51),
//             email: validateValueInRow(rows[i], 52),
//             workplace: validateValueInRow(rows[i], 53),
//             facebook: validateValueInRow(rows[i], 54),
//             twitter: validateValueInRow(rows[i], 55),
//             instragram: validateValueInRow(rows[i], 56),
//             line: validateValueInRow(rows[i], 57),
//             personalSite: validateValueInRow(rows[i], 58),
//             insignia1: validateValueInRow(rows[i], 59),
//             insignia2: validateValueInRow(rows[i], 60),
//             totalCitationNotSelf: validateValueInRow(rows[i], 61),
//             citation2014: validateValueInRow(rows[i], 62),
//             citation2015: validateValueInRow(rows[i], 63),
//             citation2016: validateValueInRow(rows[i], 64),
//             citation2017: validateValueInRow(rows[i], 65),
//             citation2018: validateValueInRow(rows[i], 66),
//             researcherPic: null
//         }
//         Researcher_Control.newResearcher_fromScrap(scrapingData, function() {
//             j++
//             if (j == rows.length - 1)
//                 callback(j + " rows of researcher are saved")
//         })
//     }
// }