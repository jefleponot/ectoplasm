/*
 * CommonJS System/1.0
 * Spec: http://wiki.commonjs.org/wiki/System/1.0
 */

var exports_library = {};
var phantom = {
    "traces": [],
//properties
    "args" : [],
    "cookies" : {},
    "cookiesEnabled" : true,
    "libraryPath" : "/casper/modules/",
    "scriptName" :    "wsimuUi",
    "version" :        { 'major': 1, 'minor': 9, 'patch': 0 },
    "defaultPageSettings": { 'userAgent' : "PhantomJS" },
    "casperEngine": "phantomjs",
    "casperVersion" : "1.1-beta3",
    "casperPath": "casper",
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
        chrome.browserAction.setBadgeText({text:""});
        chrome.browserAction.setIcon({path: "icons/wsimuUI-32.png"});
    },
    "injectJs": function(){},
//events
    "onError" : function(msg,trace){alert(msg + " (" + trace + ")");},
    
// page 
    "createWebPage": function(){
        var page = new Page();
        chrome.tabs.create({"index": 0,"url":"about:blank"}, function (tab){
            //console.log(tab.id);
            page.tab = tab;
            page.id = tab.id;
            //chrome.tabs.highlight({"tabs" : tab});
        });
        
        chrome.tabs.onUpdated.addListener(function onResourceRequested(tabId, changeInfo, tab) {
            if (tab.id !== page.id) return;
            if (changeInfo.status && changeInfo.status === "complete"  && tab.url !== "about:blank") {
                page.updateProperties();
                //page.onConfirm;
                page.title = tab.title || page.title;
                page.url = tab.url || page.url;
                
                ['onAlert','onConfirm','onPrompt'].forEach(function(elm){
                    var code;
                    if (!page[elm] || typeof page[elm] !== "function") {
                        code = "function(){return true;}";
                    } else {
                        code = page[elm].toString();
                    }
                    var name = elm.substring(2).toLowerCase();
                    chrome.tabs.sendMessage(page.id, {callbackName: name, callbackSource: code });
                });
            }
        });
        
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.type && request.type === "console" && request.message && page.onConsoleMessage){
                page.onConsoleMessage(request.message);
            }
            if (request.type && request.type === "callPhantom" && request.data && page.onCallback){
                page.onCallback(request.data);
            }
        });
        return page;
    }
};


function require(javascriptFile) {
    var xhr = new XMLHttpRequest(),obj={};
    
    var correspondence = {
       
    "background":    "background.js",
    "child_process": "phantomE/child_process.js",
    "cookiejar":     "phantomE/cookiejar.js",
    "fs":            "phantomE/fs.js",
    "system":        "phantomE/system.js",
    "webpage":       "phantomE/webpage.js",
    "webserver":     "phantomE/webserver.js",
    
    "bootstrap":     "casper/bootstrap.js",
    "casper":        "casper/modules/casper.js",
    "cli":           "casper/modules/cli.js",
    "colorizer":     "casper/modules/colorizer.js", 
    "events":        "casper/modules/events.js",
    "http":          "casper/modules/http.js",
    "mouse":         "casper/modules/mouse.js",
    "pagestack":     "casper/modules/pagestack.js",
    "querystring":   "casper/modules/querystring.js",
    "tester":        "casper/modules/tester.js",
    "toolsbox":      "casper/modules/toolsbox.js",
    "utils":         "casper/modules/utils.js",
    "xunit":         "casper/modules/xunit.js"
    };

    if (typeof (exports_library[javascriptFile]) != "undefined"){
        return exports_library[javascriptFile];
    }

    xhr.open("GET", chrome.extension.getURL(correspondence[javascriptFile]), false);
    xhr.send(null);
    if ((xhr.status === 200) && (xhr.readyState === 4)) {
        if (javascriptFile == "background"){
            eval(xhr.responseText);
            return ;
        }
        try {
            exports_library[javascriptFile] = eval('(function(){var exports={};'+xhr.responseText+';return exports;})();');
            return exports_library[javascriptFile];
        } catch(e){
            phantom.onError(javascriptFile+" - "+ e);
        }
    }
    return {};
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
    
    //callbacks
    //Object.defineProperty(page, "onConfirm", { 
    this._getJsConfirmCallback = function() {
        return {"called": {"connect": function(f){
                chrome.tabs.sendMessage(page.id, {callbackName: 'confirm', callbackSource: page.onConfirm.toString()});
            },"disconnect": function(){
                chrome.tabs.sendMessage(page.id, {callbackName: 'confirm', callbackSource: "function(){return true;}"});
            }
        }};
    };
    this._getJsPromptCallback = function() {
        return {"called": {"connect": function(f){
                chrome.tabs.sendMessage(page.id, {callbackName: 'prompt', callbackSource: page.onPrompt.toString()});
            },"disconnect": function(){
                chrome.tabs.sendMessage(page.id, {callbackName: 'prompt', callbackSource: "function(){return true;}"});
            }
        }};
    };
    this._getJsInterruptCallback = function() {
        return {"called": {"connect": function(f){
           
            },"disconnect": function(){
 
            }
        }};
    };
    this._getGenericCallback = function() {
        return {"called": {"connect": function(f){
           
            },"disconnect": function(){
 
            }
        }};
    };
    this._getFilePickerCallback = function() {
        return {"called": {"connect": function(f){
           
            },"disconnect": function(){
 
            }
        }};
    };
    
    this.zoomFactor = {
        get : function() { 
            return this.zoomFactorValue; 
        },
        set : function(newValue) {
                this.zoomFactorValue = newValue; 
                tabs.setZoom(page.id, newValue);
        },
        enumerable : true,
        configurable : true
    };
    
    //events
    this.closing = {
        "connect" : function(f){
            chrome.tabs.onRemoved.addListener(function onClosing (tabId, removeInfo) {
                if (tab.id !== page.id) return;
                f.apply(page,['success']);
            });
        },
        "disconnect": function(f){
            chrome.tabs.onRemoved.removeListener(onClosing);
        }
    };
    this.loadFinished = {
        "connect" : function(f){
            chrome.tabs.onUpdated.addListener(function _onPageOpenFinished (tabId, changeInfo, tab) {
                if (tab.id !== page.id) return;
                if (changeInfo.status && changeInfo.status === "complete" && tab.url !== "about:blank"){
                    page.status = "success";
                    page.scrollPosition = { top: 0,  left: 0 };
                    page.viewportSize = { width: tab.width, height: tab.height };
                    f.apply(page,['success']);
                }
            });
        },
        "disconnect": function(f){
            chrome.tabs.onUpdated.removeListener(_onPageOpenFinished);
        }
    };
            
    this.loadStarted = {
        "connect" : function(f){
            chrome.tabs.onUpdated.addListener(function onLoadStarted (tabId, changeInfo, tab) {
                if (tab.id !== page.id) return;
                if (changeInfo.status && changeInfo.status ==  "loading" && tab.url !== "about:blank") {
                    f.apply(page,[]);
                }
            });
        },
        "disconnect": function(f){
            chrome.tabs.onUpdated.removeListener(onLoadStarted);
        }
    };
    
    this.navigationRequested = {
        "connect" : function(f){
            chrome.webNavigation.onCommitted.addListener(function onNavigationRequested (tabId, changeInfo, tab) {
                if (tab.id !== page.id) return;
                if (changeInfo.status && changeInfo.status ==  "loading" && tab.url !== "about:blank") {
                    f.apply(page,[url, type, willNavigate, main]);
                }
            });
        },
        "disconnect": function(f){
            chrome.webNavigation.onCommitted.removeListener(onNavigationRequested);
        }
    };

    this.rawPageCreated = {
        "connect": function(f){
            chrome.tabs.onCreated.addListener(function onRawPageCreated(tab){
                var page = new Page();
                f.apply(page,page);
            });
        },
        "disconnect": function(f){
            chrome.webRequest.onHeadersReceived.removeListener(onRawPageCreated);
        }
    };
    
    this.resourceError = {
        "connect" : function(f){
            chrome.webRequest.onErrorOccurred.addListener(function onResourceError(details) {
                var obj = {'id' : 'requestId', 'time': new Date(details.timeStamp), 'errorString': 'error', 'errorCode': 'xxx'};
                for (var i in obj) {
                    details[i] = details[obj[i]] || obj[i];
                    delete details[obj[i]];
                }
                f.apply(page, [details]);
            }, {urls : ["http://*/*", "https://*/*"]});
        },
        "disconnect": function(f){
            chrome.webRequest.onErrorOccurred.removeListener(onResourceError);
        }
    };

    this.resourceRequested = {
        "connect" : function(f){
            chrome.webRequest.onBeforeSendHeaders.addListener(function onResourceRequested(details) {
                var networkRequest = {
                    "ret" : {},
                    "abort": function () {
                            this.ret.cancel = true;
                    },
                    "changeUrl" : function (newUrl) {
                            this.ret.redirectUrl = newUrl;
                    }
                };
                var obj = {'id' : 'requestId', 'time': new Date(details.timeStamp), 'headers': 'requestHeaders'};
                for (var i in obj) {
                    details[i] = details[obj[i]] || obj[i];
                    delete details[obj[i]];
                }
                f.apply(page, [details, networkRequest]);
                return networkRequest.ret;
            }, {urls : ["http://*/*", "https://*/*"]}, ["requestHeaders"]);
        },
        "disconnect": function(f){
            chrome.webRequest.onBeforeSendHeaders.removeListener(onResourceRequested);
        }
    };

    this.resourceReceived = {
        "connect" : function(f){
            var obj = {'id' : 'requestId',  'headers': 'responseHeaders', 'contentType': 'type',
                'status': 'statusCode', 'statusText': 'statusLine'};
            var networkRequest = {
                    "ret" : {},
                    "abort": function () {
                            this.ret.cancel = true;
                    },
                    "changeUrl" : function (newUrl) {
                            this.ret.redirectUrl = newUrl;
                    }
            };

            chrome.webRequest.onHeadersReceived.addListener( function onResourceReceivedStart(details) {
                    obj.time = new Date(details.timeStamp);
                    obj.stage = 'start';
                    for (var i in obj) {
                        details[i] = details[obj[i]];
                        delete details[obj[i]];
                    }
                    f.apply(page, [details, networkRequest]);
                    return networkRequest.ret;
                }, 
                {urls : ["http://*/*", "https://*/*"]}, 
                ["responseHeaders"]
            );
            chrome.webRequest.onCompleted.addListener( function onResourceReceivedEnd(details) {
                    obj.time = new Date(details.timeStamp);
                    obj.stage = 'end';
                    for (var i in obj) {
                        details[i] = details[obj[i]];
                        delete details[obj[i]];
                    }
                    f.apply(page, [details, networkRequest]);
                    return networkRequest.ret;
                }, 
                {urls : ["http://*/*", "https://*/*"]}, 
                ["responseHeaders"]
            );
        },
        "disconnect": function(f){
            chrome.webRequest.onHeadersReceived.removeListener(onResourceReceivedStart);
            chrome.webRequest.onCompleted.removeListener(onResourceReceivedEnd);
        }
    };
};

Page.prototype._appendScriptElement = function _appendScriptElement(scriptUrl) {
    var src = "var el = document.createElement('script');" +
        "el.onload = function() { alert('" + scriptUrl + "'); };" +
        "el.src = '" + scriptUrl + "';" +
        "document.body.appendChild(el);";
    this.evaluateJavaScript(src);
};
/**
 * Add a Cookie to the page. If the domain does not match the current page, 
 * the Cookie will be ignored/rejected. Returns true if successfully added, 
 * otherwise false.
 * 
 * {
 *  'name'     : 'Valid-Cookie-Name',   // required property
 *  'value'    : 'Valid-Cookie-Value',  // required property
 *  'domain'   : 'localhost',
 *  'path'     : '/foo',                // required property
 *  'httponly' : true,
 *  'secure'   : false,
 *  'expires'  : (new Date()).getTime() + (1000 * 60 * 60)   // <-- expires in 1 hour
 * }
 *
 * @param  String  cookie     cookie
 * @return Page
 */
Page.prototype.addCookie = function addCookie(cookie) {
    chrome.cookies.set(cookie, function (){});
    return this;
};

/**
 * Get Number of Frames 
 *
 * @return Number
 */
Page.prototype.childFramesCount = function childFramesCount() {
    return this.framesCount;
};

/**
 * Get Array of Frames Names
 *
 * @return Array
 */
Page.prototype.childFramesName = function childFramesName() {
    return this.framesName;
};

/**
 * Delete all Cookies visible to the current URL.
 *
 * @return Page
 */
Page.prototype.clearCookies = function clearCookies() {
    function extrapolateUrlFromCookie(cookie) {
        var prefix = cookie.secure ? "https://" : "http://";
        if (cookie.domain.charAt(0) == ".") {
            prefix += "www";
        }
        return prefix + cookie.domain + cookie.path;
    }
    chrome.cookies.getAll({}, function (cookies){
        [].forEach.call(cookies,function(cookie){
            var detail = {"url":extrapolateUrlFromCookie(cookie),"name":cookie.name};
            chrome.cookies.remove(detail, function (){});
        });
    });
};

/**
 * Close the page and releases the memory heap associated with it. Do not use the page instance after calling this.
 *
 * @return null
 */
 Page.prototype.close = function close() {
    chrome.tabs.remove(page.tab.id);
};

/**
 * Get Frame Name
 *
 * @return String
 */
Page.prototype.currentFrameName = function currentFrameName() {
    return this.frameName;
};

/**
 * Delete any Cookies visible to the current URL with a ‘name’ property 
 * matching cookieName. Returns true if successfully deleted, otherwise false.
 *
 * @return Page
 */
Page.prototype.deleteCookie = function deleteCookie() {
    chrome.cookies.remove(cookie, function (){});
    return this;
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
    var page = this;
    //code = "(" + code.replace(/;$/, '') + ")()";
    code = code.replace(/;$/, '');
//    console.log(code);
//    console.log(page.allFrames+'  '+page.id);
    chrome.tabs.executeScript (page.id,{"code":code,"allFrames":page.allFrames},function(rets){
        if (typeof (callback) === "function") {
            callback(rets);
        }else{
            //alert(rets);
        }
    });
    return {errors:[]};
};

/**
 * Get And Display Page
 *
 * @param  String   Name
 * @return Page
 */
Page.prototype.getPage = function getPage(name) {
    var _self = this;
    chrome.tabs.query({},function (tabs){
        [].forEach.call(tabs,function(tab){
            //_self.evaluateJavascript(
            chrome.tabs.executeScript (tab.id,{"code":"window.name"},function(ret){
                if (name == ret){
                    page.tab = tab;
                    chrome.tabs.update(tab.id, {active:true,selected:true});
                }
            });
            chrome.tabs.executeScript (tab.id,{"code":"document.title"},function(ret){
                if( name == ret){
                    page.tab = tab;
                    chrome.tabs.update(tab.id, {active:true,selected:true});
                }
            });
        });
    });
    //return Page;
};

/**
 * Go Back from Navigation
 *
 * @return Page
 */
Page.prototype.goBack = function goBack() {
    var page = this;
    page.evaluate(function(){
        history.back();return true;
    });
};

/**
 * Go Forward from Navigation
 *
 * @return Page
 */
Page.prototype.goForward = function goForward() {
    var page = this;
    page.evaluate(function(){
        history.forward();return 1;
    });
    return this;
};

/**
 * Go from Navigation
 *
 * @param  Number position     Positive or negated number
 * @return Page
 */
Page.prototype.go = function go() {
    var page = this;
    page.evaluate(function(position){
        history.go(position);return true;
    },pos);
    return this;
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
    var page = this;
    chrome.tabs.executeScript ({"file":scriptUrl,"allFrames":page.allFrames},function(rets){

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
Page.prototype.openUrl = function openUrl(url, httpConf, settings) {
    var _self = this;
    function waitUntilTabCreated (_self){
        if (_self.tab === null){
            setTimeout(waitUntilTabCreated, 100, _self);
        } else {
                chrome.tabs.update(_self.tab.id, {"url":url,"active":true});
        }
    }
    setTimeout(waitUntilTabCreated, 100, _self);
    return _self;
};

/**
 * Reload (Navigation)
 *
 * @return Page
 */
Page.prototype.reload = function reload() {
    chrome.tabs.reload();
    return this;
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

/**   ASYNC
 * Renders the web page to an image buffer which can be sent directly 
 * to a client (e.g. using the webserve module)
 *
 * @param Object options {format, quality}
 * @return Page
 */
Page.prototype.renderBuffer = function renderBuffer(options) {
    options = options || {};
    chrome.tabs.captureVisibleTab(options, function(dataUrl){
        return dataUrl;
    });
    return this;
};

/**
 * Sends an event to the web page.
 * The events are not synthetic DOM events, each event is sent to the
 * web page as if it comes as part of user interaction.
 *
 * @param Object options {format, quality}
 * @return Page
 */
Page.prototype.sendEvent = function sendEvent(options) {
    page.evaluate(function(){
        try {
            var elem = document.elementFromPoint(10,10);
            var evt = document.createEvent("MouseEvents");
            var center_x = 10, center_y = 10;
            evt.initMouseEvent("click", true, true, window, 0, 0, 0, center_x, center_y, false, false, false, false, 0, elem);
            //document.getElementById("bandeau").dispatchEvent(evt);
            elem.dispatchEvent(evt);
            return true;
        } catch (e) {
            alert("Failed dispatching " + type + "mouse event on " + selector + ": " + e, "error");
            return false;
        }
    });
};

/**
 * Allows to set both page.content and page.url properties.
 * The webpage will be reloaded with the new content and the current 
 * location set as the given url, without any actual http request being made.
 *
 * @param String content 
 * @param String url 
 * @return Page
 */
Page.prototype.setContent = function setContent(content, url) {
    this.url = url;
    this.content = content;
};

/**
 * Stop
 *
 * @return Page
 */
Page.prototype.stop = function stop() {
    return this;
};

/**
 * Stop
 *
 * @return Page
 */
Page.prototype.stop = function stop() {
    return this;
};

/**
 * switchToFrame
 * 
 * @param String url 
 * @return Page
 */
Page.prototype.switchToChildFrame = function switchToChildFrame(nameOrPosition){
    page.evaluate(function(nameOrPosition) {
        window.frames[nameOrPosition].window.phantom = "enable";
        if (window.phantom) {
            delete window.phantom;
        }
    },nameOrPosition);
    page.allFrames = true;
    return this;
};
/**
 * switchToFrame
 * 
 * @param String url 
 * @return Page
 */
Page.prototype.switchToFrame = function switchToFrame(nameOrPosition){
    page.evaluate(function(nameOrPosition) {
        if (window.name == nameOrPosition) {
            window.frames[nameOrPosition].window.phantom = "enable";
        } else if (window.phantom) {
            delete window.phantom;
        }
    },nameOrPosition);
    page.allFrames = true;
    return this;
};

/**
 * switchToMainFrame
 *
 * @return Page
 */
Page.prototype.switchToMainFrame = function switchToMainFrame(){
    page.evaluate(function() {
        delete window.phantom;
    });
    page.allFrames = false;
    return this;
};

/**
 * switchToParentFrame
 *
 * @return Page
 */
Page.prototype.switchToParentFrame = function switchToParentFrame(){
    page.evaluate(function() {
        delete window.phantom;
        window.parent.phantom = "enable";
    });
    page.allFrames = true;
    return this;
};


/**
 * switchToParentFrame
 *
 * @return Page
 */
Page.prototype.updateProperties = function updateProperties(){
    var page = this;
    var retour = null;
    chrome.tabs.executeScript (page.id, {
        "code": [ 
                    "[ window && window.name || 'noname'",
                    "location.href",
                    "document.title",
                    " document.body.innerHTML",
                    "document.body.textContent || document.body.innerText || ''",
                    "[].map.call(window.frames || [],function(elm){return elm.name;})]"
                ].join(','),
        "allFrames":page.allFrames,
        "runAt": "document_end"
        }, function(ret) {
            if (typeof ret == "undefined"|| ret[0] === null) return;
            ret = ret[0];
            retour = ret;

            if (!page.allFrames) {
                page.windowName = ret[0];
                page.url = ret[1];
                page.title = ret[2];
                page.content = ret[3];
                page.plainText = ret[4];
            } else if (window.phantom) {
                page.frameName = ret[0];
                page.frameUrl = ret[1];
                page.frameTitle = ret[2];
                page.frameContent = ret[3];
                page.framePlainText = ret[4];
            }
            page.framesCount = ret[5].length;
            page.framesName = ret[5];
        }
    );
};
// END DEFINE PAGE

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
