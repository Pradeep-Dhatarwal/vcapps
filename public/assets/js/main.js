'use strict';

(function() {

if(sessionStorage.seconds == undefined )
{
var totalSeconds = 0;
sessionStorage.setItem("seconds", totalSeconds );
} else{
var totalSeconds = sessionStorage.getItem("seconds", totalSeconds );
}
var minutesLabel = document.getElementById("minutes");
var secondsLabel = document.getElementById("seconds");

setInterval(setTime, 1000);
setInterval(()=>{
  sessionStorage.setItem("seconds", totalSeconds );
},5000)
function setTime() {
  ++totalSeconds;

  secondsLabel.innerHTML = pad(totalSeconds % 60);
  minutesLabel.innerHTML = pad(parseInt(totalSeconds / 60));
}

function pad(val) {
  var valString = val + "";
  if (valString.length < 2) {
    return "0" + valString;
  } else {
    return valString;
  }
}

})();
