let monthNameTH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]

module.exports = {
    simpliflied_date: function (date) {
        let resultDate = {
            christDate: null,
            buddhistDate: null
        }
        if (new Date(date) == "Invalid Date" || date == null) {
            return (resultDate)
        }
        else {
            let date_obj = new Date(date)
            resultDate.christDate = (date_obj.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }));
            resultDate.buddhistDate = date_obj.getDate() + " " + monthNameTH[date_obj.getMonth()] + " " + (date_obj.getFullYear() + 543)
            return resultDate
        }
    },
    simpliflied_duration: function (dateStart, dateFinish) {
        let resultDate = {
            christDate: null,
            buddhistDate: null
        }

        if ((new Date(dateStart) == "Invalid Date" && new Date(dateFinish) == "Invalid Date") ||( dateStart == null && dateFinish == null)) {
            return (resultDate)
        }
        else if (new Date(dateFinish) == "Invalid Date" || dateStart == null ) {
            let dateStart_obj = new Date(dateStart)
            resultDate.christDate = (dateStart_obj.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) + " - On going." );
            resultDate.buddhistDate = dateStart_obj.getDate() + " " + monthNameTH[dateStart_obj.getMonth()] + " - ยังไม่สิ้นสุด"
            return resultDate
        }
        else {
            let dateStart_obj = new Date(dateStart)
            let dateFinish_obj = new Date(dateFinish)
            resultDate.christDate = (dateStart_obj.toLocaleDateString('en-GB', { month: 'long', day: 'numeric' }) + " - " + dateFinish_obj.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }));
            resultDate.buddhistDate = dateStart_obj.getDate() + " " + monthNameTH[dateStart_obj.getMonth()] + " - " + dateFinish_obj.getDate() + " " + monthNameTH[dateFinish_obj.getMonth()] + " " + (dateFinish_obj.getFullYear() + 543)
            return resultDate
        }
    },
    simpliflied_dateArray: function (dateArray) {
        let resultDate = {
            christDate: [],
            buddhistDate: []
        }
        dateArray.forEach((eachDate, index) => {
            if (new Date(eachDate) == "Invalid Date" || eachDate == null) {
                resultDate.christDate[index] = null
                resultDate.buddhistDate[index] = null
            }
            else {
                let date_obj = new Date(eachDate)
                resultDate.christDate[index] = (date_obj.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }));
                resultDate.buddhistDate[index] = date_obj.getDate() + " " + monthNameTH[date_obj.getMonth()] + " " + (date_obj.getFullYear() + 543)
            }
        });
        return resultDate
    }
};