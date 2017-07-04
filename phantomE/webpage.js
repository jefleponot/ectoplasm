/*jslint sloppy: true, nomen: true */
/*global exports:true,phantom:true */

/*
  This file is part of the PhantomJS project from Ofi Labs.

  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2011 Ivan De Marino <ivan.de.marino@gmail.com>
  Copyright (C) 2011 James Roe <roejames12@hotmail.com>
  Copyright (C) 2011 execjosh, http://execjosh.blogspot.com
  Copyright (C) 2012 James M. Greene <james.m.greene@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


function runCB(page, callback, params) {
    if (typeof page[callback] === "function"){
            console.log('runCB : '+ callback);
            //console.log(page.title);
            return page[callback].apply(page,params);
    }
    return null;
}

var networkRequest = {
    "ret" : {},
    "abort": function () {
            this.ret.cancel = true;
    },
    "changeUrl" : function (newUrl) {
            this.ret.redirectUrl = newUrl;
    }
};

function eventsPage(page) {
    
    //onResourceRequested
    chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
        details.id =  details.requestId;
        details.time =  new Date(details.timeStamp); 
        details.headers =  details.requestHeaders;
        /*delete details.requestId;
        delete details.timeStamp;
        delete details.requestHeaders;*/
        //runCB(page, 'onResourceRequested', [details, networkRequest]);
        return networkRequest.ret;
        },{urls : ["http://*/*", "https://*/*"]},["blocking","requestHeaders"]
    );

    // onResourceReceived - stage = start
    chrome.webRequest.onHeadersReceived.addListener(function (details) {
        details.id =  details.requestId;
        details.time =  new Date(details.timeStamp); 
        details.headers =  details.responseHeaders;
        details.contentType = details.type;
        details.status =  details.statusCode;
        details.statusText = details.statusLine;
        details.stage = "start";
        /*delete details.requestId;
        delete details.timeStamp;
        delete details.responseHeaders;
        delete details.statusCode;
        delete details.statusLine;*/
        //runCB(page, 'onResourceReceived', [details]);
        },{urls : ["http://*/*", "https://*/*"]},["responseHeaders"]
    );

    // onResourceReceived - stage = end
    chrome.webRequest.onCompleted.addListener(function (details) {
        details.id =  details.requestId;
        details.time =  new Date(details.timeStamp); 
        details.headers =  details.responseHeaders;
        details.status =  details.statusCode;
        details.statusText = details.statusLine;
        details.contentType = details.type;
        details.stage = "end";
        /*delete details.requestId;
        delete details.timeStamp;
        delete details.responseHeaders;
        delete details.statusCode;
        delete details.statusLine;*/
        //runCB(page, 'onResourceReceived', [details]);
        },{urls : ["http://*/*", "https://*/*"]},["responseHeaders"]
    );

    // onResourceError
    chrome.webRequest.onErrorOccurred.addListener(function (details) {
        console.log(JSON.stringify(details,null,4));
        details.id = details.requestId;
        details.time =  new Date(details.timeStamp);
        details.errorCode = -1;
        details.errorString = details.error;
        /*delete details.requestId;
        delete details.timeStamp;
        delete details.responseHeaders;
        delete details.statusCode;
        delete details.statusLine;*/
        //runCB(page, 'onResourceError', [details]);
        },{urls : ["http://*/*", "https://*/*"]}
    );
/*
    id : the number of the requested resource
    url : the URL of the requested resource
    time : Date object containing the date of the response
    headers : list of http headers
    bodySize : size of the received content decompressed (entire content or chunk content)
    contentType : the content type if specified
    redirectURL : if there is a redirection, the redirected URL
    stage : “start”, “end” (FIXME: other value for intermediate chunk?)
    status : http status code. ex: 200
    statusText : http status text. ex: OK
*/

    chrome.tabs.onUpdated.addListener(function callback( tabId, changeInfo, tab) {
        if (tab.id !== page.id) return;
        
        //console.log(JSON.stringify(changeInfo, null, 4));
        //console.log(JSON.stringify(tab, null, 4));
        page.id = tabId;
        page.title = tab.title || page.title;
        page.url = tab.url || page.url;
        
        if (typeof changeInfo.status === "undefined") {
            return
        }

        // onLoadStarted
        if (changeInfo.status && changeInfo.status ==  "loading" && tab.url !== "about:blank") {
            runCB(page, 'onLoadStarted', []);
        }
        
        //onLoadFinished                     
        if (changeInfo.status && changeInfo.status ==  "complete" && tab.url !== "about:blank") {
            //page.status = "success";

            page.scrollPosition = { top: 0,  left: 0 };
            page.viewportSize = { width: tab.width, height: tab.height };

//            chrome.tabs.detectLanguage(tab.id, function callback(language){
//                page.language = language;
//            });

            chrome.tabs.executeScript (tab.id,{"code":"window.frames.length"},function(ret){
                page.framesCount = ret;
                //console.log(page.framesCount);
                    
                
                chrome.webNavigation.getAllFrames({tabId: page.id}, function logFrameInfo(framesInfo) {
                    for (var i = 0; i < framesInfo.length; i++) {
                        //console.log("\u001b[31;32m==>"+JSON.stringify(framesInfo[i])+"\u001b[0m");
                    }
                });
                
                if (ret !== 0) {
                    chrome.tabs.executeScript (tab.id,{"code":"[].map.call(window.frames,function(elm){return elm.name;})"},function(ret){
                            page.framesName = ret;
                            console.log(page.framesName);
                            runCB(page, '_onPageOpenFinished', ['success']);
                            runCB(page, 'onLoadFinished', ['success']);
                    });
                } else {
                    runCB(page, '_onPageOpenFinished', ['success']);
                    runCB(page, 'onLoadFinished', ['success']);
                }
            });
        }
    });
}

/**
 * Main Page object.
 *
 * @param  Object  options  Casper options
 */
var Page = function Page(options) {
    "use strict";
    /*eslint max-statements:0*/
    // init & checks
    if (!(this instanceof Page)) {
        return new Page(options);
    }
    var page = this;
    // default options
    this.id = 0;
    this.tab = null;
    this.frames = 0;
    this.allFrames = false;
    this.framesLoading = 0;
    this.evaluateResult = null;
    this.canGoBack = false;
    this.canGoForward = false;
    this.clipRect = { top: 14, left: 3, width: 400, height: 300 };
    this.content = "";
    this.cookies = [];
    this.customHeaders = {};
    this.event = {};
    this.focusedFrameName = "";
    this.frameContent = "";
    this.frameName = "";
    this.framePlainText = "";
    this.frameTitle = "";
    this.frameUrl = "";
    this.framesCount = 0;
    this.framesName = [];
    this.handlers = {};
    this.history = [];
    this.libraryPath = "";
    this.navigationLocked = false;
    this.offlineStoragePath = "";
    this.offlineStorageQuota = 0;
    this.ownsPages = [];
    this.pagesWindowName = [];
    this.pages = [];
    this.paperSize = {};
    this.plainText = "";
    this.scrollPosition = { top: 100, left: 0 };
    this.settings = {};
    this.title = "";
    this.url = "";
    this.viewportSize = { width: 1024, height: 768 };
    this.windowName = "";
    this.zoomFactorValue = 1;
    
    chrome.tabs.query({"active": true},function (tabs){
        page.tab = tabs[0];
        page.id = page.tab.id;
        eventsPage(page);
    });
};

/**
 * evaluate a function in the page
 * @param   {function}  func    the function to evaluate
 * @param   {...}       args    function arguments
 * @return  {*}                 the function call result
 */
Page.prototype.evaluate = function evaluate(func, args) {
    var self = this;
    var str, arg, argType, i, l;
    var callback = null;
    if (!(func instanceof Function || typeof func === 'string' || func instanceof String)) {
        throw "Wrong use of WebPage#evaluate";
    }
    //str = 'function() { return (' + func.toString() + ')(';
    //console.log(func.toString().replace(/[ ]+/g,' ').replace(/\n/g,""));
    var strFunc = func.toString().replace(/[ ]+/g,' ').replace(/\n/g,"");
    if (strFunc === "function _evaluate() { return document.location.href; }") {
        return self.title;
    }
    
    if (strFunc === "function _evaluate() { return document.title; }") {
        return self.url;
    }
    
    str = '(' + func.toString() + ')(';
    if (self.allFrames) str = str.replace(/{/,"{\nif (!(window.phantom)) return;\n");
    for (i = 1, l = arguments.length; i < l; i++) {
        arg = arguments[i];
        argType = detectType(arg);

        switch (argType) {
        case "object":      //< for type "object"
        case "array":       //< for type "array"
            str += JSON.stringify(arg) + ",";
            break;
        case "date":        //< for type "date"
            str += "new Date(" + JSON.stringify(arg) + "),";
            break;
        case "string":      //< for type "string"
            str += quoteString(arg) + ',';
            break;
        case "function":
                callback = arg;
            break;
        default:            // for types: "null", "number", "function", "regexp", "undefined"
            str += arg + ',';
            break;
        }
    }
    //str = str.replace(/,$/, '') + '); }';
    str = str.replace(/,$/, '') + ');';
    self.evaluateJavaScript(str, callback);
};

/**
 * Evaluate a function contained in a string.
 * evaluateJavaScript evaluates the function defined in the string in the
 * context of the web page. It is similar to evaluate.
 *
 * @param  String
 * @return Page
 */
Page.prototype.evaluateJavaScript = function evaluateJavaScript(code, callback){
    var self = this;
    var attente = 0;
    code = code.substring(20,code.length-7) + ";return null})()";
    //code = '(' + code.substring(0,code.length-3) + '})()';
    //code = "(" + code.replace(/;$/, '') + ")()";
    //code = code.replace(/;$/, '');
//    console.log(code);
//    console.log(page.allFrames+'  '+page.id);
    chrome.tabs.executeScript (self.id,{"code":code,"allFrames":self.allFrames},function(rets){

        if (chrome.extension.lastError) {
            console.log(chrome.extension.lastError);
        }
        if (typeof (callback) === "function") {
            callback(rets);
        }else{
            //alert(rets);
        }
    });
};

/**
 * Injects external script code from the specified file into the page 
 * (like page.includeJs, except that the file does not need to be accessible from the hosted page).
 * 
 * If the file cannot be found in the current directory, libraryPath is used for additional look up.
 *
 * @param scriptUrl URL to the Script to include
 * @return Boolean
 */
Page.prototype.injectJs = function injectJs(scriptUrl) {
    var self = this;
    chrome.tabs.executeScript ({"file":scriptUrl,"allFrames":self.allFrames},function(rets){
    });
    return true;
};

/**
 * Injects external script code from the specified file into the page 
 * (like page.includeJs, except that the file does not need to be accessible from the hosted page).
 * 
 * If the file cannot be found in the current directory, libraryPath is used for additional look up.
 *
 * @param scriptUrl URL to the Script to include
 * @return Boolean
 */
Page.prototype.open = function (url, arg1, arg2, arg3, arg4) {
    var thisPage = this;

    if (arguments.length === 1) {
        this.openUrl(url, 'get', this.settings);
        return;
    } else if (arguments.length === 2 && typeof arg1 === 'function') {
        this._onPageOpenFinished = function() {
            thisPage._onPageOpenFinished = null; //< Disconnect callback (should fire only once)
            arg1.apply(thisPage, arguments);     //< Invoke the actual callback
        }
        this.openUrl(url, 'get', this.settings);
        return;
    } else if (arguments.length === 2) {
        this.openUrl(url, arg1, this.settings);
        return;
    } else if (arguments.length === 3 && typeof arg2 === 'function') {
        this._onPageOpenFinished = function() {
            thisPage._onPageOpenFinished = null; //< Disconnect callback (should fire only once)
            arg2.apply(thisPage, arguments);     //< Invoke the actual callback
        }
        this.openUrl(url, arg1, this.settings);
        return;
    } else if (arguments.length === 3) {
        this.openUrl(url, {
            operation: arg1,
            data: arg2
        }, this.settings);
        return;
    } else if (arguments.length === 4) {
        this._onPageOpenFinished = function() {
            thisPage._onPageOpenFinished = null; //< Disconnect callback (should fire only once)
            arg3.apply(thisPage, arguments);     //< Invoke the actual callback
        }
        this.openUrl(url, {
            operation: arg1,
            data: arg2
        }, this.settings);
        return;
    } else if (arguments.length === 5) {
        this._onPageOpenFinished = function() {
            thisPage._onPageOpenFinished = null; //< Disconnect callback (should fire only once)
            arg4.apply(thisPage, arguments);     //< Invoke the actual callback
        }
        this.openUrl(url, {
            operation: arg1,
            data: arg2,
            headers : arg3
        }, this.settings);
        return;
    }
    throw "Wrong use of WebPage#open";
};

/**
 * Injects external script code from the specified file into the page 
 * (like page.includeJs, except that the file does not need to be accessible from the hosted page).
 * 
 * If the file cannot be found in the current directory, libraryPath is used for additional look up.
 *
 * @param scriptUrl URL to the Script to include
 * @return Boolean
 */
Page.prototype.openUrl = function openUrl(url, httpConf, settings) {
    var self = this;
    function waitUntilTabCreated (_self){
        if (_self.tab === null){
            setTimeout(waitUntilTabCreated, 100, _self);
        } else {
                chrome.tabs.update(_self.tab.id, {"url":url,"active":true});
        }
    }
    setTimeout(waitUntilTabCreated, 100, self);
    return self;
};

/**
 * Renders the web page to an image buffer and saves it as the specified filename.
 * Currently, the output format is automatically set based on the file extension.
 *
 * @param String filename
 * @param Object options {format, quality}
 * @return Page
 */
Page.prototype.render = function render(filename, options) {
    options = options || {};
    chrome.tabs.captureVisibleTab(options, function(dataUrl){
        try {
            chrome.downloads.download({"url":dataUrl,"filename":filename});
        } catch(e){ console.log(e);}
    });
    return this;
};

/**   ASYNC
 * Renders the web page to an image buffer and returns the result as a
 * Base64-encoded string representation of that image.
 *
 * @param Object options {format, quality}
 * @return Page
 */
Page.prototype.renderBase64 = function renderBase64(options) {
    options = options || {};
    chrome.tabs.captureVisibleTab(options, function(dataUrl){
        return dataUrl;
    });
    return this;
};

/**
 * switchToFrame
 * 
 * @param String url 
 * @return Page
 */
Page.prototype.switchToChildFrame = function switchToChildFrame(nameOrPosition){
    var self = this;
    self.evaluate(function(nameOrPosition) {
        window.frames[nameOrPosition].window.phantom = "enable";
        if (window.phantom) {
            delete window.phantom;
        }
    },nameOrPosition);
    self.allFrames = true;
    return self;
};
/**
 * switchToFrame
 * 
 * @param String url 
 * @return Page
 */
Page.prototype.switchToFrame = function switchToFrame(nameOrPosition){
    var self = this;
    self.evaluate(function(nameOrPosition) {
        if (window.name == nameOrPosition) {
            window.frames[nameOrPosition].window.phantom = "enable";
        } else if (window.phantom) {
            delete window.phantom;
        }
    },nameOrPosition);
    self.allFrames = true;
    return this;
};

/**
 * switchToMainFrame
 *
 * @return Page
 */
Page.prototype.switchToMainFrame = function switchToMainFrame(){
    var self = this;
    self.evaluate(function() {
        delete window.phantom;
    });
    self.allFrames = false;
    return self;
};

/**
 * switchToParentFrame
 *
 * @return Page
 */
Page.prototype.switchToParentFrame = function switchToParentFrame(){
    var self = this;
    self.evaluate(function() {
        delete window.phantom;
        window.parent.phantom = "enable";
    });
    self.allFrames = true;
    return self;
};


exports.create = function (opts, page) {
    return new Page();
};
