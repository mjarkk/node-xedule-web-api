# node-xedule-web-api  
converts xedule into a json   
  
## use:  
request url from:  
port 5050 < http  
port 5055 < https (need to enable and add keys)  
  
basic link: http://localhost: {http: 5050 / https: 5055} 
request tiemtable: /t/  {type: student|teacher|class}  /  {encoded timetable url}
request school links: /s

Jquery http example:  
```
$.getJSON("http://localhost:5050/t/class/https%3A%2F%2Froosters.xedule.nl%2FAttendee%2FScheduleCurrent%2F31146%3FCode%3DBA5.67%26attId%3D3%26OreId%3D34", function(data){  
  console.log(data);
});  
```

## install:  
clone > npm install > npm start 

## notes:
Turn off automatic downloading at start: index.js > DownloadCompleetList = false;
