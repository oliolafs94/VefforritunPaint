$(document).ready(function () {
  $("#myCanvas").mousedown(function(e) {
    console.log(e.clientX);
    console.log(e.clientY);
  })
});
