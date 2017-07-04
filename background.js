/*
 * CommonJS System/1.0
 * Spec: http://wiki.commonjs.org/wiki/System/1.0
 */
 

var url = "about:blank";

function require(javascriptFile) {
    var xhr = new XMLHttpRequest(),obj={};
    
    var correspondence = {
       
    "child_process": "phantomE/child_process.js",
    "cookiejar":     "phantomE/cookiejar.js",
    "fs":            "phantomE/fs.js",
    "system":        "phantomE/system.js",
    "webpage":       "phantomE/webpage.js",
    "webserver":     "phantomE/webserver.js",
    };

    if (typeof (exports_library[javascriptFile]) != "undefined"){
        return exports_library[javascriptFile];
    }
    console.log("*** " + (correspondence[javascriptFile] || javascriptFile));
    xhr.open("GET", chrome.extension.getURL(correspondence[javascriptFile] || javascriptFile), false);
    xhr.send(null);
    if (xhr.status === 200) {
        if (xhr.readyState === 4) {
            try {
                exports_library[javascriptFile] = eval('(function(data){var exports={};'+xhr.responseText+';return exports;})("'+ url + '");');
                
                return exports_library[javascriptFile];
            } catch(e){
                phantom.onError(javascriptFile+" - "+ e);
            }
        }
    }else {
        alert('error');
    }
    return {};
}


function patchRequire(data) {
   return require;
};

var exports_library = {};
var phantom = {
    "traces": [],
//properties
    "args" : [],
    "cookies" : {},
    "cookiesEnabled" : true,
    "libraryPath" : "/casper/modules/",
    "scriptName" :    "wsimuUi",
    "version" :        { 'major': 2, 'minor': 1, 'patch': 1 },
    "defaultPageSettings": { 'userAgent' : "PhantomJS" },
    "casperEngine": "phantomjs",
    "casperVersion" : "1.1-beta3",
    "casperPath": "casper",
    "pages": [],
//methods    
    "addCookie":    function(cookie){
            chrome.cookies.set(cookie, function (){});
        },
    "clearCookies": function(){
        chrome.cookies.getAll({}, function (cookies){
            [].forEach.apply(cookies,function(cookie){
                chrome.cookies.remove(cookie, function (){});
            });
        });
    },
    "deleteCookie": function(cookie){
            chrome.cookies.remove(cookie, function (){});
    },
    "exit": function(){
        console.log('exit');
        chrome.browserAction.setBadgeText({text:""});
        chrome.browserAction.setIcon({path: "icons/wsimuUI-32.png"});
        for (var i=this.pages.length-1;i>=0;i--){
            console.log('exit '+i);
            if (typeof this.pages[i] !== "undefined"){
                this.pages[i].close();
            }
            this.pages = [];
        }
        console.log('exit');
        chrome.windows.getCurrent({}, function (window) {
            chrome.windows.remove(window.id);
            chrome.processes.terminate(0);
            
        });
        /*chrome.processes.getProcessInfo([], false, function(processes) {
            console.log(JSON.stringify(processes, null, 4));
            //chrome.processes.terminate(4);
            //chrome.processes.terminate(2);
            chrome.processes.terminate(0, function (didTerminate) {
                 console.log(didTerminate);
                });
                processes.forEach(function(process) {
                    if (process.type === 'browser') {
                        chrome.processes.terminate(process.id);
                    }
                });
        });
        */
    },
    "injectJs": function(javascriptFile) {
        console.log("injectJs");
        var xhr = new XMLHttpRequest(),obj={};
        console.log("/// " + javascriptFile);
        xhr.open("GET", chrome.extension.getURL(javascriptFile), false);
        xhr.send(null);
        if (xhr.status === 200) {
            if (xhr.readyState === 4) {
                try {
                    eval('(function(data){'+xhr.responseText+'})();');
                } catch(e){
                    phantom.onError(javascriptFile+" - "+ e);
                }
            }
        }else {
            alert('error');
        }
        return {};
    },
//events
    "defaultErrorHandler" : function(message, stack) {
        stack = stack || [];
        console.log(message + "\n");
        /*stack.forEach(function(item) {
            var message = item.file + ":" + item.line;
            if (item["function"])
                message += " in " + item["function"];
            console.log("  " + message);
        });*/
    }/*,
    
    "__defineErrorSignalHandler__" :  function(obj, page, handlers) {
        var handlerName = 'onError';
        var signalName = 'javaScriptErrorSent';
        //definePageSignalHandler(page, handlers, handlerName, signalName);
        Object.defineProperty(page, handlerName, {
            set: function (f) {
                //console.log('MISE A JOUR ERROR '+f.toString());
                // Disconnect previous handler (if any)
                if (!!handlers[handlerName] && typeof handlers[handlerName].callback === "function") {
                    try {
                        this[signalName].disconnect(handlers[handlerName].callback);
                    } catch (e) {
                        console.log('====================> '+JSON.stringify(e));
                    }
                }

                // Delete the previous handler
                delete handlers[handlerName];

                // Connect the new handler iff it's a function
                if (typeof f === "function") {
                    // Store the new handler for reference
                    handlers[handlerName] = {
                        callback: f
                    }
                    this[signalName].connect(f);
                }
            },
            get: function() {
                return !!handlers[handlerName] && typeof handlers[handlerName].callback === "function" ?
                    handlers[handlerName].callback :
                    undefined;
            }
        });
    }*/
};

chrome.tabs.query({}, function (tabs) {
    url = tabs[0].url;
    var system = require('system');
    //var system = require(system.args[0]);
    console.log(system.args[0]);
    require(system.args[0]);
//    alert('hi');
});

phantom.onError = phantom.defaultErrorHandler;

//setTimeout(function(){    phantom.exit(0);},1000);


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action && request.action === "send_script" && request.script ){
        chrome.browserAction.enable();
        chrome.browserAction.setBadgeText({text:"redo"});
        chrome.browserAction.setBadgeBackgroundColor({color:"#8f8f8f"});
        phantom.traces = [];
        try {
            (function(){
                var console = {log : function (msg){
                    phantom.traces.push({'type':'log','message':msg});
                }};
                eval(request.script);
            })();
        } catch(e){
            phantom.onError(e.message, "lineNumber "+e.stack.match(/[^s]:(\d+:\d+)/m)[1]);
            phantom.exit();
        }
    }
    if (request.action && request.action === "get_traces"){
        sendResponse(phantom.traces);
    }
    if (request.action && request.action === "clear_traces"){
        phantom.traces = [];
    }
});
//require('background');
