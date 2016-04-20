var express = require('express');
var index = require('./routes/index.js');

var app = express();

app.use(express.static('server/public'));
app.use('/', index);

var server = app.listen(3000, function(){
  var port = server.address().port;
  console.log('Server listening on port ' + port + '...');
});
