var fs = require('fs-extra')
var chalk = require('chalk');
var tred = chalk.bold.red;
var tblue = chalk.bold.blue;
var request = require("request");
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
// app.get('/s', giveschools);
// function giveschools(req, res) {
//   res.json({
//     status: true,
//     type: "list of schools",
//     list: fs.readJsonSync('./all.json')
//   });
// }

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

// function convertschoolurlssecont () {
//   var schoolJSON = fs.readJsonSync('./all.json');
//   for (i = 0; i < schoolsJSON.length; i++) { 
//     if (schoolsJSON[i].status === true) {
//       for (j = 0; j < schoolsJSON[i].schools.length; j++) {
//         request({
//           uri: schoolsJSON[i].schools[j].url,
//         }, function(error, response, body) {
//           workingURL = body.replace(/(\r\n|\n|\r|  )/gm,"");
//           workingURL = workingURL.substr(workingURL.search(/<strong>Studentgroep<\/strong><br \/>/i) + 9, workingURL.length);
//           var totallist = {
//             studentgroep: [],
//             medewerker: [],
//             Faciliteit: []
//           }
//           cwStudieGroup();
//           function cwStudieGroup() {
            
//           }
//           function cwContributors() {
            
//           }
//           function name() {
            
//           }
//         })
//       }
//     }
//   }
// }
const endarray = [];
module.exports = endarray;
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
                url: schoollocationURL
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
        })
      }
      schoolcount ++
      if (bd.search(/<div class="organisatie">/i) > -1) {
        currentworking();
      } else {
        console.log(endarray)
        fs.outputJson("./all.json", endarray, err => {
          if (err) {
            console.log(err)
          } else {
            console.log("all links saved!")
          }
        })
      }
    }
    
    console.log("total schools: " + schoolcount);
    schoolcount = 0;
    
  })
}

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


      if (type == "student") {
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
      } else if (type == "teacher") {
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
      } else if (type == "class") {
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
