const express = require("express")
const app = express()
const hbs = require("hbs")
const sql = require("mysql")
const session = require("express-session")
const sqlStore = require("express-mysql-session")(session)
const bcrypt = require("bcrypt")
const port = 80
const { resolve } = require("path");

con = sql.createConnection({ // credentials for connection to database
    host: "localhost",
    user: "root",
    password: "#Lego1031#",
    database: "eagle"
})

con.connect() // initialize db connection

/* Handlebars helpers */

hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this)
})

const sqlSession = new sqlStore({ // for session storing (so the website remembers you and gains the ability to store session variables)
    connectionLimit: 10,
    password: "#Lego1031#",
    user: "root",
    database: "eagle",
    host: "localhost",
    port: 3306,
    createDatabaseTable: true
})

app.use(session({ // 
    name: "session",
    secret: "2p4gj2pig4j2p4gjiipj", // random
    saveUninitialized: false,
    resave: false,
    store: sqlSession,
    cookie: { maxAge: 3600000, secure: false, httpOnly: true } // cookies are only stored for an hour (see maxAge)-- once timeout is reached user cannot perform any actions and must login again
}))

app.set("view engine", "hbs") // Use handlebars as our view engine
app.use(express.static("views")) // Frontend files live in /views
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get("/", (req, res) => {
    if (req.session.auth == true && req.session.uid !== null) {
        res.redirect("/dashboard")
    }else {
        if (!req.session.success) {
            res.render("login")
        }else {
            res.render("login", { success: req.session.success })
            req.session.success = null
        }
    }
})

app.get("/register", (req, res) => {
    var stmt = "SELECT * FROM `usergroups` ORDER BY `groupName` ASC"

    con.query(stmt, (err, groups) => {
        res.render("register", { userGroup: groups })
    })
})

/* USER ACTIONS */

app.post("/login", (req, res) => {
    var stmt = "SELECT `email` FROM `userdata` WHERE `email`=?"

    con.query(stmt, [req.body.email], (err, val) => {
        if (val.length !== 0) {
            var stmt = "SELECT `id`, `password` FROM `userdata` WHERE `email`=?"

            con.query(stmt, [req.body.email], (err, val) => {
                bcrypt.compare(req.body.password, val[0]?.password, function(err, result) {
                    if (result == true) {
                        var stmt = "SELECT `activated`, `admin` FROM `userdata` WHERE `id`='?'"

                        con.query(stmt, [val[0].id], (err, userAttributes) => {
                            if (userAttributes[0].activated == 1) {
                                req.session.auth = true
                                req.session.uid = val[0].id
                                
                                if (userAttributes[0].admin) {
                                    req.session.admin = true
                                }

                                res.redirect("dashboard")
                            }else {
                                res.render("login", { error: "This user has not yet been approved by this website's administrator. Please try again later." })
                            }
                        })
                    }else {
                        res.render("login", { error: "Incorrect email or password" })
                    }
                })
            })
        }else { 
            res.render("login", { error: "Incorrect email or password" })
        }
    })
})

/* Register a new user */

app.post("/register", (req, res) => {
    var stmt = "SELECT * FROM `userdata` WHERE `email`=?"

    con.query(stmt, [req.body.email], (err, val) => {
        if (val.length !== 0) {
            var stmt = "SELECT * FROM `usergroups` ORDER BY `groupName` ASC"

            con.query(stmt, (err, groups) => {
                res.render("register", { error: "This email already exists", userGroups: groups }) // TODO: CHANGE ERROR MESSAGE TO BE SESSION VARIABLE BASED
            })
        }else {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
            var saltWork = 10
            bcrypt.hash(req.body.password, saltWork, (err, hash) => {
                var stmt = "SELECT `groupName` FROM `usergroups` WHERE `id`=?"

                con.query(stmt, [req.body.group], (err, groupName) => {
                    if (req.body.address2 !== null) {
                        var stmt = "INSERT INTO `userdata` (`firstName`, `lastName`, `address`, `address2`, `city`, `state`, `zipcode`, `phoneNumber`, `email`, `password`, `userGroup`, `groupName`, `activated`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                        con.query(stmt, [req.body.fName, req.body.lName, req.body.address, req.body.address2, req.body.city, req.body.state, req.body.zipcode, req.body.phone, req.body.email, hash, req.body.group, groupName[0].groupName, 0])
                        
                        req.session.success = "User has successfully been created!"
                        res.redirect("/")
                    }else {
                        var stmt = "INSERT INTO `userdata` (`firstName`, `lastName`, `address`, `city`, `state`, `zipcode`, `phoneNumber`, `email`, `password`, `userGroup`, `groupName`, `activated`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                        con.query(stmt, [req.body.fName, req.body.lName, req.body.address, req.body.city, req.body.state, req.body.zipcode, req.body.phone, req.body.email, hash, req.body.group, groupName[0].groupName, 0])
                        
                        req.session.success = "User has successfully been created!"
                        res.redirect("/")           
                    }
                })
            })
        }
    })
})

app.get("/dashboard", (req, res) => {
    if (req.session.auth == true && req.session.uid !== null) {
        var increment = 0 // reset increment on page reload
        var entryCount = 0 // keep track of rows in schedule table

        hbs.registerHelper("increment", function() {
            increment += 1
            return increment
        })

        var stmt = "SELECT `firstName` FROM `userdata` WHERE `id`=?"

        con.query(stmt, [req.session.uid], (err, val) => {
            var stmt = "SELECT * FROM `usergroups` ORDER BY `startDate`" // order by condoSide as well so table index is formatted correctly on frontend

            con.query(stmt, (err, groupNames) => {
                if (!req.session.filter) {
                    var stmt = "SELECT * FROM `schedule` ORDER BY `startDate` ASC, `condoSide`"

                    con.query(stmt, (err, scheduleData) => {
                        var stmt = "SELECT DISTINCT `year` FROM `schedule`"
    
                        con.query(stmt, (err, scheduleYears) => {
                            var yearList = []
                            let now = new Date() /* move current date to the top of the list */
    
                            for (let i = 0; i < scheduleYears.length; i++) {
                                if (parseInt(scheduleYears[i].year) !== now.getFullYear()) {
                                    yearList.push(scheduleYears[i].year) // push like normal
                                }else {
                                    yearList.unshift(scheduleYears[i].year) // move current year to the back if no default filter is selected
                                }
                            }

                            hbs.registerHelper("headingLoop", function() {
                                entryCount += 1
                    
                                if (entryCount == 14) {
                                    entryCount = 0
                    
                                    return new hbs.SafeString(`<tr class="heavy"><th>Week</th><th>From</th><th>To</th><th>Condo Side</th><th>Scheduled - ` + now.getFullYear() + `</th><th>Actual - ` + now.getFullYear() + `</th><th>Notes</th></tr>`)
                                }
                            })
    
                            res.render("dashboard", { firstName: val[0]?.firstName, scheduleData: scheduleData, userGroups: groupNames, year: yearList, setYear: now.getFullYear() })
                        })
                    })
                }else {
                    var stmt = "SELECT * FROM `schedule` WHERE `year`=? ORDER BY `startDate` ASC, `condoSide`"

                    con.query(stmt, [req.session.filter], (err, scheduleData) => {
                        var stmt = "SELECT DISTINCT `year` FROM `schedule`"
    
                        con.query(stmt, (err, scheduleYears) => {    
                            var yearList = []
                            let now = new Date()
    
                            for (let i = 0; i < scheduleYears.length; i++) {
                                yearList.push(scheduleYears[i].year)
                            }
                            
                            let yearIndex = yearList.indexOf(req.session.filter) // assume we've already generated the selected year
                            yearList.splice(yearIndex, 1)
                            yearList.unshift(req.session.filter)

                            let filterYear = req.session.filter
                            hbs.registerHelper("headingLoop", function() {
                                entryCount += 1
                    
                                if (entryCount == 14) {
                                    entryCount = 0
                                    return new hbs.SafeString(`<tr class="heavy"><th>Week</th><th>From</th><th>To</th><th>Condo Side</th><th>Scheduled - ` + filterYear + `</th><th>Actual - ` + filterYear + `</th><th>Notes</th></tr>`)
                                }
                            })
                            
                            res.render("dashboard", { firstName: val[0]?.firstName, scheduleData: scheduleData, userGroups: groupNames, year: yearList, setYear: req.session.filter })
                            req.session.filter = null // kill filter variable
                        })
                    })
                }
            })
        })
    }else {
        res.redirect("/")
    }
})

app.get("/user/add", (req, res) => {
    if (req.session.auth) {
        if (req.query.userID) {
            var stmt = "UPDATE `userdata` SET `activated`=1 WHERE `id`=?"

            con.query(stmt, [req.query.userID])
            res.redirect("/dashboard/users")
        }else {
            res.redirect("/dashboard/users")
        }
    }else {
        res.redirect("/")
    }
})

app.post("/user/edit", (req, res) => {
    if (req.session.auth) {        
        var stmt = "UPDATE `userdata` SET `firstName`=?, `lastName`=?, `address`=?, `address2`=?, `city`=?, `state`=?, `zipcode`=?, `phoneNumber`=?, `email`=?"

        con.query(stmt, [req.body.fname, req.body.lname, req.body.address, req.body.address2, req.body.city, req.body.state, req.body.zipcode, req.body.phone, req.body.email], (err, val) => {
            res.redirect("/dashboard/users")
        })
    }else {
        res.redirect("/")
    }
})

app.get("/user/delete", (req, res) => {
    if (req.session.auth) {
        if (req.query.userID) {
            var stmt = "DELETE FROM `userdata` WHERE `id`=?"

            con.query(stmt, [req.query.userID])
            res.redirect("/dashboard/users")
        }else {
            res.redirect("/dashboard/users")
        }
    }else {
        res.redirect("/")
    }
})

app.get("/logout", (req, res) => {
    if (req.session.auth == true) {
        req.session.auth = null
        req.session.uid = null
        req.session.admin = null

        res.redirect("/")
    }else {
        res.redirect("/")
    }
})

/* DASHBOARD */

app.get("/dashboard/users", (req, res) => {
    if (req.session.auth == true) {
        var sb_inc = -1
        var sk_inc = -1

        hbs.registerHelper("sb_increment", function() {
            sb_inc += 1
            return sb_inc
        })

        hbs.registerHelper("sk_increment", function() {
            sk_inc += 1
            return sk_inc
        })

        var stmt = "SELECT * FROM `userGroups` ORDER BY `groupName` ASC"

        con.query(stmt, (err, groupInfo) => {
            var stmt = "SELECT * FROM `userdata`"

            con.query(stmt, (err, userInfo) => {
                var stmt = "SELECT * FROM `userdata` WHERE `activated`=0"

                con.query(stmt, (err, val) => {
                    let futureYears = new Date()
                    let now = new Date() // so we can keep track of current year
                    let years = [] // initialize empty array

                    for (let i = 0; i < 5; i++) {
                        futureYears.setFullYear(now.getFullYear()) // reset so variable i works
                        futureYears.setFullYear(futureYears.getFullYear() + i)

                        years.push(futureYears.getFullYear())
                    }

                    if (val.length == 0) {
                        res.render("users", { userGroups: groupInfo, userInfo: userInfo, activated: userInfo[0]?.activated, selectYear: years})
                    }else {
                        res.render("users", { userGroups: groupInfo, userInfo: userInfo, activated: userInfo[0]?.activated, selectYear: years, activatedUserList: true})
                    }
                })
            })
        })
    }else {
        res.redirect("/")
    }
})

/* SCHEDULE */

app.post("/schedule/edit", (req, res) => {
    if (req.session.auth) {
        var snowbirds = [] // arrays snowbirds and snowkats store the names of the input fields
        var snowkats = []
        var snowbirdValues = [] // arrays snowbirdValues and snowkatValues store the contents of aforementioned input fields
        var snowkatValues = []

        var groups = Object.values(req.body)
        var fieldNames = Object.keys(req.body)
        var groupCount = groups.length - 1; // groups.length but we offset by one because req.body.year is included in the original count
        var stmt = "DELETE FROM `schedule` WHERE `year`=?" // Clear out any previous entries under entered year

        con.query(stmt, [req.body.year])

        var lastSaturday = new Date()
        lastSaturday.setMonth(11) // set month to December
        lastSaturday.setFullYear(req.body.year)
        lastSaturday.setDate(31) // set to last day of December

        var firstSaturday = new Date()
        firstSaturday.setMonth(0)
        lastSaturday.setFullYear(req.body.year)

        while (lastSaturday.getDay() !== 6) { // iterate backwards through month until we hit a Saturday
            lastSaturday.setDate(lastSaturday.getDate() - 1)
        }

        while (firstSaturday.getDay() !== 6) { // get first saturday of the year
            firstSaturday.setDate(firstSaturday.getDate() + 1)
        }
        
        for (let i = 0; i < groupCount; i++) { // determine which field belongs to which side
            if (fieldNames[i].substring(0, 9) == "snowbirds") {
                snowbirds.push(fieldNames[i])
                snowbirdValues.push(groups[i])
            }else {
                snowkats.push(fieldNames[i])
                snowkatValues.push(groups[i])
            }
        }

        var snowbirdSchedule = new Date() 
        snowbirdSchedule.setMonth(0) // Set to January
        snowbirdSchedule.setDate(1) // Set to January 1st
        snowbirdSchedule.setFullYear(req.body.year) // Set to user-selected year

        var sbendDate = new Date() // copy schedule and add 7 days to get end date
        sbendDate.setFullYear(req.body.year)
        sbendDate.setMonth(0)

        var weekCount = 0
        
        snowbirds:
        while (true) { // while true break because this seems to be the least frustrating method for now
            for (let i = 0; i < snowbirds.length; i++) {
                var stmt = "SELECT `groupName` FROM `usergroups` WHERE `id`=?"
                
                con.query(stmt, [snowbirdValues[i]], (err, val) => { 
                    snowbirdSchedule.setDate(snowbirdSchedule.getDate() + 7)

                    let sdd = String(snowbirdSchedule.getDate()).padStart(2, '0')
                    let smm = String(snowbirdSchedule.getMonth() + 1).padStart(2, '0')
                    let syyyy = snowbirdSchedule.getFullYear()

                    sbendDate.setDate(snowbirdSchedule.getDate() + 7)

                    let edd = String(sbendDate.getDate()).padStart(2, '0')
                    let emm = String(sbendDate.getMonth() + 1).padStart(2, '0')
                    let eyyyy = sbendDate.getFullYear()
    
                    var stmt = "INSERT INTO `schedule` (`startDate`, `groupID`, `groupName`, `year`, `condoSide`, `actualGroup`, `endDate`) VALUES (?, ?, ?, ?, ?, ?, ?)"
                    con.query(stmt, [smm + "/" + sdd + "/" + syyyy, snowbirdValues[i], val[0].groupName, req.body.year, 0, val[0].groupName, emm + "/" + edd + "/" + eyyyy])
                })  
                weekCount++
                if (weekCount == 52) {
                    break snowbirds;
                }           
            }
        }

        var snowkatSchedule = new Date()
        snowkatSchedule.setFullYear(req.body.year)
        snowkatSchedule.setDate(1)
        snowkatSchedule.setMonth(0)

        var skendDate = new Date() // copy schedule and add 7 days to get end date
        skendDate.setFullYear(req.body.year) // reset 
        skendDate.setDate(1)
        skendDate.setMonth(0) // reset month

        weekCount = 0 // reuse variable for snowkats loop as well

        snowkats:
        while (true) { // while true break because this seems to be the least frustrating method for now
            for (let i = 0; i < snowkats.length; i++) {
                var stmt = "SELECT `groupName` FROM `usergroups` WHERE `id`=?"
                
                con.query(stmt, [snowkatValues[i]], (err, val) => { 
                    snowkatSchedule.setDate(snowkatSchedule.getDate() + 7)

                    let sdd = String(snowkatSchedule.getDate()).padStart(2, '0')
                    let smm = String(snowkatSchedule.getMonth() + 1).padStart(2, '0')
                    let syyyy = snowkatSchedule.getFullYear()

                    skendDate.setDate(snowkatSchedule.getDate() + 7)

                    let edd = String(skendDate.getDate()).padStart(2, '0')
                    let emm = String(skendDate.getMonth() + 1).padStart(2, '0')
                    let eyyyy = skendDate.getFullYear()
    
                    var stmt = "INSERT INTO `schedule` (`startDate`, `groupID`, `groupName`, `year`, `condoSide`, `actualGroup`, `endDate`) VALUES (?, ?, ?, ?, ?, ?, ?)"
                    con.query(stmt, [smm + "/" + sdd + "/" + syyyy, snowkatValues[i], val[0].groupName, req.body.year, 1, val[0].groupName, emm + "/" + edd + "/" + eyyyy])
                })  
                weekCount++
                if (weekCount == 52) {
                    break snowkats;
                }           
            }
        }

        res.redirect("/dashboard/users")
    }else {
        res.redirect("/")
    }
})

app.post("/dashboard/filter", (req, res) => {
    if (req.session.auth == true && req.session.uid !== null && req.body.yearSelect) { /* Render dashboard like normal, but this time set "setYear" to req.body.yearSelect on render */
        req.session.filter = req.body.yearSelect

        res.redirect("/dashboard")
    }else {
        res.redirect("/")
    }
})

/* GROUP ACTIONS */

app.post("/group/add", (req, res) => {
    if (req.session.auth == true) {
        var stmt = "INSERT INTO `usergroups` (`groupName`, `snowkats`, `snowbirds`) VALUES (?, ?, ?)"

        con.query(stmt, [req.body.gname, req.body.snowkats, req.body.snowbirds])
            
        res.redirect("/dashboard/users")
    }else {
        res.redirect("/")
    }
})

app.post("/group/edit", (req, res) => {
    if (req.session.auth == true) {
        if (req.body.gname && req.body.snowbirds && req.body.snowkats) {
            var stmt = "UPDATE `usergroups` SET `groupName`=?, `snowbirds`=?, `snowkats`=? WHERE `groupName`=?"

            con.query(stmt, [req.body.gname, req.body.snowbirds, req.body.snowkats, req.body.gname], (err) => {
                res.redirect("/dashboard/users")
            })
        }else {
            res.redirect("/dashboard/users")
        }
    }else {
        res.redirect("/")
    }
})

app.get("/group/delete", (req, res) => {
    if (req.session.auth == true) {
        var stmt = "DELETE FROM `usergroups` WHERE `id`=?"

        con.query(stmt, [req.query.groupID])
        res.redirect("/dashboard/users")
    }else {
        res.redirect("/")
    }
})

app.listen(port, () => {
    console.log("Site is currently active and running")
})