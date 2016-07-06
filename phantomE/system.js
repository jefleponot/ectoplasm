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
exports.env = {};
exports.os = {
	"architecture": chrome.runtime.PlatformArch || "x86-64",
	"name": chrome.runtime.PlatformOs || "windows", 
	"version": chrome.runtime.id
};
exports.pid = 256314;

