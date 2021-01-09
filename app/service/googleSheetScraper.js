var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');

// spreadsheet key is the long id in the sheets URL
var doc = new GoogleSpreadsheet('1rH1YNqXyK7xyo7ypaLLmzbICHuqaAR7CyhiU37DltCE');

function reScraping(callback) {
    async.series([
        function setAuth(step) {
            // see notes below for authentication instructions!
            console.log('Document Loading...');
            var creds = require('./keys/researcherMisGoogleDevKeys.json');
            doc.useServiceAccountAuth(creds, step);
        },
        function scrapResearcher_step(step) {
            doc.getInfo(function (err, info) {
                // console.log(info)
                console.log('Loaded doc: ' + info.title + ' by ' + info.author.email);

                let researchersheet = info.worksheets[0];
                scrapeResearcherFromSheet(researchersheet, (code, err, data) => {
                    step();
                    // callback(code, err, data);
                })
            });
        },
        function scrapPublication_step(step) {
            doc.getInfo(function (err, info) {
                // console.log(info)

                let publicationSheet = info.worksheets[1];
                scrapePublicationFromSheet(publicationSheet, (code, err, data) => {
                    step();
                    // callback(code, err, data);
                })
            });
        },
        function scrapReward_step(step) {
            doc.getInfo(function (err, info) {
                // console.log(info)

                let rewardSheet = info.worksheets[2];
                scrapeRewardFromSheet(rewardSheet, (code, err, data) => {
                    step();
                    // callback(code, err, data);
                })
            });
        },
        function scrapIntProp_step(step) {
            doc.getInfo(function (err, info) {
                // console.log(info)

                let intPropSheet = info.worksheets[3];
                scrapeIntPropFromSheet(intPropSheet, (code, err, data) => {
                    step();
                    // callback(code, err, data);
                })
            });
        },
        function scrapeDevelopFromSheet_step(step) {
            doc.getInfo(function (err, info) {
                // console.log(info)

                let developSheet = info.worksheets[5];
                scrapeDevelopFromSheet(developSheet, (code, err, data) => {
                    step();
                    // callback(code, err, data);
                })
            });
        },
        function scrapeResearchFundFromSheet_step(step) {
            doc.getInfo(function (err, info) {
                // console.log(info)

                let researchFundSheet = info.worksheets[6];
                scrapeResearchFundFromSheet(researchFundSheet, (code, err, data) => {
                    step();
                    // callback(code, err, data);
                })
            });
        },
        function scrapThesis_step(step) {
            doc.getInfo(function (err, info) {
                // console.log(info)

                let thesisSheet = info.worksheets[4];
                scrapeThesisFromSheet(thesisSheet, (code, err, data) => {
                    step();
                    // callback(code, err, data);
                })
            });
        },
        function end(step) {
            callback("000", null, { status: true });
        }
    ], function (err) {
        if (err) {
            callback('Error: ' + err);
        }
    });
}

let Simplifier = require('../../app/service/simplifier.js');
let Researcher_Control = require('../controller/researcher_control.js');
let Publication_Control = require('../controller/publication_control.js');
let Reward_Control = require('../controller/reward_control.js');
let IntProp_Control = require('../controller/intProp_control.js');
let Development_Control = require('../controller/development_control.js');
let ResearchFund_control = require('../controller/researchFund_control.js');
let Thesis_Control = require('../controller/thesis_control.js');
let Return = require('../../app/service/return.js');
let Researcher = require('../model/researcher_model.js');

function scrapeResearcherFromSheet(sheet, callback) {

    sheet.getRows({
        offset: 1
        // limit: 1
    }, function (err, rows) {
        let scrapCounter = 0
        console.log(`researcher length : ${rows.length}`)
        // console.log(rows[0])
        rows.forEach((researcher, index) => {

            let assignDate_text = researcher['วันที่บรรจุ'].split('/')
            let assignDate_date = new Date(Date.UTC(parseInt(assignDate_text[2]) - 543, assignDate_text[1] - 1, assignDate_text[0], 0, 0, 0))
            if (assignDate_date == "Invalid Date" || researcher['วันที่บรรจุ'] == '') assignDate_date = null

            let birthDate_text = researcher['วันเดือนปีเกิด'].split('/')
            let birthDate_date = new Date(Date.UTC(parseInt(birthDate_text[2]) - 543, birthDate_text[1] - 1, birthDate_text[0], 0, 0, 0))
            if (birthDate_date == "Invalid Date" || researcher['วันเดือนปีเกิด'] == '') birthDate_date = null

            let retiredDate_text = researcher['สถานภาพเกษียณ'].split('/')
            let retiredDate_date = new Date(Date.UTC(parseInt(retiredDate_text[2]) - 543, retiredDate_text[1] - 1, retiredDate_text[0], 0, 0, 0))
            if (retiredDate_date == "Invalid Date" || researcher['สถานภาพเกษียณ'] == '') retiredDate_date = null

            let researcherObj = {
                show: true,
                researcherPicture: researcher['รูปประจำตัว'].replace("http://161.246.35.182:5713", "https://research.science.kmitl.ac.th/uploads"),
                researcherName_TH: researcher['ชื่อ-นามสกุล'],
                researcherName_EN: researcher['name'],
                scorpusId: researcher['รหัสscorpusauthoridเช่นhttpswww.scopus.comauthiddetail.uriauthorid6602488801'].trim(),
                citizenId: researcher['บัตรประชาชนตอนสุดท้ายเอาออกจากdb'],
                department: {
                    name_TH: researcher['ภาควิชา'],
                    name_EN: researcher['department'],
                },
                academicPosition: researcher['academicposition'],
                bachelorDegree: {
                    degreeName_TH: researcher['ชื่อปริญญาตรี'],
                    degreeName_EN: researcher['nameofbachelordegree'],
                    graduationYear: researcher['ปีที่จบปริญญาตรี'],
                    universityName_TH: researcher['มหาวิทยาลัยที่จบปริญญาตรี'],
                    universityName_EN: researcher['bachelordegreeuniversity'],
                    universityCountry_TH: researcher['ประเทศที่จบปริญญาตรี'],
                    universityCountry_EN: researcher['bachelordegreecountry']
                },
                masterDegree: {
                    degreeName_TH: researcher['ชื่อปริญญาโท'],
                    degreeName_EN: researcher['nameofmasterdegree'],
                    graduationYear: researcher['ปีที่จบปริญญาโท'],
                    universityName_TH: researcher['มหาวิทยาลัยที่จบปริญญาตโท'],
                    universityName_EN: researcher['masterdegreeuniversity'],
                    universityCountry_TH: researcher['ประเทศที่จบปริญญาโท'],
                    universityCountry_EN: researcher['masterdegreecountry']
                },
                doctorDegree: {
                    degreeName_TH: researcher['ชื่อปริญญาเอก'],
                    degreeName_EN: researcher['nameofdocterdegree'],
                    graduationYear: researcher['ปีที่จบปริญญาเอก'],
                    universityName_TH: researcher['มหาวิทยาลัยที่จบปริญญาเอก'],
                    universityName_EN: researcher['docterdegreeuniversity'],
                    universityCountry_TH: researcher['ประเทศที่จบปริญญาเอก'],
                    universityCountry_EN: researcher['docterdegreecountry']
                },
                birthDate: birthDate_date,
                birthDateText: Simplifier.simpliflied_date(birthDate_date),
                assignDate: assignDate_date,
                assignDateText: Simplifier.simpliflied_date(assignDate_date),
                retiredDate: retiredDate_date,
                retiredDateText: Simplifier.simpliflied_date(retiredDate_date),
                instructor: [
                    {
                        name: researcher['อาจารย์ประจำหลักสูตรป.ตรีen'],
                        link: researcher['urlหลักสูตรป.ตรี'],
                        degree: 'Bachelor'
                    },
                    {
                        name: researcher['อาจารย์ประจำหลักสูตรป.โทen'],
                        link: researcher['urlหลักสูตรป.โท'],
                        degree: 'Master'
                    }
                ],
                targetIndustry_TH: researcher['อุตสาหกรรมเป้าหมายth'],
                targetIndustry_EN: researcher['อุตสาหกรรมเป้าหมายen'],
                keywords_TH: [researcher['คำสำคัญ1'], researcher['คำสำคัญ2'], researcher['คำสำคัญ3'], researcher['คำสำคัญ4'], researcher['คำสำคัญ5']],
                keywords_EN: [researcher['keyword1'], researcher['keyword2'], researcher['keyword3'], researcher['keyword4'], researcher['keyword5']],
                internalPhone: researcher['เบอร์ภายใน'],
                mobilePhone: researcher['เบอร์มือถือ66968096883ไม่ต้องใส่66ใส่แค่หลัง0ตัวแรก'],
                email: researcher['email'],
                room_TH: null,
                room_EN: researcher['อาคารห้องทำงานen'],
                facebook: {
                    name: null,
                    link: researcher['facebookfullurlex.httpswww.facebook.comwittawat.hamhongsa']
                },
                twitter: {
                    name: null,
                    link: researcher['twitterfullurl']
                },
                instragram: {
                    name: null,
                    link: researcher['youtubefullurl']
                },
                line: {
                    name: null,
                    link: researcher['linefullurl']
                },
                youtube: {
                    name: null,
                    link: null
                },
                linkedIn: {
                    name: null,
                    link: null
                },
                personalSite: {
                    name: null,
                    link: researcher['websitefullurlhttpwww.tawan.in.th']
                },
                insignia: [researcher['เครื่องราชสูงสุด1'], researcher['เครื่องราชสูงสุด2']],
                course: [
                    {
                        name: researcher['course1name'],
                        url: researcher['course1urlex.httpwww.reg.kmitl.ac.thteachtablev20subjectdetail.phpsubjectid05016201']
                    },
                    {
                        name: researcher['course2name'],
                        url: researcher['course2url']
                    },
                    {
                        name: researcher['course3name'],
                        url: researcher['course3url']
                    },
                    {
                        name: researcher['course4name'],
                        url: researcher['course4url']
                    },
                    {
                        name: researcher['course5name'],
                        url: researcher['course5url']
                    }
                ],
                updateLog: [],
                dateTime_lastEdit: new Date()
            }
            Researcher_Control.upsertResearcherFromSheet(researcherObj, (code, err, data) => {
                console.log(`Researcher#${index} (${researcher['ชื่อ-นามสกุล']}) scrapped successfully`)

                scrapCounter++
                // console.log(`${scrapCounter} / ${rows.length-1}`)
                if (scrapCounter >= rows.length) {
                    callback("001", "OK", null)
                }
            })
        });
    });
}

function scrapePublicationFromSheet(sheet, callback) {

    sheet.getRows({
        offset: 1
        // limit: 1
    }, function (err, rows) {
        let scrapCounter = 0
        console.log(`publication length : ${rows.length}`)
        console.log(rows[0])
        rows.forEach((publication, index) => {

            let conferenceStartDate_text = publication['วันที่เริ่มงานถ้าเป็นเจอนอลไม่ต้องใส่'].split('/')
            let conferenceStartDate_date = new Date(Date.UTC(parseInt(conferenceStartDate_text[2]) - 543, conferenceStartDate_text[1] - 1, conferenceStartDate_text[0], 0, 0, 0))
            if (conferenceStartDate_date == "Invalid Date" || publication['วันที่เริ่มงานถ้าเป็นเจอนอลไม่ต้องใส่'] == '') conferenceStartDate_date = null

            let conferenceFinishDate_text = publication['วันที่สิ้นสุดงานถ้าเป็นเจอนอลไม่ต้องใส่'].split('/')
            let conferenceFinishDate_date = new Date(Date.UTC(parseInt(conferenceFinishDate_text[2]) - 543, conferenceFinishDate_text[1] - 1, conferenceFinishDate_text[0], 0, 0, 0))
            if (conferenceFinishDate_date == "Invalid Date" || publication['วันที่สิ้นสุดงานถ้าเป็นเจอนอลไม่ต้องใส่'] == '') conferenceFinishDate_date = null

            let publicationObj = {
                show: true,
                name: publication['ชื่อผลงานวิจัย'].replace(/\n/g, ' ').trim(),
                publicationLocation: publication['ชื่อคอนเฟอเรนซ์เจอนอลlocation'],
                owner: publication['ชือเจ้าของผลงาน'],
                volumn: publication['ฉบับที่volumnissue'],
                page: publication['หน้าp-p'],
                conferenceLocation: publication['สถานที่จัดงานถ้าเป็นเจอนอลไม่ต้องใส่'],
                conferenceStartDate: conferenceStartDate_date,
                conferenceFinishDate: conferenceFinishDate_date,
                conferenceDurationText: Simplifier.simpliflied_duration(conferenceStartDate_date, conferenceFinishDate_date),
                bookPublisher: publication['สำนักพิมพ์ถ้าเป็นหนังสือหรือตำรา'],
                bookPublishingLocation: publication['สถานที่พิมพ์ถ้าเป็นหนังสือหรือตำรา'],
                year: parseInt(publication['ปีพ.ศ.']) - 543,
                year_buddhist: publication['ปีพ.ศ.'],
                publicationLevel: publication['ลักษณะการเผยแพร่'],
                databaseType: publication['ฐานข้อมูล'],
                doi: publication['doi'],
                impactFactor: publication['impactfactor'],
                quartile_sjr: publication['quartilesjr'],
                quartile_webOfScience: publication['quartilewebofscience'],
                weight: publication['ค่าน้ำหนัก'],
                remark: publication['หมายเหตุ'],
                student: {
                    name: publication['ชื่อนักศึกษา'],
                    studentId: publication['รหัสนักศึกษา']
                }
            }

            Publication_Control.upsertPublicationFromSheet(publication['บัตรประชาชน'], publicationObj, (code, err, data) => {
                console.log(`Publication#${index} (${publication['ชื่อผลงานวิจัย'].substring(0, 15)}...) scrapped successfully`)

                scrapCounter++
                if (scrapCounter >= rows.length) {
                    callback("001", "OK", null)
                }
            })
        });
    });
}

function scrapeRewardFromSheet(sheet, callback) {

    sheet.getRows({
        offset: 1
        // limit: 1
    }, function (err, rows) {
        let scrapCounter = 0
        console.log(`reward length : ${rows.length}`)
        // console.log(rows[0])
        rows.forEach((reward, index) => {

            let recieveDate_text = reward['วันที่ได้รับ'].split('/')
            let recieveDate_date = new Date(Date.UTC(parseInt(recieveDate_text[2]) - 543, recieveDate_text[1] - 1, recieveDate_text[0], 0, 0, 0))
            if (recieveDate_date == "Invalid Date" || reward['วันที่ได้รับ'] == '') recieveDate_date = null

            let rewardObj = {
                show: true,
                name: reward['ชื่อรางวัลenแปลเป็นenทั้งหมด'],
                work: reward['ชื่อผลงานที่ได้รับรางวัลen'],
                announceLocation_TH: reward['ชื่องานth'],
                announceLocation_EN: reward['ชื่องานen'],
                organizer: reward['ผู้จัดงานenถ้ามี'],
                location: reward['สถานที่en'],
                country: reward['ประเทศen'],
                year_buddhist: reward['ปีพ.ศ.'],
                recieveDate: recieveDate_date,
                recieveDateText: Simplifier.simpliflied_date(recieveDate_date),
                ranking_TH: reward['ระดับ'],
                ranking_EN: reward['ระดับen'],
                student: reward['ชื่อนักศึกษา'].split(',').map(function (item) {
                    return item.trim();
                })
            }

            Reward_Control.upsertRewardFromSheet(reward['บัตรประชาชน'], rewardObj, (code, err, data) => {
                console.log(`Reward#${index} (${reward['ชื่อรางวัลenแปลเป็นenทั้งหมด'].substring(0, 15)}...) scrapped successfully`)

                scrapCounter++
                if (scrapCounter >= rows.length) {
                    callback("001", "OK", null)
                }
            })
        });
    });
}

function scrapeIntPropFromSheet(sheet, callback) {

    sheet.getRows({
        offset: 1
        // limit: 1
    }, function (err, rows) {
        let scrapCounter = 0
        console.log(`intProp length : ${rows.length}`)
        // console.log(rows[0])
        rows.forEach((intProp, index) => {

            let applyDate_text = intProp['วันที่ยื่นคำขอapplicationdate'].split('/')
            let applyDate_date = new Date(Date.UTC((parseInt(applyDate_text[2]) + 2500 - 543), applyDate_text[1] - 1, applyDate_text[0], 0, 0, 0))
            if (applyDate_date == "Invalid Date" || intProp['วันที่ยื่นคำขอapplicationdate'] == '') applyDate_date = null

            let grantedDate_text = intProp['ออกให้ณgranteddate'].split('/')
            let grantedDate_date = new Date(Date.UTC((parseInt(grantedDate_text[2]) + 2500 - 543), grantedDate_text[1] - 1, grantedDate_text[0], 0, 0, 0))
            if (grantedDate_date == "Invalid Date" || intProp['ออกให้ณgranteddate'] == '') grantedDate_date = null

            let intPropObj = {
                show: true,
                name_TH: intProp['ชื่อผลิตภัณฑ์สิ่งประดิษฐ์'],
                name_EN: intProp['ชื่อผลิตภัณฑ์สิ่งประดิษฐ์en'],
                applicationNo: intProp['เลขที่คำขอapplicationno.'],
                applyDate: applyDate_date,
                applyDateText: Simplifier.simpliflied_date(applyDate_date),
                patentRegisterNo: intProp['ทะเบียนเลขที่patentregistrationno.'],
                grantedDate: grantedDate_date,
                grantedDateText: Simplifier.simpliflied_date(grantedDate_date),
                coverage: intProp['ประเภทความคุ้มครอง'],
                applicant: intProp['ผู้ขอรับสิทธิ'],
                coInventor: intProp['ผู้ประดิษฐ์ร่วม'].split(',').map(function (item) {
                    return item.trim();
                })
            }

            // if(intProp['บัตรประชาชน'] == "3102101609588"){
            //     console.log(intProp['วันที่ยื่นคำขอapplicationdate'])
            //     console.log(applyDate_text)
            //     console.log(applyDate_date)
            //     console.log(intProp['ออกให้ณgranteddate'])
            //     console.log(grantedDate_text)
            //     console.log(grantedDate_date)
            //     console.log(intPropObj)
            // }

            IntProp_Control.upsertIntPropFromSheet(intProp['บัตรประชาชน'], intPropObj, (code, err, data) => {
                console.log(`Intellectual Property#${index} (${intProp['ชื่อผลิตภัณฑ์สิ่งประดิษฐ์'].substring(0, 15)}...) scrapped successfully`)

                scrapCounter++
                if (scrapCounter >= rows.length) {
                    callback("001", "OK", null)
                }
            })
        });
    });
}

function scrapeDevelopFromSheet(sheet, callback) {

    sheet.getRows({
        offset: 1
        // limit: 1
    }, function (err, rows) {
        let scrapCounter = 0
        console.log(`develop length : ${rows.length}`)
        // console.log(rows[0])
        rows.forEach((develop, index) => {
            // let monthTxt_thai = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.", "ม.ค.", "ม.ค."]

            let startDate_text = develop['เริ่มตั้งแต่วันที่'].split('/')
            let startDate_date = new Date(Date.UTC(parseInt(startDate_text[2]) - 543, startDate_text[1] - 1, startDate_text[0], 0, 0, 0))
            if (startDate_date == "Invalid Date" || develop['เริ่มตั้งแต่วันที่'] == '') startDate_date = null

            let finishDate_text = develop['สิ้นสุดวันที่รวบมาให้เป็นdd-ddmmyyyy'].split('/')
            let finishDate_date = new Date(Date.UTC(parseInt(finishDate_text[2]) - 543, finishDate_text[1] - 1, finishDate_text[0], 0, 0, 0))
            if (finishDate_date == "Invalid Date" || develop['สิ้นสุดวันที่รวบมาให้เป็นdd-ddmmyyyy'] == '') finishDate_date = null

            let approveDate_text = develop['สิ้นสุดวันที่รวบมาให้เป็นdd-ddmmyyyy'].split('/')
            let approveDate_date = new Date(Date.UTC(parseInt(approveDate_text[2]) - 543, approveDate_text[1] - 1, approveDate_text[0], 0, 0, 0))
            if (approveDate_date == "Invalid Date" || develop['สิ้นสุดวันที่รวบมาให้เป็นdd-ddmmyyyy'] == '') approveDate_date = null

            // let approveDate_text = develop['วันที่ขออนุมัติ'].split(' ')
            // let approve_month_pos = monthTxt_thai.indexOf(approveDate_text[1])
            // let approveDate_date = new Date(Date.UTC(approveDate_text[2] + 2500 - 543, approve_month_pos, approveDate_text[0], 0, 0, 0))
            // if (approveDate_date == "Invalid Date" || develop['วันที่ขออนุมัติ'] == '' || approve_month_pos == -1) approveDate_date = null

            let developmentObj = {
                show: true,
                meetingName: develop['ชื่อการประชุมอบรมสัมนาพัฒนาวิชาการen'],
                researchName: develop['หัวข้อชื่อผลงานวิจัยen'],
                organizer: develop['ผู้จัดen'],
                location: develop['สถานที่en'],
                country: develop['ประเทศen'],
                type: develop['ลักษณะการพัฒนา'],
                level: develop['ระดับ'],
                year_buddhist: develop['ปีพ.ศ.'],
                startDate: startDate_date,
                finishDate: finishDate_date,
                durationText: Simplifier.simpliflied_duration(startDate_date, finishDate_date),
                scholarType: develop['ประเภททุน'],
                budget: parseInt(develop['วงเงิน'].replace(/,/g, '').trim()) == 'NaN' ? null : develop['วงเงิน'].replace(/,/g, '').trim(),
                name_TH: develop['เลขที่คำสั่งเลขที่ศธ'],
                approveDate: approveDate_date
            }

            Development_Control.upsertDevelopmentFromSheet(develop['บัตรประชาชน'], developmentObj, (code, err, data) => {
                console.log(`Development#${index} (${develop['ชื่อการประชุมอบรมสัมนาพัฒนาวิชาการen'].substring(0, 15)}...) scrapped successfully`)

                scrapCounter++
                if (scrapCounter >= rows.length) {
                    callback("001", "OK", null)
                }
            })
        });
    });
}

function scrapeResearchFundFromSheet(sheet, callback) {

    sheet.getRows({
        offset: 1
        // limit: 1
    }, function (err, rows) {
        let scrapCounter = 0
        console.log(`researchFund length : ${rows.length}`)
        // console.log(rows[0])
        rows.forEach((researchFund, index) => {
            let monthTxt_thai = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.", "ม.ค.", "ม.ค."]

            let startDate_text = researchFund['ระยะเวลาดำเนินการเริ่ม'].split('/')
            let startDate_date = new Date(Date.UTC(parseInt(startDate_text[2]) + 2500 - 543, startDate_text[1] - 1, startDate_text[0], 0, 0, 0))
            if (startDate_date == "Invalid Date" || researchFund['ระยะเวลาดำเนินการเริ่ม'] == '') startDate_date = null

            let finishDate_text = researchFund['ระยะเวลาดำเนินการสิ้นสุด'].split('/')
            let finishDate_date = new Date(Date.UTC(parseInt(finishDate_text[2]) + 2500 - 543, finishDate_text[1] - 1, finishDate_text[0], 0, 0, 0))
            if (finishDate_date == "Invalid Date" || researchFund['ระยะเวลาดำเนินการสิ้นสุด'] == '') finishDate_date = null

            let progress_6m_text = researchFund['วันที่รายงานความก้าวหน้า6เดือน'].split('/')
            let progress_6mDate = new Date(Date.UTC(parseInt(progress_6m_text[2]) + 2500 - 543, progress_6m_text[1] - 1, progress_6m_text[0], 0, 0, 0))
            if (progress_6mDate == "Invalid Date" || researchFund['วันที่รายงานความก้าวหน้า6เดือน'] == '') progress_6mDate = null

            let progress_12m_text = researchFund['วันที่รายงานความก้าวหน้า12เดือน'].split('/')
            let progress_12mDate = new Date(Date.UTC(parseInt(progress_12m_text[2]) + 2500 - 543, progress_12m_text[1] - 1, progress_12m_text[0], 0, 0, 0))
            if (progress_12mDate == "Invalid Date" || researchFund['วันที่รายงานความก้าวหน้า12เดือน'] == '') progress_12mDate = null

            let extensionDate = []
            let extension1_text = researchFund['ขอขยายเวลาครั้งที่1'].split('/')
            let extension1_date = new Date(Date.UTC(parseInt(extension1_text[2]) + 2500 - 543, extension1_text[1] - 1, extension1_text[0], 0, 0, 0))
            if (!(extension1_date == "Invalid Date" || researchFund['ขอขยายเวลาครั้งที่1'] == '')) extensionDate.push(extension1_date)

            let extension2_text = researchFund['ขอขยายเวลาครั้งที่2'].split('/')
            let extension2_date = new Date(Date.UTC(parseInt(extension2_text[2]) + 2500 - 543, extension2_text[1] - 1, extension2_text[0], 0, 0, 0))
            if (!(extension2_date == "Invalid Date" || researchFund['ขอขยายเวลาครั้งที่2'] == '')) extensionDate.push(extension2_date)

            let completeSubmission_text = researchFund['วันส่งรายงานฉบับสมบูรณ์'].split('/')
            let completeSubmission_date = new Date(Date.UTC(parseInt(completeSubmission_text[2]) + 2500 - 543, completeSubmission_text[1] - 1, completeSubmission_text[0], 0, 0, 0))
            if (completeSubmission_date == "Invalid Date" || researchFund['วันส่งรายงานฉบับสมบูรณ์'] == '') completeSubmission_date = null

            let projectClose_txt = researchFund['วันส่งรายงานฉบับสมบูรณ์'].split('/')
            let projectClose_date = new Date(Date.UTC(parseInt(projectClose_txt[2]) + 2500 - 543, projectClose_txt[1] - 1, projectClose_txt[0], 0, 0, 0))
            if (projectClose_date == "Invalid Date" || researchFund['วันส่งรายงานฉบับสมบูรณ์'] == '') projectClose_date = null

            let researchFundObj = {
                show: true,
                researchName_TH: researchFund['ชื่อโครงการวิจัย'],
                researchName_EN: researchFund['ชื่อโครงการวิจัยen'],
                fundName: researchFund['ชื่อทุนen'],
                fundSource: researchFund['แหล่งทุน'],
                year_buddhist: researchFund['ปีที่ได้ทุน'],
                startDate: startDate_date,
                finishDate: finishDate_date,
                durationText: Simplifier.simpliflied_duration(startDate_date, finishDate_date),
                progress_6mDate: progress_6mDate,
                progress_6mText: Simplifier.simpliflied_date(progress_6mDate),
                progress_6m: researchFund['ความก้าวหน้า6เดือน'],
                progress_12mDate: progress_12mDate,
                progress_12mText: Simplifier.simpliflied_date(progress_12mDate),
                progress_12m: researchFund['ความก้าวหน้า12เดือน'],
                extension: extensionDate,
                extension_Text: Simplifier.simpliflied_dateArray(extensionDate),
                completeSubmission: completeSubmission_date,
                completeSubmissionText: Simplifier.simpliflied_date(completeSubmission_date),
                result: [researchFund['ผลผลิต1']],
                projectClose: projectClose_date,
                projectCloseText: Simplifier.simpliflied_date(projectClose_date),
                yearExtension: researchFund['ต่อปี'],
                yearContinuous: researchFund['ต่อเนื่องปี'],
                wholeBudget: researchFund['งบประมาณเต็ม'].replace(/,/g, '').trim(),
                ratio: researchFund['สัดส่วน'],
                role: researchFund['บทบาท'],
                supportFund: [
                    {
                        name: '2558-2562',
                        type: 'ภายใน',
                        amount: researchFund['สนับสนุนปี2558-2562ภายใน'].replace(/,/g, '').trim() === '' ? null : researchFund['สนับสนุนปี2558-2562ภายใน'].replace(/,/g, '').trim()
                    },

                    {
                        name: '2558-2562',
                        type: 'ภายนอก',
                        amount: researchFund['สนับสนุนปี2558-2562ภายนอก'].replace(/,/g, '').trim() === '' ? null : researchFund['สนับสนุนปี2558-2562ภายนอก'].replace(/,/g, '').trim()
                    },

                    {
                        name: '2561',
                        type: 'ภายใน',
                        amount: researchFund['สนับสนุนปี2561'].replace(/,/g, '').trim() === '' ? null : researchFund['สนับสนุนปี2561'].replace(/,/g, '').trim()
                    }
                ],
                remark: researchFund['หมายเหตุ']
            }

            ResearchFund_control.upsertResearchFundFromSheet(researchFund['บัตรประชาชน'], researchFundObj, (code, err, data) => {
                console.log(`ResearchFund#${index} (${researchFund['ชื่อโครงการวิจัย'].substring(0, 15)}...) scrapped successfully`)

                scrapCounter++
                if (scrapCounter >= rows.length) {
                    callback("001", "OK", null)
                }
            })
        });
    });
}

function scrapeThesisFromSheet(sheet, callback) {

    sheet.getRows({
        offset: 1
        // limit: 1
    }, function (err, rows) {
        let scrapCounter = 0
        console.log(`thesis length : ${rows.length}`)
        // console.log(rows[0])
        rows.forEach((thesis, index) => {
            // let monthTxt_thai = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.", "ม.ค.", "ม.ค."]

            let qeTestDate_text = thesis['วันที่สอบวัดคุณสมบัติ'].split('/')
            let qeTestDate_date = new Date(Date.UTC(parseInt(qeTestDate_text[2]) - 543, qeTestDate_text[1] - 1, qeTestDate_text[0], 0, 0, 0))
            if (qeTestDate_date == "Invalid Date" || thesis['วันที่สอบวัดคุณสมบัติ'] == '') qeTestDate_date = null

            let instructorAssignDate_text = thesis['วันที่แต่งตั้งที่ปรึกษา'].split('/')
            let instructorAssignDate_date = new Date(Date.UTC(parseInt(instructorAssignDate_text[2]) - 543, instructorAssignDate_text[1] - 1, instructorAssignDate_text[0], 0, 0, 0))
            if (instructorAssignDate_date == "Invalid Date" || thesis['วันที่แต่งตั้งที่ปรึกษา'] == '') instructorAssignDate_date = null

            let thesisTopicProposal_text = thesis['วันที่เสนอหัวข้อ'].split('/')
            let thesisTopicProposal_date = new Date(Date.UTC(parseInt(thesisTopicProposal_text[2]) - 543, thesisTopicProposal_text[1] - 1, thesisTopicProposal_text[0], 0, 0, 0))
            if (thesisTopicProposal_date == "Invalid Date" || thesis['วันที่เสนอหัวข้อ'] == '') thesisTopicProposal_date = null

            let thesisTopicAnnounce_text = thesis['วันที่่ประกาศหัวข้อ'].split('/')
            let thesisTopicAnnounce_date = new Date(Date.UTC(parseInt(thesisTopicAnnounce_text[2]) - 543, thesisTopicAnnounce_text[1] - 1, thesisTopicAnnounce_text[0], 0, 0, 0))
            if (thesisTopicAnnounce_date == "Invalid Date" || thesis['วันที่่ประกาศหัวข้อ'] == '') thesisTopicAnnounce_date = null

            let thesisOutlineExam_text = thesis['วันที่สอบเค้าโครง'].split('/')
            let thesisOutlineExam_date = new Date(Date.UTC(parseInt(thesisOutlineExam_text[2]) - 543, thesisOutlineExam_text[1] - 1, thesisOutlineExam_text[0], 0, 0, 0))
            if (thesisOutlineExam_date == "Invalid Date" || thesis['วันที่สอบเค้าโครง'] == '') thesisOutlineExam_date = null

            let thesisExam_text = thesis['วันที่สอบวิทยานิพนธ์'].split('/')
            let thesisExam_date = new Date(Date.UTC(parseInt(thesisExam_text[2]) - 543, thesisExam_text[1] - 1, thesisExam_text[0], 0, 0, 0))
            if (thesisExam_date == "Invalid Date" || thesis['วันที่สอบวิทยานิพนธ์'] == '') thesisExam_date = null

            let graduation_text = thesis['วันที่สำเร็จการศึกษา'].split('/')
            let graduation_date = new Date(Date.UTC(parseInt(graduation_text[2]) - 543, graduation_text[1] - 1, graduation_text[0], 0, 0, 0))
            if (graduation_date == "Invalid Date" || thesis['วันที่สำเร็จการศึกษา'] == '') graduation_date = null

            let yearOfAdmissionNum = null
            if (thesis['รหัสประจำตัวเอาไว้ลิงค์กับผลงานวิจัย'] != "") {
                try {
                    yearOfAdmissionNum = parseInt('25' + thesis['รหัสประจำตัวเอาไว้ลิงค์กับผลงานวิจัย'].substring(0, 2)) - 543
                }
                catch (e) {
                    yearOfAdmissionNum = null
                }
            }

            let thesisObject = {
                show: true,
                student: {
                    studentName_TH: thesis['ชื่อนามสกุลนักศึกษา'],
                    studentName_EN: thesis['ชื่อนามสกุลนักศึกษาen'],
                    studentId: thesis['รหัสประจำตัวเอาไว้ลิงค์กับผลงานวิจัย'],
                    yearOfAdmission: yearOfAdmissionNum,
                    masterDegreeCourse: thesis['หลักสูตรป.โท'],
                    doctorDegreeCourse: thesis['หลักสูตรป.เอก'],
                },
                thesisName_TH: thesis['ชื่อหัวข้อวิทยานิพนธ์ภาษาไทย'],
                thesisName_EN: thesis['ชื่อหัวข้อวิทยานิพนธ์ภาษาอังกฤษ'],
                coInstructor: [thesis['ชื่ออาจารย์ที่ปรึกษาร่วม1'], thesis['ชื่ออาจารย์ที่ปรึกษาร่วม2']],
                chairman: thesis['ประธาน'],
                committee: [thesis['กรรมการ1'], thesis['กรรมการ2'], thesis['กรรมการ3']],
                qeTestDate: qeTestDate_date,
                qeTestDateText: Simplifier.simpliflied_date(qeTestDate_date),
                instructorAssignDate: instructorAssignDate_date,
                instructorAssignDateText: Simplifier.simpliflied_date(instructorAssignDate_date),
                thesisTopicProposal: thesisTopicProposal_date,
                thesisTopicProposalText: Simplifier.simpliflied_date(thesisTopicProposal_date),
                thesisTopicAnnounce: thesisTopicAnnounce_date,
                thesisTopicAnnounceText: Simplifier.simpliflied_date(thesisTopicAnnounce_date),
                thesisOutlineExam: thesisOutlineExam_date,
                thesisOutlineExamText: Simplifier.simpliflied_date(thesisOutlineExam_date),
                thesisExam: thesisExam_date,
                thesisExamText: Simplifier.simpliflied_date(thesisExam_date),
                graduation: graduation_date,
                graduationText: Simplifier.simpliflied_date(graduation_date)
            }
            // if (index==9){
            //     console.log(thesisObject)
            // }
            Thesis_Control.upsertThesisFromSheet(thesis['เลขบัตรประชาชน'], thesisObject, (code, err, data) => {
                console.log(`Thesis#${index} (${thesis['ชื่อหัวข้อวิทยานิพนธ์ภาษาไทย'].substring(0, 15)}...) scrapped successfully`)

                scrapCounter++
                if (scrapCounter >= rows.length) {
                    callback("001", "OK", null)
                }
            })
        });
    });
}

let config = require("../../config/config.js")
if (config.needReScrape) {
    console.log('reScraping is true... scraping')
    reScraping((code, err, data) => {
        console.log(JSON.stringify(data))
    });
}
else {
    console.log('reScraping is false... not need to do it')
}

var express = require('express');
var router = express.Router();

router.get('/reScraping/', function (request, response) { //ตัวอย่าง API ที่มีรูปมาด้วย
    reScraping((code, err, data) => {
        Return.responseWithCode(ReturnCode.success, data, response);
    });
});

const requestFirer = require("request");
var ObjectId = require('mongodb').ObjectId;
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

router.get('/reScraping_scorpus/', function (request, response) {
    response.json({ needWait: true })
    console.log("reScrapeElsvier")
    let query = { scorpusId: { $ne: null } }
    let projection = { _id: 1, scorpusId: 1 }

    Researcher.find(query, projection, function (error, researcherResponse) {
        if (error) {
            var alert = "[func. reScraping_scorpus] Error in finding Researcher Error: " + error.message;
            callback("171", alert, null)
        } else {

            let count = 0
            researcherResponse.forEach((researcher, index) => {
                // console.log(`${researcher.scorpusId} ${index} is waiting `)
                if (researcher.scorpusId != "") {
                    let example = false

                    setTimeout(function () {

                        let options = {
                            jar: true,
                            uri: encodeURI(`https://www.scopus.com/authid/detail.uri?authorId=${researcher.scorpusId}`),
                            header: {
                                "User-Agent": "Super Agent/0.0.1",
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            // form: form,
                            method: "GET",
                        };

                        requestFirer(options, function (error, response, body) {
                            try {
                                let now = new Date()

                                let dom = new JSDOM(body);
                                // console.log(dom.window.document.querySelector("#authorDetailsDocumentsByAuthor > div.panel-body > div > span").textContent)

                                let elsvierData = {
                                    'elsvierData': {
                                        'documentCount': dom.window.document.querySelector("#authorDetailsDocumentsByAuthor > div.panel-body > div > span") ? dom.window.document.querySelector("#authorDetailsDocumentsByAuthor > div.panel-body > div > span").textContent : 0,
                                        'citedByCount': dom.window.document.querySelector("#totalCiteCount") ? (dom.window.document.querySelector("#totalCiteCount").textContent != '' ? dom.window.document.querySelector("#totalCiteCount").textContent : 0) : 0,
                                        'citationCount': dom.window.document.querySelector("#authorDetailsTotalCitations > div.panel-body > div > span.btnText") ? dom.window.document.querySelector("#authorDetailsTotalCitations > div.panel-body > div > span.btnText").textContent : 0,
                                        'hIndex': dom.window.document.querySelector("#authorDetailsHindex > div.panel-body > div > span") ? dom.window.document.querySelector("#authorDetailsHindex > div.panel-body > div > span").textContent : 0,
                                        'updateDate': Simplifier.simpliflied_date(now)
                                    }
                                }
                                console.log(researcher.scorpusId)
                                console.log(elsvierData)

                                if (!error && response.statusCode == 200) {
                                    // console.log()
                                    Researcher.updateOne({ 'scorpusId': researcher.scorpusId }, {
                                        '$set': elsvierData

                                    }, function (error, researcherResponse) {
                                        console.log('scorpusId', researcher.scorpusId, `'s elsvier data is updated successfully`)
                                    })
                                }
                            }
                            catch (err) {
                                console.log("ERR", researcher.scorpusId, err)
                                // console.log('scorpusId', researcher.scorpusId, `'s elsvier data CANNOT be updated`, body)
                            }
                        });
                    }, index * 2000)
                }
                // }
            });
        }
    });
});

router.get('/reScraping_picHost/', function (request, response) {
    response.json({ needWait: true })
    console.log("reScraping_picHost")
    let query = { /*scorpusId: { $ne: null }*/ }
    let projection = { _id: 1, researcherPicture: 1 }

    Researcher.find(query, projection, function (error, researcherResponse) {
        if (error) {
            var alert = "[func. reScraping_scorpus] Error in finding Researcher Error: " + error.message;
            callback("171", alert, null)
        } else {

            let count = 0
            researcherResponse.forEach((researcher, index) => {
                // console.log(`${researcher.scorpusId} ${index} is waiting `)
                if (researcher.researcherPicture != "" && researcher.researcherPicture) {
                    // let example = false
                    let newResearchPicURL = researcher.researcherPicture.replace(/\:5713\//ig, "/uploads/")
                    Researcher.updateOne({ '_id': new ObjectId(researcher._id) }, {
                        '$set': {
                            researcherPicture: newResearchPicURL
                        }

                    }, function (error, researcherResponse) {
                        console.log('_id', researcher._id, `'s picture URL is updated successfully`)
                    })

                }
                // }
            });
        }
    });
});

module.exports = router;

// var scheduler = require('node-schedule');
// let rule2 = new scheduler.RecurrenceRule();
// rule2.dayOfWeek = 4
// rule2.hour = 0
// rule2.minute = 0
// console.log("SETting UP GoogleSheet scrapper")
// let j2 = scheduler.scheduleJob(rule2, function () {
//     console.log("EXECUTING GoogleSheet scrapper")
//     reScraping((code, err, data) => {
//         console.log(JSON.stringify(data))
//     });
// });