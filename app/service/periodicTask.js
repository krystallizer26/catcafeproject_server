const request = require("request");

var Researcher = require('../model/researcher_model.js');
let query = { scorpusId: { $ne: null } }
let projection = { _id: 1, scorpusId: 1 }

let Simplifier = require('../../app/service/simplifier.js');


module.exports = {
    reScrapeElsvier: function () {
        
        let count = 0
        researcherResponse.forEach((researcher, index) => {
            // console.log(`${researcher.scorpusId} ${index} is waiting `)
            if (researcher.scorpusId != "") {

                let url = encodeURI(`https://www.scopus.com/authid/detail.uri?authorId=${researcher.scorpusId}`)
                console.log(url)
                let options = {
                    jar: true,
                    uri: url,
                    header: {
                        "User-Agent": "Super Agent/0.0.1",
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    // form: form,
                    method: "GET",
                };

                let example = false

                // if(!example)
                // {   example = true
                setTimeout(function () {
                    requestFirer(options, function (error, response, body) {
                        try {
                            let now = new Date()

                            let dom = new JSDOM(body);
                            // console.log(dom.window.document.querySelector("#authorDetailsDocumentsByAuthor > div.panel-body > div > span").textContent)

                            let elsvierData = {
                                'elsvierData': {
                                    'documentCount': dom.window.document.querySelector("#authorDetailsDocumentsByAuthor > div.panel-body > div > span") ? dom.window.document.querySelector("#authorDetailsDocumentsByAuthor > div.panel-body > div > span").textContent : 'N/A',
                                    'citedByCount': dom.window.document.querySelector("#totalCiteCount") ? dom.window.document.querySelector("#totalCiteCount").textContent : null,
                                    'citationCount': dom.window.document.querySelector("#authorDetailsTotalCitations > div.panel-body > div > span.btnText") ? dom.window.document.querySelector("#authorDetailsTotalCitations > div.panel-body > div > span.btnText").textContent : null,
                                    'hIndex': dom.window.document.querySelector("#authorDetailsHindex > div.panel-body > div > span") ? dom.window.document.querySelector("#authorDetailsHindex > div.panel-body > div > span").textContent : null,
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
                }, 0)
            }
            // }
        });
    }
}
