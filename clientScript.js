// communicate events

// communicate events

var _phantom;

window.callPhantom = function(data){ 
    //var event = new Event('callPhantom', data); window.dispatchEvent(event);
    chrome.runtime.sendMessage({type: "callPhantom","data": data});
};

console.log = (function(fct){ 
    return function(message) {
        fct.call(console, message);
        chrome.runtime.sendMessage({type: "console","message": message});
    };
})(console.log);

// Create the toolbar ui iframe and inject it in the current page
function initPhantomClient() {
    _phantom  = {
        replay : true,
        confirm : function(m){var event = new CustomEvent('Phantom', {'detail': m}); window.dispatchEvent(event);return true;},
        alert : function(){return true;},
        prompt : function(){return '';},
        callPhantom : function(){}
    };
    return _phantom;
}


function setPhantomCallback(_phantom, callbackName, callbackSource) {
    
    var el = document.getElementById('phantomClient'+callbackName);
    if (el){
        el.parentNode.removeChild(el);
    }
    if (!callbackSource) return ;
    el = document.createElement('script');
    el.id = 'phantomClient'+callbackName;
    el.innerText = "window." + callbackName + "=" + callbackSource + ";";
    document.body.appendChild(el);
}

window.addEventListener('Phantom', function (e) { 
    console.log('Phantom event');
    chrome.runtime.sendMessage({type: "confirm","data": e.detail});
    console.log('Phantom event '+e.detail);
}, false);


if (window.parent == window) {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (!_phantom) {
            _phantom = initPhantomClient();
        }
        setPhantomCallback(_phantom, request.callbackName, request.callbackSource);
    });
}
