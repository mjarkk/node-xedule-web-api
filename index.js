var fs = require('fs')
var chalk = require('chalk');
var tred = chalk.bold.red;
var tblue = chalk.bold.blue;
var request = require("request");
var https = require('https');
var express = require('express');
var app = express();

httpsServ = false;

if (httpsServ === true) {
  https.createServer({
    key: fs.readFileSync('/link/to/your/key.pem', 'utf8'),
    cert: fs.readFileSync('/link/to/your/cert.pem', 'utf8')
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
