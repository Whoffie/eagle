function groupDelete(gid) {
    $(".modal-" + gid).show(300, function() {
        $(".inner-" + gid).show(300)
    })
    
}

function gdelClose(gid) {
    $(".inner-edit-" + gid).hide()
    $(".modal-edit-" + gid).hide()
}

function groupEdit(gid) {
    $(".modal-edit-" + gid).show(300, function() {
        $(".inner-edit-" + gid).show(300)
    })
    
}

function geditClose(gid) {
    $(".inner-edit-" + gid).hide()
    $(".modal-edit-" + gid).hide()
}

function userDelete(uid) {
    $(".user-modal-" + uid).show(300, function() {
        $(".user-inner-" + uid).show(300)
    })
    
}

function udelClose(uid) {
    $(".user-inner-" + uid).hide()
    $(".user-modal-" + uid).hide()
}

function userEdit(uid) {
    $(".user-modal-edit-" + uid).show(300, function() {
        $(".user-inner-edit-" + uid).show(300)
    })
    
}

function ueditClose(uid) {
    $(".user-inner-edit-" + uid).hide()
    $(".user-modal-edit-" + uid).hide()
}

function actualModal(uid) {
    $(".actual-modal-" + uid).show(300, function() {
        $(".actual-inner-" + uid).show(300)
    })
}

function actualClose(uid) {
    $(".actual-modal-" + uid).hide()
    $(".actual-inner-" + uid).hide()
}