(function(){
  var editor = CodeMirror(document.body, {
    value: "\"use strict\";     console.log('kk');                 \n\nphantom.exit();",
    mode:  "javascript",
    lineNumbers: true,
    matchBrackets: true,
    continueComments: "Enter",
    extraKeys: {"Ctrl-G": "toggleComment"}
  });

  if (typeof chrome === "undefined") {
    if (typeof localStorage.script !== "undefined") {
      editor.setValue(localStorage.getItem('script'));
    }
  } else {
    chrome.storage.local.get('script', function(item) {
      if (typeof item.script !== "undefined"){
        editor.setValue(item.script);
      }
    });
  }
  
  editor.on('update',function(a){
    if (typeof chrome === "undefined") {
      console.log(editor.getValue());
      localStorage.setItem('script', editor.getValue());
    } else {
      chrome.storage.local.set({'script': editor.getValue()}, function() {
      });
    }
  });
  
  window.addEventListener('load', function(){
    document.getElementById('run').addEventListener('click',function() {
      if (typeof chrome !== "undefined") {
        chrome.runtime.sendMessage({action: "send_script", script: editor.getValue()}, function (response){
          
        });
      }
    });

    document.getElementById('clear').addEventListener('click',function() {
      [].forEach.call(document.querySelectorAll('#error div'),function(elm){
        elm.parentNode.removeChild(elm);
      });
      if (typeof chrome !== "undefined") {
        chrome.runtime.sendMessage({action: "clear_traces"});
      }
    });

    if (typeof chrome !== "undefined") {
      chrome.runtime.sendMessage({action: "get_traces"}, function(response) {
        response.forEach(function(elm){
          var nouveauDiv = document.createElement("div");
          nouveauDiv.className = elm.type;
          nouveauDiv.innerHTML = elm.message;
          document.getElementById('error').appendChild(nouveauDiv);
          //console.log(response);
        });
      });
    }
  });
  
})();
