module.exports = {
    responseWithCode: function (codeNum, txt, response) {
        console.log("** Response         >> " + txt);
        response.json({ code: codeNum, message: txt });
    },
    responseWithCodeAndData: function (codeNum, txt, data, response) {
        console.log("** Response message >> " + txt + " codeNum >> " + codeNum);
        response.json({ code: codeNum, message: txt, data: data });
    },
    responseWithCodeAndDataAndTotalRecord: function (codeNum, txt, data, response, totalRecord, pageNum, DataSize) {
        console.log("** Response message >> " + txt + " data >> " + JSON.stringify(data) + "pageNumber >> " + pageNum + "pageSize >> " + DataSize + "totalRecord >> " + totalRecord);
        response.json({ code: codeNum, message: txt, data: data, totalRecord: totalRecord, pageNumber: pageNum, pageSize: DataSize });
    },
    responsePattern: function (httpCode, codeNum, txt, data, jwtExtraction, response) {
        response.status(httpCode).json({ code: codeNum, message: txt, jwtExtraction: jwtExtraction, datas: data });
    }
};