var fs=require("fs"),path=require("path");
var BASE="C:/Users/neera/Documents/Project/anjana-dalal-academy/content/class-6/science";
var ch4=path.join(BASE,"chapter-4-exploring-magnets");
var ch5=path.join(BASE,"chapter-5-measurement-of-length-and-motion");
var ch6=path.join(BASE,"chapter-6-materials-around-us");
[ch4,ch5,ch6].forEach(function(d){fs.mkdirSync(d,{recursive:true});});
