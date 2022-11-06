var getUrlParameter = function getUrlParameter(sParam) { /* https://stackoverflow.com/a/21903119/9339963 */
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
    return false;
}

function groupDelete(gid) {
    $(".modal-" + gid).show(300)
    $(".inner-" + gid).show()
}

function gdelClose(gid) {
    $(".inner-edit-" + gid).hide()
    $(".modal-edit-" + gid).hide()
}

function groupEdit(gid) {
    $(".modal-edit-" + gid).show(300)
    $(".inner-edit-" + gid).show()

    window.history.replaceState({}, document.title, "/dashboard/users?modal=gedit&gid=" + gid)
}

function geditClose(gid) {
    $(".inner-edit-" + gid).hide()
    $(".modal-edit-" + gid).hide()

    window.history.replaceState({}, document.title, "/dashboard/users")
}

function userDelete(uid) {
    $(".user-modal-" + uid).show(300)
    $(".user-inner-" + uid).show()    
}

function udelClose(uid) {
    $(".user-inner-" + uid).hide()
    $(".user-modal-" + uid).hide()
}

function userEdit(uid) {
    $(".user-modal-edit-" + uid).show(300)
    $(".user-inner-edit-" + uid).show()
    
    window.history.replaceState({}, document.title, "/dashboard/users?modal=uedit&uid=" + uid)
}

function ueditClose(uid) {
    $(".user-inner-edit-" + uid).hide()
    $(".user-modal-edit-" + uid).hide()

    window.history.replaceState({}, document.title, "/dashboard/users")
}

function actualModal(uid) {
    $(".actual-modal-" + uid).show(300)
    $(".actual-inner-" + uid).show()
}

function actualClose(uid) {
    $(".actual-modal-" + uid).hide()
    $(".actual-inner-" + uid).hide()
}

function notesModal(uid) {
    $(".notes-modal-" + uid).show(300)
    $(".notes-inner-" + uid).show()
}

function notesClose(uid) {
    $(".notes-modal-" + uid).hide()
    $(".notes-inner-" + uid).hide()
}

function settingsModal(page) {
    $("#settings").show(300) 
    $("#settings-inner").show()

    if (page == 0) {
        window.history.replaceState({}, document.title, "/dashboard?modal=settings")
    }else {
        window.history.replaceState({}, document.title, "/dashboard/users?modal=settings")
    }
}

function settingsClose(page) { /* close action for dashboard */
    $("#settings").hide()
    $("#settings-inner").hide()

    if (page == 0) {
        window.history.replaceState({}, document.title, "/dashboard")
    }else {
        window.history.replaceState({}, document.title, "/dashboard/users")
    } 
}

$(document).ready(function() { // restore modal states    
    if (getUrlParameter("modal") == "settings") {
        $("#settings").show() 
        $("#settings-inner").show()
    }

    if (getUrlParameter("modal") == "uedit") {
        $(".user-modal-edit-" + getUrlParameter("uid")).show()
        $(".user-inner-edit-" + getUrlParameter("uid")).show()
    }

    if (getUrlParameter("modal") == "gedit") {
        $(".modal-edit-" + getUrlParameter("gid")).show()
        $(".inner-edit-" + getUrlParameter("gid")).show()
    }
})