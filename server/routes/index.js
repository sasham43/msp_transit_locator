var express = require('express');
var path = require('path');
var router = express.Router();

router.get('/', function(request, response){
  // response.send('Hello from the serverrrrr-siiiiiiiiiide');
  response.sendFile(path.join(__dirname, '../public/views/index.html'));
});

module.exports = router;
