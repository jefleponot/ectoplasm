/*
 * CommonJS System/1.0
 * Spec: http://wiki.commonjs.org/wiki/System/1.0
 */

exports.platform = 'Ectoplasm';

Object.defineProperty(exports, 'stdout', {
    enumerable: true,
    writeable: false,
    get: function() {
        return exports.standardout;
    }
});

Object.defineProperty(exports, 'stdin', {
    enumerable: true,
    writeable: false,
    get: function() {
        return exports.standardin;
    }
});

Object.defineProperty(exports, 'stderr', {
    enumerable: true,
    writeable: false,
    get: function() {
        return exports.standarderr;
    }
});

exports.args = [];
exports.args = data.substr(data.indexOf('?')+1).split('&');
//    var args = {}, pos = 0;
//for (var i = 0, l = searchs.length; i < l; i++) {
    //exports.args.push("--" + searchs[i]);
    //pos = searchs[i].indexOf('=');
    //args[searchs[i].substr(0, pos)] = searchs[i].substr(pos + 1);
//}

exports.env = {};
chrome.runtime.getPlatformInfo(function( platformInfo) {
    
    exports.os = {
        "architecture": (platformInfo.arch === "x86-32") ? "32bit" : (platformInfo.arch === "x86-64" ? "64bit" : platformInfo.arch),
        "name": (platformInfo.os === "win" ) ? "windows" : platformInfo.os, 
        "version": "unknown"
    };
    //alert(JSON.stringify(exports.os,null,4));
});
exports.pid = 256314;

