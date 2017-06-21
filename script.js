console.log('Loading a web page');
var page = require('webpage').create();
var url = 'http://phantomjs.org/';
page.open(url, function (status) {
  //Page is loaded!
  setTimeout(function(){
    page.open('http://casperjs.org', function (status) {
      //Page is loaded!
      setTimeout(function(){

       phantom.exit();
      },5000);
    });
  },5000);
});
      
