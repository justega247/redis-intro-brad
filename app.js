const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const redis = require('redis');

const app = express();

// Create Client
const client = redis.createClient();

client.on('connect', function() {
  console.log('Up redis...')
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  let title = 'Task List'

  client.lrange('tasks', 0, -1, function(err, reply) {
    client.hgetall('call', function(err, call) {
      res.render('index', {
        title: title,
        tasks: reply,
        call: call
      });
    })
  });
});

app.post('/task/add', function(req, res) {
  let taskName = req.body.task;

  client.rpush('tasks', taskName, function(err, reply) {
    if(err) {
      console.log(err);
    }
    console.log('Task added');
    res.redirect('/');
  })
});

app.post('/task/delete', function(req, res){
  let tasksToDel = req.body.tasks;

  client.lrange('tasks', 0, -1, function(err, tasks) {
    for(let i = 0; i < tasks.length; i++) {
      if(tasksToDel.indexOf(tasks[i]) > -1) {
        client.lrem('tasks', 0, tasks[i], function(err, reply){
          if(err) {
            console.log(err);
          }
        })
      }
    }
    res.redirect('/');
  });
});

app.post('/call/add', function(req, res){
  let newCall = {};

  newCall.name = req.body.name
  newCall.company = req.body.company
  newCall.phone = req.body.phone
  newCall.time = req.body.time

  client.hmset('call', [
    'name', newCall.name,
    'company', newCall.company,
    'phone', newCall.phone,
    'time', newCall.time
  ], function(err, reply) {
    if(err) {
      console.log(err)
    }
    console.log(reply);
    res.redirect('/');
  })
});

app.listen(3000);
console.log('Server started on port 3000...');

module.exports = app;