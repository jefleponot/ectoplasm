/*!
 * Casper is a navigation utility for PhantomJS.
 *
 * Documentation: http://casperjs.org/
 * Repository:    http://github.com/n1k0/casperjs
 *
 * Copyright (c) 2011-2012 Nicolas Perriault
 *
 * Part of source code is Copyright Joyent, Inc. and other Node contributors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*global CasperError, console, exports, phantom, patchRequire, require:true*/

/**
 * Extracts, normalize and organize PhantomJS CLI arguments in a dedicated
 * Object.
 *
 * @param  array  phantomArgs  system.args value
 * @return Object
 */
exports.create = function create(options) {
    "use strict";
    if (!phantom.casperTest || !window.casper) {
        console.error("Fatal: you can't use this extended Casper toolBox without the main Casper Module.");
        console.error("Docs: http://docs.casperjs.org/en/latest/testing.html#test-command-args-and-options");
        phantom.exit(1);
    }
};

/**
 * Seach selector throught Frames and IFrame and return the Path in an Array. 
 *
 * @param  String  selector    DOM CSS3/XPath/LinkText selector
 * @param  String  flag        0 : return FrameName; 1: return FrameIndex
 * @return Array          
 */
Casper.prototype.getFramesPath = function getFramesPath(selector, flag) {
    "use strict";
    var names = [], _self = this;
    flag = flag || 1;
    if (this.exists(selector)){
        names.push([]);
    }
    [].forEach.call(this.page.framesName, function(frameName,index){
        _self.page.switchToChildFrame(frameName);
        getFramesPath.call(_self,selector,flag).forEach(function(elm){
            elm.unshift((flag)?frameName:index);
            names.push(elm);
        });
        _self.page.switchToParentFrame();
    });
    return names;
};

/**
 * Makes the provided multipes frames path as the currently active one. Note that the
 * active page will be reverted when finished.
 *
 * @param  Array    framePath   Target frames name or number
 * @param  Function  then       Next step function
 * @return Casper
 */
Casper.prototype.withFrames = function withFrames(frameArray, then){
    "use strict";
    if (frameArray.length){
        var frameNameOrId = frameArray.shift();
        this.withFrame(frameNameOrId,function(){
            withFrames.call(this,frameArray,then);
        });
    } else {
        this.then(then);
    }
};

/**$
 * Enable or Disable css3 transition and animation and jQuery fx
 */$
Casper.prototype.triggerAnimations = function triggerAnimations() {
    "use strict";
    this.evaluate( function triggerAnimations() {
        function EnableOrDisableAnimations() {
            var style=document.querySelector('style[id="disableAnimations"]'),
                jQuery = window.jQuery;
            if ( window && window.jQuery ) window.jQuery.fx.off=(style)?true:false;
            if (!style){
                var css = document.createElement( "style" );
                css.id = "disableAnimations";
                css.type = "text/css";
                css.innerHTML = "* { -webkit-transition: none !important; "
                              +"-moz-transition:none!important; -o-transition :none!important;"
                              +"transition: none !important; "
                              +" -webkit-animation: none !important; "
                              +"-moz-animation:none!important; -o-animation :none!important;"
                              +"animation: none !important; }";
                document.body.appendChild( css );
           } else {
                 style.parentNode.removeChild(style);
           }
        }
    });
};

Casper.prototype.cleanComments = function cleanComments(){
    "use strict";
    this.evaluate( function cleanComments(){
        var t=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_COMMENT, null, false),c=[];
        while(t.nextNode()){
            c.push(t.currentNode);
        }
        [].forEach.call(c,function(e){
            e.parentNode.removeChild(e);
        })
    });
};


Casper.prototype.cleanComments = function cleanComments(){$
    "use strict";
    this.evaluate( function cleanComments(){
        window.close = function (close) {
            return function () {
                setTimeout(function () { 
                    close.call(window);}, 10000);
                };}(window.close);
    });
};

