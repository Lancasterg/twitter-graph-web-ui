const express = require('express');
const cors = require('cors');
const logger = require('morgan');

const app = express();

app.use(cors());
app.use(logger('dev'));

const indexRouter = require('./routes/index');
const tweetsRouter = require('./routes/tweets');

app.use('/', indexRouter);
app.use('/tweets', tweetsRouter);

let port = 4000;

app.listen(port, function(){
  console.log('Server is running on port', port);
});
