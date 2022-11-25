function expandNote(nid) {
    $(".note-background").show()
    $(".n-" + nid).css("z-index", "2")
    $(".n-" + nid).css("box-shadow", "none")
    $(".n-" + nid).css('font-size','+=8');
    $(".aw-" + nid).addClass("note-selected")
    $(".nc-" + nid).show(300)
    $(".sm-" + nid).hide()
    $(".sl-" + nid).show()
}

function collapseNote(nid) {
    $(".note-background").hide()
    $(".ntdel-" + nid).hide()
    $(".nc-" + nid).hide(300)
    $(".n-" + nid).css("position", "relative")
    $(".aw-" + nid).removeClass("note-selected")
    $(".n-" + nid).css("z-index", "0")
    $(".n-" + nid).css("box-shadow", "5px 5px 5px black")
    $(".n-" + nid).css('font-size','-=8');
    $(".sm-" + nid).show()
    $(".sl-" + nid).hide()
    $(".note-content").hide()
    $(".note-alt-content").hide()
}

function deleteNote(nid) {
    $(".note-content").hide()
    $(".note-alt-content").hide()

    $(".ntdel-" + nid).show(300)

}

function editNote(nid) {
    $(".note-content").hide()
    $(".note-alt-content").hide()

    $(".ntedit-" + nid).show(300)
}