
var casper = require('casper').create();
casper.start();

casper.thenOpen('http://casperjs.org/',function(){
   console.log('chargement ok');
   //this.capture('casper.png');
});

casper.then(function() {
    this.echo('First Page: ' + this.getTitle());
});

casper.thenOpen('http://phantomjs.org', function() {
    this.echo('Second Page: ' + this.getTitle());
    //this.capture('phantomjs.png');
});

casper.thenClick('a[href="http://phantomjs.org/download.html"]', function(){
    this.wait(10000);
});

casper.run();
