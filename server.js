const express = require("express")
const app = express()
const hbs = require("hbs")
const sql = require("mysql")
const session = require("express-session")
const sqlStore = require("express-mysql-session")(session)
const bcrypt = require("bcrypt")
const port = 8080

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
        var stmt = "SELECT `value` FROM `settings` WHERE `setting`='webmaster'"

        con.query(stmt, (err, webmaster) => {
            if (webmaster.length !== 0) {
                res.locals.webmaster = webmaster[0].value
            }

            if (!req.session.success) {
                res.render("login")
            }else {
                res.render("login", { success: req.session.success })
                req.session.success = null
            }
        })
    }
})

app.get("/register", (req, res) => {
    var stmt = "SELECT * FROM `usergroups` ORDER BY `groupName` ASC"

    con.query(stmt, (err, groups) => {
        if (req.session.error) {
            res.locals.error = req.session.error
            req.session.error = null
        }

        var stmt = "SELECT `value` FROM `settings` WHERE `setting`='webmaster'"

        con.query(stmt, (err, webmaster) => {
            if (webmaster.length !== 0) {
                res.locals.webmaster = webmaster[0].value
            }

            res.render("register", { userGroup: groups })
        })
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
                                req.session.password = req.body.password // for changing passwords later on
                                
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
                req.session.error = "This email already exists"
                res.redirect("/register")
            })
        }else {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
            var saltWork = 10
            bcrypt.hash(req.body.password, saltWork, (err, hash) => {
                var stmt = "SELECT `groupName` FROM `usergroups` WHERE `id`=?"

                con.query(stmt, [req.body.group], (err, groupName) => {
                    if (req.body.address2 !== null) {
                        var stmt = "INSERT INTO `userdata` (`firstName`, `lastName`, `address`, `address2`, `city`, `state`, `zipcode`, `phoneNumber`, `email`, `password`, `userGroup`, `groupName`, `activated`, `admin`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                        con.query(stmt, [req.body.fName, req.body.lName, req.body.address, req.body.address2, req.body.city, req.body.state, req.body.zipcode, req.body.phone, req.body.email, hash, req.body.group, groupName[0].groupName, 0, 0])
                        
                        req.session.success = "User has successfully been created!"
                        res.redirect("/")
                    }else {
                        var stmt = "INSERT INTO `userdata` (`firstName`, `lastName`, `address`, `city`, `state`, `zipcode`, `phoneNumber`, `email`, `password`, `userGroup`, `groupName`, `activated`, `admin`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                        con.query(stmt, [req.body.fName, req.body.lName, req.body.address, req.body.city, req.body.state, req.body.zipcode, req.body.phone, req.body.email, hash, req.body.group, groupName[0].groupName, 0, 0])
                        
                        req.session.success = "User has successfully been created!"
                        res.redirect("/")           
                    }
                })
            })
        }
    })
})

app.get("/dashboard", (req, res) => {
    if (req.session.auth) {
        var increment = 0 // reset increment on page reload
        var entryCount = 0 // keep track of rows in schedule table
        let now = new Date()

        hbs.registerHelper("increment", function() {
            increment += 1
            return increment
        })

        var stmt = "SELECT `firstName` FROM `userdata` WHERE `id`=?"

        con.query(stmt, [req.session.uid], (err, val) => {
            var stmt = "SELECT * FROM `usergroups`" // order by condoSide as well so table index is formatted correctly on frontend

            con.query(stmt, (err, groupNames) => {
                var stmt = "SELECT `value` FROM `settings` WHERE `setting`='webmaster'"

                con.query(stmt, (err, webmaster) => {
                    if (req.session.admin) {
                        res.locals.admin = true
                    }

                    if (!req.session.filter) {
                        var stmt = "SELECT * FROM `schedule` WHERE `year`=? ORDER BY `startDate` ASC, `condoSide`"
    
                        con.query(stmt, [now.getFullYear()], (err, scheduleData) => {
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

                                if (webmaster.length !== 0) {
                                    res.locals.webmaster = webmaster[0].value
                                }
                                
                                res.render("dashboard", { firstName: val[0]?.firstName, scheduleData: scheduleData, userGroups: groupNames, year: yearList.sort(), setYear: now.getFullYear() })
                            })
                        })
                    }else {
                        var stmt = "SELECT * FROM `schedule` WHERE `year`=? ORDER BY `startDate` ASC, `condoSide`"
    
                        con.query(stmt, [req.session.filter], (err, scheduleData) => {
                            var stmt = "SELECT DISTINCT `year` FROM `schedule`"
        
                            con.query(stmt, (err, scheduleYears) => {    
                                var yearList = []
    
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

                                if (webmaster.length !== 0) {
                                    res.locals.webmaster = webmaster[0].value
                                }

                                res.render("dashboard", { firstName: val[0]?.firstName, scheduleData: scheduleData, userGroups: groupNames, year: yearList, setYear: req.session.filter })

                                req.session.filter = null // kill filter variable
                            })
                        })
                    }
                })
            })
        })
    }else {
        res.redirect("/")
    }
})

app.get("/user/add", (req, res) => {
    if (req.session.auth && req.session.admin) {
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

app.get("/user/deny", (req ,res) => {
    if (req.session.auth && req.session.admin) {
        if (req.query.userID) {
            var stmt = "DELETE FROM `userdata` WHERE `id`=?"

            con.query(stmt, [req.query.userID])
            res.redirect("/dashboard/users")
        }else {
            res.redirect("/dashboard/users")
        }
    }
})

app.post("/user/edit", (req, res) => {
    if (req.session.auth && req.session.admin && req.body.uid) {
        if (req.body.admin == "on") {
            var admin = 1
        }else {
            var admin = 0

            if (parseInt(req.body.uid) == req.session.uid) {
                req.session.error = "You have removed admin permissions from this account. Changes will take effect the next time you login."
            }

            if (parseInt(req.body.uid) !== req.session.uid) {
                req.session.error = "You may not remove another user's admin status!"
                res.redirect("/dashboard/users")

                return 0 // stop!
            }
        }

        var stmt = "SELECT `groupName` FROM `usergroups` WHERE `id`=?"

        con.query(stmt, [req.body.group], (err, groupName) => {
            var stmt = "UPDATE `userdata` SET `firstName`=?, `lastName`=?, `address`=?, `address2`=?, `city`=?, `state`=?, `zipcode`=?, `phoneNumber`=?, `email`=?, `userGroup`=?, `groupName`=?, `admin`=? WHERE `id`=?"

            con.query(stmt, [req.body.fname, req.body.lname, req.body.address, req.body.address2, req.body.city, req.body.state, req.body.zipcode, req.body.phone, req.body.email, req.body.group, groupName[0].groupName, admin, req.body.uid])
            res.redirect("/dashboard/users?modal=uedit&uid=" + req.body.uid)
        })
    }else {
        res.redirect("/")
    }
})

app.post("/user/selfedit", (req, res) => {
    if (req.session.auth && req.session.uid) {
        if (req.body.email && req.body.password && req.body.address && req.body.city && req.body.state && req.body.zipcode && req.body.phone && req.body.email && req.body.group) { /* make sure these aren't empty */
            var stmt = "SELECT `groupname` FROM `usergroups` WHERE `id`=?"

            con.query(stmt, [req.body.group], (err, groupName) => {
                let saltWork = 10

                bcrypt.hash(req.body.password, saltWork, (err, hash) => {
                    var stmt = "UPDATE `userdata` SET `firstName`=?, `lastName`=?, `address`=?, `address2`=?, `city`=?, `state`=?, `zipcode`=?, `phoneNumber`=?, `email`=?, `password`=?, `userGroup`=?, `groupName`=? WHERE `id`=?"

                    con.query(stmt, [req.body.fName, req.body.lName, req.body.address, req.body.address2, req.body.city, req.body.state, req.body.zipcode, req.body.phone, req.body.email, hash, req.body.group, groupName[0].groupname, req.session.uid])
                    req.session.password = req.body.password
                    
                    res.redirect("/dashboard/selfedit")
                })
            })
        }else {
            req.session.error = "One or more required fields are not sufficiently filled out"

            res.redirect("/dashboard/selfedit")
        }
    }
})

app.get("/user/delete", (req, res) => {
    if (req.session.auth && req.session.admin && req.session.uid && req.query.userID) {
        if (req.query.userID) {
            if (req.session.uid !== parseInt(req.query.userID)) { /* compare action uid vs active one */
                var stmt = "DELETE FROM `userdata` WHERE `id`=?"
                con.query(stmt, [req.query.userID])

                res.redirect("/dashboard/users")
            }else {
                req.session.error = "Cannot delete: You are currently logged in as this user"
                res.redirect("/dashboard/users")
            }
        }else {
            res.redirect("/dashboard/users")
        }
    }else {
        res.redirect("/")
    }
})

app.get("/dashboard/selfedit", (req, res) => {
    if (req.session.auth && req.session.uid && req.session.password) {
        if (req.session.admin) {
            res.locals.admin = true
        }

        if (req.session.error) {
            res.locals.error = req.session.error
            req.session.error = null
        }

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

            res.locals.year = yearList.sort()
        })

        var stmt = "SELECT `value` FROM `settings` WHERE `setting`='webmaster'"

        con.query(stmt, (err, webmaster) => {
            res.locals.webmaster = webmaster[0].value
        })

        var stmt = "SELECT * FROM `userdata` WHERE `id`=?"

        con.query(stmt, [req.session.uid], (err, userdata) => {
            var stmt = "SELECT `id`, `groupname` FROM `usergroups`"

            con.query(stmt, (err, groupdata) => {
                res.render("selfedit", { firstname: userdata[0].firstName, lastname: userdata[0].lastName, address: userdata[0].address, address2: userdata[0].address2, city: userdata[0].city, state: userdata[0].state, zipcode: userdata[0].zipcode, phone: userdata[0].phoneNumber, email: userdata[0].email, password: req.session.password, groupid: userdata[0].userGroup, userGroups: groupdata })
            })
        })
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
    if (req.session.auth && req.session.admin) {
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

        var stmt = "SELECT * FROM `usergroups` ORDER BY `groupName` ASC"

        con.query(stmt, (err, groupInfo) => {
            var stmt = "SELECT * FROM `userdata`"

            con.query(stmt, (err, userInfo) => {
                var stmt = "SELECT `value` FROM `settings` WHERE `setting`='webmaster'"

                con.query(stmt, (err, webmaster) => {
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

                            if (req.session.error) {
                                res.locals.error = req.session.error
                                req.session.error = null // clear error message
                            }

                            if (webmaster.length !== 0) {
                                res.locals.webmaster = webmaster[0].value
                            }

                            if (val.length !== 0) {
                                res.locals.activatedUserList = true
                            }

                            if (req.session.admin) { /* admin check */
                                res.locals.admin = true
                            }

                            res.render("users", { userGroups: groupInfo, userInfo: userInfo, activated: userInfo[0]?.activated, selectYear: years, year: yearList.sort() })
                        })
                    })
                })
            })
        })
    }else {
        res.redirect("/")
    }
})

/* SCHEDULE */

app.post("/schedule/edit", (req, res) => {
    if (req.session.auth && req.session.admin && req.body.year) {
        var snowbirds = [] // arrays snowbirds and snowkats store the names of the input fields
        var snowkats = []
        var snowbirdValues = [] // arrays snowbirdValues and snowkatValues store the contents of aforementioned input fields
        var snowkatValues = []

        var groups = Object.values(req.body)
        var fieldNames = Object.keys(req.body)
        var groupCount = groups.length - 1; // groups.length but we offset by one because req.body.year is included in the original count
        var stmt = "DELETE FROM `schedule` WHERE `year`=?" // Clear out any previous entries under entered year

        con.query(stmt, [req.body.year])

        var firstSaturday = new Date()
        firstSaturday.setMonth(0)
        firstSaturday.setDate(1)
        firstSaturday.setFullYear(req.body.year)

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
        snowbirdSchedule.setDate(firstSaturday.getDate()) // Set to first Saturday
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
                    let sdd = String(snowbirdSchedule.getDate()).padStart(2, '0')
                    let smm = String(snowbirdSchedule.getMonth() + 1).padStart(2, '0')
                    let syyyy = snowbirdSchedule.getFullYear()

                    sbendDate.setDate(snowbirdSchedule.getDate() + 7)

                    let edd = String(sbendDate.getDate()).padStart(2, '0')
                    let emm = String(sbendDate.getMonth() + 1).padStart(2, '0')
                    let eyyyy = sbendDate.getFullYear()
    
                    var stmt = "INSERT INTO `schedule` (`startDate`, `groupID`, `groupName`, `year`, `condoSide`, `actualGroup`, `endDate`) VALUES (?, ?, ?, ?, ?, ?, ?)"
                    con.query(stmt, [smm + "/" + sdd + "/" + syyyy, snowbirdValues[i], val[0].groupName, req.body.year, 0, val[0].groupName, emm + "/" + edd + "/" + eyyyy])

                    snowbirdSchedule.setDate(snowbirdSchedule.getDate() + 7)
                })  
                weekCount++
                if (weekCount == 52) {
                    break snowbirds;
                }           
            }
        }

        var snowkatSchedule = new Date()
        snowkatSchedule.setFullYear(req.body.year)
        snowkatSchedule.setDate(firstSaturday.getDate())
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
                    let sdd = String(snowkatSchedule.getDate()).padStart(2, '0')
                    let smm = String(snowkatSchedule.getMonth() + 1).padStart(2, '0')
                    let syyyy = snowkatSchedule.getFullYear()

                    skendDate.setDate(snowkatSchedule.getDate() + 7)

                    let edd = String(skendDate.getDate()).padStart(2, '0')
                    let emm = String(skendDate.getMonth() + 1).padStart(2, '0')
                    let eyyyy = skendDate.getFullYear()
    
                    var stmt = "INSERT INTO `schedule` (`startDate`, `groupID`, `groupName`, `year`, `condoSide`, `actualGroup`, `endDate`) VALUES (?, ?, ?, ?, ?, ?, ?)"
                    con.query(stmt, [smm + "/" + sdd + "/" + syyyy, snowkatValues[i], val[0].groupName, req.body.year, 1, val[0].groupName, emm + "/" + edd + "/" + eyyyy])

                    snowkatSchedule.setDate(snowkatSchedule.getDate() + 7)
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

app.get("/dashboard/partnerdir", (req, res) => {
    if (req.session.auth) {
        if (req.session.admin) {
            res.locals.admin = true
        }

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

            res.locals.year = yearList.sort()
        })

        var stmt = "SELECT `value` FROM `settings` WHERE `setting`='webmaster'"

        con.query(stmt, (err, webmaster) => {
            res.locals.webmaster = webmaster[0].value
        })
        
        var stmt = "SELECT `firstName`, `lastName`, `email`, `groupName` FROM `userdata`"
        
        con.query(stmt, (err, users) => {
            res.render("partnerdir", { user: users })
        })
    }
})

app.get("/dashboard/notes", (req, res) => {
    if (req.session.auth) {
        if (req.session.admin) {
            res.locals.admin = true
        }

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

            res.locals.year = yearList.sort()
        })

        var stmt = "SELECT `value` FROM `settings` WHERE `setting`='webmaster'"

        con.query(stmt, (err, webmaster) => {
            res.locals.webmaster = webmaster[0].value
        })

        var stmt = "SELECT * FROM `notes` ORDER BY `subject` ASC"

        con.query(stmt, (err, notes) => {
            var stmt = "SELECT `firstName` FROM `userdata` WHERE `id`=?"
            con.query(stmt, [req.session.uid], (err, fname) => {
                res.render("notes", { note: notes, firstName: fname[0].firstName })
            })
        })
    }else {
        res.redirect("/")
    }
})

app.post("/schedule/edit/actual", (req, res) => { /* modify actual group for a schedule row */
    if (req.session.auth && req.body.id && req.body.newActual && req.body.year) {
         var stmt = "UPDATE `schedule` SET `actualGroup`=? WHERE `id`=?"

         con.query(stmt, [req.body.newActual, req.body.id])
         req.session.filter = req.body.year // so we don't default to current year when this field is updated
         res.redirect("/dashboard") /* updated! */
    }else {
        res.redirect("/")
    }
})

app.post("/schedule/edit/notes", (req, res) => { /* modify actual group for a schedule row */
    if (req.session.auth && req.body.id && req.body.year) {
         var stmt = "UPDATE `schedule` SET `notes`=? WHERE `id`=?"

         con.query(stmt, [req.body.notes, req.body.id])
         req.session.filter = req.body.year
         res.redirect("/dashboard") /* updated! */
    }else {
        res.redirect("/")
    }
})

app.post("/dashboard/filter", (req, res) => { /* handler for filter requests */
    if (req.session.auth && req.body.yearSelect) { 
        req.session.filter = req.body.yearSelect

        res.redirect("/dashboard") /* redirect to the dashboard with new filter session variable (it will be destroyed when finished with) */
    }else {
        res.redirect("/")
    }
})

/* GROUP ACTIONS */

app.post("/group/add", (req, res) => {
    if (req.session.auth && req.session.admin) {
        var stmt = "INSERT INTO `usergroups` (`groupName`, `snowkats`, `snowbirds`) VALUES (?, ?, ?)"

        con.query(stmt, [req.body.gname, req.body.snowkats, req.body.snowbirds])
            
        res.redirect("/dashboard/users")
    }else {
        res.redirect("/")
    }
})

app.post("/group/edit", (req, res) => {
    if (req.session.auth && req.session.admin) {
        if (req.body.gname && req.body.snowbirds && req.body.snowkats && req.body.gid) {
            var stmt = "UPDATE `usergroups` SET `groupName`=?, `snowbirds`=?, `snowkats`=? WHERE `id`=?"

            con.query(stmt, [req.body.gname, req.body.snowbirds, req.body.snowkats, req.body.gid], (err) => {
                res.redirect("/dashboard/users?modal=gedit&gid=" + req.body.gid)
            })
        }else {
            res.redirect("/dashboard/users")
        }
    }else {
        res.redirect("/")
    }
})

app.get("/group/delete", (req, res) => {
    if (req.session.auth && req.session.admin) {
        var stmt = "DELETE FROM `usergroups` WHERE `id`=?"

        con.query(stmt, [req.query.groupID])
        res.redirect("/dashboard/users")
    }else {
        res.redirect("/")
    }
})

/* SETTINGS */

app.get("/schedule/delete", (req, res) => {
    if (req.session.auth && req.session.admin && req.query.year) {
        var stmt = "DELETE FROM `schedule` WHERE `year`=?"

        con.query(stmt, [req.query.year])

        if (req.query.from == "dashboard") {
            res.redirect("/dashboard?modal=settings")
        }

        if (req.query.from == "notes") {
            res.redirect("/dashboard/notes?modal=settings")
        }

        if (req.query.from == "admin") {
            res.redirect("/dashboard/users?modal=settings")
        }

        if (req.query.from == "notes") {
            res.redirect("/dashboard/notes?modal=settings")
        }

        if (req.query.from == "selfedit") {
            res.redirect("/dashboard/selfedit?modal=settings")
        }

        if (req.query.from == "partnerdir") {
            res.redirect("/dashboard/partnerdir?modal=settings")
        }
    }
})

app.post("/settings/webmaster", (req, res) => {
    if (req.session.auth && req.session.admin && req.body.email) {
        var stmt = "SELECT `setting` FROM `settings` WHERE `setting`='webmaster'"

        con.query(stmt, (err, val) => {
            if (val.length !== 0) {
                var stmt = "UPDATE `settings` SET `setting`='webmaster', `value`=?"

                con.query(stmt, [req.body.email])
            }else {
                var stmt = "INSERT INTO `settings` (`setting`, `value`) VALUES ('webmaster', ?)"

                con.query(stmt, [req.body.email])
            }

            if (req.body.from == "dashboard") {
                res.redirect("/dashboard?modal=settings")
            }

            if (req.body.from == "notes") {
                res.redirect("/dashboard/notes?modal=settings")
            }

            if (req.body.from == "admin") {
                res.redirect("/dashboard/users?modal=settings")
            }

            if (req.body.from == "partnerdir") {
                res.redirect("/dashboard/partnerdir?modal=settings")
            }

            if (req.body.from == "selfedit") {
                res.redirect("/dashboard/selfedit?modal=settings")
            }
        })
    }else {
        res.redirect("/")
    }
})

app.post("/note/new", (req, res) => {
    if (req.session.auth) {
        if (req.body.subject && req.body.content) {
            var stmt = "SELECT `firstName` FROM `userdata` WHERE `id`=?"

            con.query(stmt, [req.session.uid], (err, name) => {
                let pubdate = new Date()

                let dd = String(pubdate.getDate()).padStart(2, '0')
                let mm = String(pubdate.getMonth() + 1).padStart(2, '0')
                let yyyy = pubdate.getFullYear()

                var stmt = "INSERT INTO `notes` (`subject`, `content`, `author`, `lastModified`) VALUES (?, ?, ?, ?)"

                con.query(stmt, [req.body.subject, req.body.content, name[0].firstName, mm + "/" + dd + "/" + yyyy])

                res.redirect("/dashboard/notes")
            })
        }else {
            res.redirect("/dashboard/notes")
        }
    }else {
        res.redirect("/")
    }
})

app.get("/note/delete", (req, res) => {
    if (req.session.auth) {
        if (req.query.nid) {
            var stmt = "DELETE FROM `notes` WHERE `id`=?"

            con.query(stmt, [req.query.nid])
            res.redirect("/dashboard/notes")
        }else {
            res.redirect("/dashboard/notes")
        }
    }else {
        res.redirect("/")
    }
})

app.post("/note/edit", (req, res) => {
    if (req.session.auth) {
        if (req.body.subject && req.body.content && req.body.nid) {
            var stmt = "SELECT `firstName` FROM `userdata` WHERE `id`=?"
            
            con.query(stmt, [req.session.uid], (err, fname) => {
                let editdate = new Date()

                let dd = String(editdate.getDate()).padStart(2, '0')
                let mm = String(editdate.getMonth() + 1).padStart(2, '0')
                let yyyy = editdate.getFullYear()

                var stmt = "UPDATE `notes` SET `subject`=?, `content`=?, `author`=?, `lastModified`=? WHERE `id`=?"

                con.query(stmt, [req.body.subject, req.body.content, fname[0].firstName, mm + "/" + dd + "/" + yyyy, req.body.nid])

                res.redirect("/dashboard/notes")
            })
        }else {
            res.redirect("/dashboard/notes")
        }
    }else {
        res.redirect("/")
    }
})

app.listen(port, () => {
    console.log("Site is currently active and running")
})