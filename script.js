console.log('Loading a web page');
var page = require('webpage').create();
var url = 'http://phantomjs.org/';
page.open(url, function (status) {
  //Page is loaded!
  console.log("phantomjs OK");
  setTimeout(function(){
    page.open('http://casperjs.org', function (status) {
      console.log("casperjs OK");
      //Page is loaded!
      setTimeout(function(){

       phantom.exit();
      },2000);
    });
  },2000);
});
      
