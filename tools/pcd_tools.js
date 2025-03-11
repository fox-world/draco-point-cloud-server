const convertPcdToPlyData = (line) => {
    let data = line.split(/\s/)
    if (data.length != 4) {
        return null;
    }
    for (let i = 0; i < 4; i++) {
        if (!isNumeric(data[i])) {
            return null;
        }
    }
    return data[0] + " " + data[1] + " " + data[2];
}

const isNumeric = (str) => {
    if (typeof str != "string") {
        return false;
    }
    return !isNaN(str) && !isNaN(parseFloat(str));
}

module.exports = {
    isNumeric, convertPcdToPlyData
}