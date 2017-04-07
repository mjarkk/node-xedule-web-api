var fs = require('fs-extra')
var chalk = require('chalk');
var tred = chalk.bold.red;
var tblue = chalk.bold.blue;
var request = require("request");
let request2 = require('async-request'),response;
var https = require('https');
var express = require('express');
var app = express();

DownloadCompleetList = true;
httpsServ = false;

if (httpsServ === true) {
  https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/school.mkopenga.com/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/etc/letsencrypt/live/school.mkopenga.com/fullchain.pem', 'utf8')
  }, app).listen(5055);
  console.log(tblue('Server is running on port 5055'));
} else {
  app.listen(5050, function() {
    console.log(tblue('Server is running on port 5050'));
  });
}

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.set('json spaces', 2);
app.get('/s', giveschools);
function giveschools(req, res) {
  res.json({
    status: true,
    type: "list of schools",
    list: fs.readJsonSync('./all.json')
  });
}

app.get('/sm/url/:url', giveschools1);
function giveschools1(req, res) {
  var url = req.params['url'];
  var reqJSON = fs.readJsonSync('./schools/.json');

}


app.get('/sm/name/:school/:location', giveschools2);
function giveschools2(req, res) {
  var school = req.params['school'];
  var location = req.params['location'];
  if (fs.existsSync('./schools/' + school.replace(/\//g, '') + '/' + location.replace(/\//g, '') + '.json')) {
    var reqJSON = fs.readJsonSync('./schools/' + school.replace(/\//g, '') + '/' + location.replace(/\//g, '') + '.json');
    res.json({
      status: false,
      school: school,
      location: location,
      list: reqJSON
    });
  } else {
    res.json({
      status: false,
      why: "not failit url"
    });
  }


}

app.get('/t/:type/:timetableurl', givetimetable);
function givetimetable(req, res) {
  var url = req.params['timetableurl'];
  var type = req.params['type'];
  if (url.substring(0, 26) == "https://roosters.xedule.nl") {
    request({
      uri: url,
    }, function(error, response, body) {
      res.json({
        status: true,
        requrl: url,
        type: type,
        weekdata: GetXedule(body,type)
      });
    })
  } else {
    res.json({
      status: false,
      why: "not xedule url"
    });
  }
}

var schoolcount = 0;

if (DownloadCompleetList === true) {
  convertschoolurls();
}
var TotalLocationSchools = 0;
var schoolsJSON = fs.readJsonSync('./all.json');
function convertschoolurlssecont () {
    var currentworkingI = 0;
    var currentworkingJ = 0;
    checkjson();
    function checkjson() {
      if (schoolsJSON[currentworkingI].status === true) {
        currentworkingJ = 0;
        oke();
      } else {
        if (schoolsJSON[currentworkingI + 1] != undefined) {
          currentworkingI ++;
          checkjson();
        } else {
          console.log("dune getting all schools data");
        }
      }
    }
    function oke() {
        request({
          uri: schoolsJSON[currentworkingI].schools[currentworkingJ].url,
        }, function(error, response, body) {
          if (error) {
            console.log(error)
          }
          schoolsJSONvars(body)
        })
        schoolsJSONvars = function (body) {
          workingHTMLdata = body.replace(/(\r\n|\n|\r|  )/gm,"");
          workingHTMLdata = workingHTMLdata.substr(workingHTMLdata.search(/<strong>Studentgroep/i) + 35, workingHTMLdata.length);
          var totallist = {
            location: schoolsJSON[currentworkingI].name.replace(/\//g, '') + "/" + schoolsJSON[currentworkingI].schools[currentworkingJ].location.replace(/\//g, ''),
            studentgroep: [],
            medewerker: [],
            Faciliteit: []
          }
          cwStudieGroup();
          function cwStudieGroup() {
            if (workingHTMLdata.search(/<strong>Medewerker/i) > workingHTMLdata.search(/<a href="/i)) {
              workingHTMLdata = workingHTMLdata.substr(workingHTMLdata.search(/<a href="/i) + 9, workingHTMLdata.length);
              workingSGurl = workingHTMLdata.substr(0, workingHTMLdata.search(/">/i)).replace(/;/g, '&');
              workingHTMLdata = workingHTMLdata.substr(workingHTMLdata.search(/">/i) + 2, workingHTMLdata.length);
              workingSGname = workingHTMLdata.substr(0, workingHTMLdata.search(/<\/a>/i));
              if (workingSGname == "xedule" || workingSGname == "Organisaties" || workingSGname == "Alfa-college") {} else {
                totallist.studentgroep.push({
                  name: workingSGname,
                  url: "https://roosters.xedule.nl" + workingSGurl,
                  api: "/t/studentgroep/" + encodeURIComponent("https://roosters.xedule.nl" + workingSGurl)
                });
              }
              cwStudieGroup();
            } else {
              cwContributors();
            }
          }
          function cwContributors() {
            if (workingHTMLdata.search(/<strong>Faciliteit/i) > workingHTMLdata.search(/<a href="/i)) {
              workingHTMLdata = workingHTMLdata.substr(workingHTMLdata.search(/<a href="/i) + 9, workingHTMLdata.length);
              workingSGurl = workingHTMLdata.substr(0, workingHTMLdata.search(/">/i)).replace(/;/g, '&');
              workingHTMLdata = workingHTMLdata.substr(workingHTMLdata.search(/">/i) + 2, workingHTMLdata.length);
              workingSGname = workingHTMLdata.substr(0, workingHTMLdata.search(/<\/a>/i));
              if (workingSGname == "xedule" || workingSGname == "Organisaties" || workingSGname == "Alfa-college") {} else {
                totallist.medewerker.push({
                  name: workingSGname,
                  url: "https://roosters.xedule.nl" + workingSGurl,
                  api: "/t/medewerker/" + encodeURIComponent("https://roosters.xedule.nl" + workingSGurl)
                });
              }
              cwStudieGroup();
            } else {
              cePlaces();
            }
          }
          function cePlaces() {
            if (workingHTMLdata.search(/<a href="/i) > 0) {
              workingHTMLdata = workingHTMLdata.substr(workingHTMLdata.search(/<a href="/i) + 9, workingHTMLdata.length);
              workingSGurl = workingHTMLdata.substr(0, workingHTMLdata.search(/">/i)).replace(/;/g, '&');
              workingHTMLdata = workingHTMLdata.substr(workingHTMLdata.search(/">/i) + 2, workingHTMLdata.length);
              workingSGname = workingHTMLdata.substr(0, workingHTMLdata.search(/<\/a>/i));
              if (workingSGname == "xedule" || workingSGname == "Organisaties" || workingSGname == "Alfa-college") {} else {
                totallist.Faciliteit.push({
                  name: workingSGname,
                  url: "https://roosters.xedule.nl" + workingSGurl,
                  api: "/t/faciliteit/" + encodeURIComponent("https://roosters.xedule.nl" + workingSGurl)
                });
              }
              cwStudieGroup();
            } else {
              fs.outputJson("./schools/" + totallist.location + ".json", totallist, err => {
                if (err) {
                  console.log(err)
                } else {
                  console.log("saved: " + totallist.location + "(" + currentworkingI + " " + currentworkingJ + ")");
                  if (currentworkingJ < schoolsJSON[currentworkingI].schools.length - 1) {
                    currentworkingJ++;
                    oke();
                  } else {
                    if (schoolsJSON[currentworkingI + 1] != undefined) {
                      if (schoolsJSON[currentworkingI + 1].status === true) {
                        currentworkingI++;
                        currentworkingJ = 0;
                        oke();
                      } else {
                        currentworkingI++;
                        checkjson();
                      }
                    } else {
                      console.log("dune");
                    }
                  }
                }
              })

            }
          }

        }

    }
}

var endarray = [];
function convertschoolurls() {
  request({
    uri: "https://roosters.xedule.nl/",
  }, function(error, response, body) {
    var bd = body.replace(/(\r\n|\n|\r|  )/gm,"");
    currentworking();
    function currentworking() {
      bd = bd.substr(bd.search(/<a href="/i) + 9, bd.length);
      cwURL = "https://roosters.xedule.nl" + bd.substr(0, bd.search(/">/i));
      bd = bd.substr(bd.search(/">/i) + 2, bd.length);
      cwNAME = bd.substr(0, bd.search(/<\/a>/i));
      getschoolinfo(cwURL, cwNAME);
      function getschoolinfo(SchoolInfoUrl, SchoolInfoName) {
        request({
          uri: SchoolInfoUrl,
        }, function(error, responses, bodys) {
          var bds = bodys.replace(/(\r\n|\n|\r|  )/gm,"");
          if (bds.search(/<form/i) > -1) {
            endarray.push({
              name: SchoolInfoName,
              url: SchoolInfoUrl,
              status: false,
              why: "url redirects to login"
            })
          } else {
            bds = bds.substr(bds.search(/<div class="organisatieContainer">/i) + 34, bds.length);
            SchoolLocations = [];
            currentworkingsecont();
            function currentworkingsecont() {
              bds = bds.substr(bds.search(/<a href="/i) + 9, bds.length);
              schoollocationURL = "https://roosters.xedule.nl" + bds.substr(0, bds.search(/">/i));
              bds = bds.substr(bds.search(/">/i) + 2, bds.length);
              schoollocationNAME = bds.substr(0, bds.search(/<\/a>/i));
              SchoolLocations.push({
                location: schoollocationNAME,
                url: schoollocationURL,
                api: "/sm/name/" + encodeURIComponent(SchoolInfoName.replace(/\//g, '')) + "/" + encodeURIComponent(schoollocationNAME.replace(/\//g, ''))
              })
              if (bds.search(/<div class="organisatie">/i) > -1) {
                currentworkingsecont();
              } else {
                endarray.push({
                  name: SchoolInfoName,
                  url: SchoolInfoUrl,
                  status: true,
                  schools: SchoolLocations
                })
              }
            }
          }
          if (bd.search(/<div class="organisatie">/i) > -1) {
            currentworking();
            schoolcount ++
          } else {
            fs.outputJson("./all.json", endarray, err => {
              if (err) {
                console.log(err)
              } else {
                console.log("all links saved! #1");
                setTimeout(function () {
                  convertschoolurlssecont();
                }, 2000);
              }
            })
          }
        })
      }

    console.log("total schools: " + schoolcount);
}})}

GetXedule = function (timetablehtml,type) {
  var schoolweek = {
    monday: [],
    tuesday: [],
    wednsday: [],
    thursday: [],
    friday: []
  };
  var timetable = "";
  timetable = timetablehtml.replace(/(\r\n|\n|\r)/gm,"");
  rawhtmltojson();
  function isNumber(n) { return /^-?[\d.]+(?:e-?\d+)?$/.test(n); };
  function rawhtmltojson() {
    if (timetable.search(/<div class="Les"/i) != -1) {
      timetable = timetable.substr(timetable.search(/<div class="Les"/i), timetable.length);
      if (timetable.search(/<\/div>                <div class="Les"/i) != -1) {
        CW = timetable.substr(0, timetable.search(/<\/div>                <div class="Les"/i) + 6);
      } else {
        CW = timetable;
      }
      timetable = timetable.substr(CW.length, timetable.length);
      CW = CW.substr(CW.search(/eft:/i) + 4, CW.length);
      CWday = CW.substr(0, CW.search(/">/i));
      CW = CW.substr(CW.search(/title="/i) + 7, CW.length);
      CWsubject = CW.substr(0, CW.search(/">/i));
      CW = CW.substr(CW.search(/title="/i) + 7, CW.length);
      CWtime = CW.substr(0, CW.search(/">/i));
      CW = CW.substr(CW.search(/title="/i) + 7, CW.length);
      CWplace = CW.substr(0, CW.search(/">/i));
      CW = CW.substr(CW.search(/title="/i) + 7, CW.length);
      CWteacher = CW.substr(0, CW.search(/">/i));
      if (isNumber(CWplace.substr(0,1))) {
        CWplace = "none";
      }
      if (CWteacher == "" || false || 0 || NaN || null || undefined) {
        CWteacher = "none";
      }
      CWTimeStartHours = CWtime.substr(0,2);
      CWTimeStartMinutes = CWtime.substr(3,2);
      CWTimeEndHourse = CWtime.substr(6,2);
      CWTimeEndMinutes = CWtime.substr(9,2);


      if (type == "student" || type == "studentgroep") {
        var CWJSON = {
          subject: CWsubject,
          time: {
            HourseStart: CWTimeStartHours,
            MinutesStart: CWTimeStartMinutes,
            HourseEnd: CWTimeEndHourse,
            MinutesEnd: CWTimeEndMinutes
          },
          place: CWplace,
          teacher: CWteacher
        };
      } else if (type == "teacher" || type == "medewerker") {
        var CWJSON = {
          subject: CWsubject,
          time: {
            HourseStart: CWTimeStartHours,
            MinutesStart: CWTimeStartMinutes,
            HourseEnd: CWTimeEndHourse,
            MinutesEnd: CWTimeEndMinutes
          },
          students: CWplace,
          local: CWteacher
        };
      } else if (type == "class" || type == "faciliteit") {
        var CWJSON = {
          subject: CWsubject,
          time: {
            HourseStart: CWTimeStartHours,
            MinutesStart: CWTimeStartMinutes,
            HourseEnd: CWTimeEndHourse,
            MinutesEnd: CWTimeEndMinutes
          },
          place: CWplace,
          class: "---"
        };
      } else {
        var CWJSON = {
          subject: CWsubject,
          time: {
            HourseStart: CWTimeStartHours,
            MinutesStart: CWTimeStartMinutes,
            HourseEnd: CWTimeEndHourse,
            MinutesEnd: CWTimeEndMinutes
          },
          place: CWplace,
          teacher: CWteacher
        };
      }


      if (CWday == " 160px;") {
        schoolweek.monday.push(CWJSON);
      } else if (CWday == " 318px;") {
        schoolweek.tuesday.push(CWJSON);
      } else if (CWday == " 476px;") {
        schoolweek.wednsday.push(CWJSON);
      } else if (CWday == " 634px;") {
        schoolweek.thursday.push(CWJSON);
      } else if (CWday == " 792px;") {
        schoolweek.friday.push(CWJSON);
      } else {}
      rawhtmltojson();
    } else {

    }
  }
  return schoolweek;
}

app.get('/rawhtml/', function(req, res) {
  var roosterurl = req.query['url'];
  console.log(roosterurl);
  if (roosterurl.substring(0, 26) == "https://roosters.xedule.nl") {
    request({
      uri: roosterurl,
    }, function(error, response, body) {

      res.send(body.replace(/href/g, 'hreff').replace(/src="/g, 'srcc="'));
    })
  } else {
    res.send("nope");
  }
});
