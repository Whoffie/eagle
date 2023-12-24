console.log("BEFORE READY");

$(document).ready(function() {
    console.log("READY");
    var date = new Date();
    var year = date.getFullYear();

    $("#yearSelect option:contains('" + year + "')").prop("selected", true);

    console.log("DONE");
});