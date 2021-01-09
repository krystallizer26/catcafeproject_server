var ObjectId = require('mongodb').ObjectId;

module.exports = {
    requiredData_Check: function(requiredInput) {
        //console.log("Checking Data.. Length=" + requiredInput.length);
        //console.log(requiredInput.toString());
        let nullNotFounded = true;
        for (var i = 0; i < requiredInput.length; i++) {
            //console.log("Checking.. @"+i+":" +requiredInput[i]);
            if (requiredInput[i] == null) {
                console.log(i + " is null >> " + requiredInput[i])
                nullNotFounded = false;
                break;
            } else if (requiredInput[i].length < 1) {
                console.log(i + " is null >> " + requiredInput[i])
                nullNotFounded = false;
                break;
            }
        }
        return (nullNotFounded);
    },
    booleanData_Check: function(requiredInput) {
        //console.log("Checking Data.. Length=" + requiredInput.length);
        //console.log(requiredInput.toString());
        let wrongNotFounded = true;
        for (var i = 0; i < requiredInput.length; i++) {
            //console.log("Checking.. @"+i+":" +requiredInput[i]);
            if (requiredInput[i] != null) {
                if (requiredInput[i] != "true" && requiredInput[i] != "false") {
                    wrongNotFounded = false;
                    break;
                }
            }
        }
        return (wrongNotFounded);
    },
    objectIDData_Check: function(requiredInput) {
        //console.log("Checking Data.. Length=" + requiredInput.length);
        //console.log(requiredInput.toString());
        let wrongNotFounded = true;
        for (var i = 0; i < requiredInput.length; i++) {
            //console.log("Checking.. @"+i+":" +requiredInput[i]);
            if (!ObjectId.isValid(requiredInput[i])) {
                wrongNotFounded = false;
                break;
            }
        }
        return (wrongNotFounded);
    },
    numberData_Check: function(requiredInput) {
        //console.log("Checking Data.. Length=" + requiredInput.length);
        //console.log(requiredInput.toString());
        let wrongNotFounded = true;
        for (var i = 0; i < requiredInput.length; i++) {
            //console.log("Checking.. @"+i+":" +requiredInput[i]);
            if (isNaN(requiredInput[i])) {
                wrongNotFounded = false;
                break;
            }
        }
        return (wrongNotFounded);
    },
    isoDateData_Check: function(requiredInput) {
        //console.log("Checking Data.. Length=" + requiredInput.length);
        //console.log(requiredInput.toString());
        let wrongNotFounded = true;
        for (var i = 0; i < requiredInput.length; i++) {
            // console.log(new Date(requiredInput[i]));
            //console.log("Checking.. @"+i+":" +requiredInput[i]);
            if ("Invalid Date" == new Date(requiredInput[i])) {
                wrongNotFounded = false;
                break;
            }
        }
        return (wrongNotFounded);
    }
    ,jsonObjData_Check: function(requiredInput) {
        //console.log("Checking Data.. Length=" + requiredInput.length);
        //console.log(requiredInput.toString());
        let wrongNotFounded = true;
        for (var i = 0; i < requiredInput.length; i++) {
            // console.log(requiredInput[i])
            // console.log( JSON.parse(requiredInput[i]))
            // console.log(new Date(requiredInput[i]));
            //console.log("Checking.. @"+i+":" +requiredInput[i]);
            try {
                JSON.parse(requiredInput[i]);
            } catch (e) {
                // console.log(e)
                wrongNotFounded = false;
                break;
            }
        }
        return (wrongNotFounded);
    }
};