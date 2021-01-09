var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var typeObjectId = mongoose.Schema.Types.ObjectId;

var Researcher_Schema = new Schema({
    show: { type: Boolean, default: true },
    tmp: { type: String, default: null },
    researcherPicture: { type: String, default: null },
    researcherName_TH: { type: String, required: true },
    researcherName_EN: { type: String, required: true },
    scorpusId: { type: String, default: null },
    citizenId: { type: String, default: null },
    elsvierData: {
        documentCount: { type: String, default: null },
        citedByCount: { type: String, default: null },
        citationCount: { type: String, default: null },
        hIndex: { type: String, default: null },
        updateDate: {
            christDate: { type: String, default: null },
            buddhistDate: { type: String, default: null }
        }
    },
    department: {
        name_TH: { type: String, default: null },
        name_EN: { type: String, default: null },
    },
    academicPosition: { type: String, default: null },
    bachelorDegree: {
        degreeName_TH: { type: String, default: null },
        degreeName_EN: { type: String, default: null },
        graduationYear: { type: String, default: null },
        universityName_TH: { type: String, default: null },
        universityName_EN: { type: String, default: null },
        universityCountry_TH: { type: String, default: null },
        universityCountry_EN: { type: String, default: null }
    },
    masterDegree: {
        degreeName_TH: { type: String, default: null },
        degreeName_EN: { type: String, default: null },
        graduationYear: { type: String, default: null },
        universityName_TH: { type: String, default: null },
        universityName_EN: { type: String, default: null },
        universityCountry_TH: { type: String, default: null },
        universityCountry_EN: { type: String, default: null }
    },
    doctorDegree: {
        degreeName_TH: { type: String, default: null },
        degreeName_EN: { type: String, default: null },
        graduationYear: { type: String, default: null },
        universityName_TH: { type: String, default: null },
        universityName_EN: { type: String, default: null },
        universityCountry_TH: { type: String, default: null },
        universityCountry_EN: { type: String, default: null }
    },
    birthDate: { type: Date, default: null },
    birthDateText: {
        christDate: { type: String, default: null },
        buddhistDate: { type: String, default: null }
    },
    assignDate: { type: Date, default: null },
    assignDateText: {
        christDate: { type: String, default: null },
        buddhistDate: { type: String, default: null }
    },
    retiredDate: { type: Date, default: null },
    retiredDateText: {
        christDate: { type: String, default: null },
        buddhistDate: { type: String, default: null }
    },
    instructor: [
        {
            name: { type: String, default: null },
            link: { type: String, default: null },
            degree: { type: String, default: null }
        }
    ],
    targetIndustry_TH: { type: String, default: null },
    targetIndustry_EN: { type: String, default: null },
    keywords_TH: { type: [String], default: [] },
    keywords_EN: { type: [String], default: [] },
    internalPhone: { type: String, default: null },
    mobilePhone: { type: String, default: null },
    email: { type: String, default: null, unique: true },
    room_TH: { type: String, default: null },
    room_EN: { type: String, default: null },
    facebook: {
        name: { type: String, default: null },
        link: { type: String, default: null }
    },
    twitter: {
        name: { type: String, default: null },
        link: { type: String, default: null }
    },
    instragram: {
        name: { type: String, default: null },
        link: { type: String, default: null }
    },
    line: {
        name: { type: String, default: null },
        link: { type: String, default: null }
    },
    youtube: {
        name: { type: String, default: null },
        link: { type: String, default: null }
    },
    linkedIn: {
        name: { type: String, default: null },
        link: { type: String, default: null }
    },
    personalSite: {
        name: { type: String, default: null },
        link: { type: String, default: null }
    },
    insignia: { type: [String], default: null },
    course: [
        {
            name: { type: String, default: null },
            url: { type: String, default: null }
        }
    ],
    dateTime_create: { type: Date, default: Date.now },
    dateTime_lastEdit: { type: Date, default: Date.now },

    publication: [
        {
            show: { type: Boolean, default: true },
            name: { type: String, default: null },
            publicationLocation: { type: String, default: null },
            owner: { type: String, default: null },
            volumn: { type: String, default: null },
            page: { type: String, default: null },
            conferenceLocation: { type: String, default: null },
            conferenceStartDate: { type: Date, default: null },
            conferenceFinishDate: { type: Date, default: null },
            conferenceDurationText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            bookPublisher: { type: String, default: null },
            bookPublishingLocation: { type: String, default: null },
            year: { type: String, default: null },
            year_buddhist: { type: String, default: null },
            publicationLevel: { type: String, default: null },
            databaseType: { type: String, default: null },
            doi: { type: String, default: null },
            impactFactor: { type: String, default: null },
            quartile_sjr: { type: String, default: null },
            quartile_webOfScience: { type: String, default: null },
            weight: { type: String, default: null },
            remark: { type: String, default: null },
            studentId:{ type: String, default: null }
        }
    ],

    thesis: [
        {
            show: { type: Boolean, default: true },
            thesisName_TH: { type: String, default: null },
            thesisName_EN: { type: String, default: null },
            student: {
                studentName_TH: { type: String, default: null },
                studentName_EN: { type: String, default: null },
                studentId: { type: String, default: null },
                masterDegreeCourse: { type: String, default: null },
                doctorDegreeCourse: { type: String, default: null },
                yearOfAdmission: { type: String, default: null },
            },
            coInstructor: { type: [String], default: null },
            chairman: { type: String, default: null },
            committee: { type: [String], default: null },
            qeTestDate: { type: Date, default: null },
            qeTestDateText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            instructorAssignDate: { type: Date, default: null },
            instructorAssignDateText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            thesisTopicProposal: { type: Date, default: null },
            thesisTopicProposalText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            thesisTopicAnnounce: { type: Date, default: null },
            thesisTopicAnnounceText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            thesisOutlineExam: { type: Date, default: null },
            thesisOutlineExamText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            thesisExam: { type: Date, default: null },
            thesisExamText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            graduation: { type: Date, default: null },
            graduationText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            }
        }
    ],

    reward: [
        {
            show: { type: Boolean, default: true },
            name: { type: String, default: null },
            work: { type: String, default: null },
            announceLocation_TH: { type: String, default: null },
            announceLocation_EN: { type: String, default: null },
            organizer: { type: String, default: null },
            location: { type: String, default: null },
            country: { type: String, default: null },
            year_buddhist: { type: String, default: null },
            recieveDate: { type: Date, default: null },
            recieveDateText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            ranking_TH: { type: String, default: null },
            ranking_EN: { type: String, default: null },
            student: { type: [String], default: [] }
        }
    ],

    intProp: [
        {
            show: { type: Boolean, default: true },
            name_TH: { type: String, default: null },
            name_EN: { type: String, default: null },
            applicationNo: { type: String, default: null },
            applyDate: { type: Date, default: null },
            applyDateText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            patentRegisterNo: { type: String, default: null },
            grantedDate: { type: Date, default: null },
            grantedDateText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            coverage: { type: String, default: null },
            applicant: { type: String, default: null },
            coInventor: { type: [String], default: [] }
        }
    ],

    develop: [
        {
            show: { type: Boolean, default: true },
            meetingName: { type: String, default: null },
            researchName: { type: String, default: null },
            organizer: { type: String, default: null },
            location: { type: String, default: null },
            country: { type: String, default: null },
            type: { type: String, default: null },
            level: { type: String, default: null },
            year_buddhist: { type: String, default: null },
            startDate: { type: Date, default: null },
            finishDate: { type: Date, default: null },
            durationText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            scholarType: { type: String, default: null },
            budget: { type: String, default: null },
            name_TH: { type: String, default: null },
            approveDate: { type: Date, default: null }
        }
    ],

    researchFund: [
        {
            show: { type: Boolean, default: true },
            researchName_TH: { type: String, default: null },
            researchName_EN: { type: String, default: null },
            fundName: { type: String, default: null },
            fundSource: { type: String, default: null },
            year_buddhist: { type: String, default: null },
            startDate: { type: Date, default: null },
            finishDate: { type: Date, default: null },
            durationText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            progress_6mDate: { type: Date, default: null },
            progress_6mText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            progress_6m: { type: String, default: null },
            progress_12mDate: { type: Date, default: null },
            progress_12mText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            progress_12m: { type: String, default: null },
            extension: { type: [Date], default: [] },
            extension_Text: {
                extensionDate: { type: [String], default: null },
                buddhistDate: { type: [String], default: null }
            },
            completeSubmission: { type: Date, default: null },
            completeSubmissionText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            result: { type: [String], default: [] },
            projectClose: { type: Date, default: null },
            projectCloseText: {
                christDate: { type: String, default: null },
                buddhistDate: { type: String, default: null }
            },
            yearExtension: { type: String, default: null },
            yearContinuous: { type: String, default: null },
            wholeBudget: { type: Number, default: null },
            ratio: { type: String, default: null },
            role: { type: String, default: null },
            supportFund: [{
                name: { type: String, default: null },
                type: { type: String, default: null },
                amount: { type: Number, default: null }
            }
            ],
            remark: { type: String, default: null }
        }
    ],
    updateLog: [{
        isSelfSeen: { type: Boolean, default: false },
        isSeenBy: { type: [typeObjectId], default: [] },
        dataType: { type: String, default: null }, //publication, reward, thesis, ...
        dataId: { type: typeObjectId, default: null }, //not null if update
        updateType: { type: String, default: null }, //new update etc.
        updateStatus: { type: String, default: null }, //reject pending accept
        updateDetails: { type: Object, default: null }, //fields
        requestDateTime: { type: Date, required: true }, //datetime of this updateLog is issued
        updateStatusChangeDateTime: { type: Date, default: null }, //updateStatus from pending to 'accept' or 'reject'
        requestBy: { type: String, default: null },
        executeBy: { type: String, default: null }
    }]
});

Researcher_Schema.index({ researcherName_TH: 1 });
Researcher_Schema.index({ researcherName_EN: 1 });
Researcher_Schema.index({ dateTime_lastEdit: 1 });
module.exports = mongoose.model('Researcher', Researcher_Schema);

// {
//     "_id": "_id","positionName" : "positionName","dateTime_create" : "dateTime_create"
// }