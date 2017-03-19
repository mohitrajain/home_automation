var mqtt = require('mqtt');
var express = require('express');
var app = express();
var mongoose = require('mongoose');

mongoose.connect('mongodb://username:password@url_to_your_database');
var client = mqtt.connect('mqtt://iot.eclipse.org');

var port = process.env.PORT || 8080;

app.use(express.static(__dirname + '/public'));

var Schema = mongoose.Schema;

var storeSchema = new Schema({
  relay1: String,
  relay2: String,
  relay3: String,
  relay4: String,
  time: String
});

var store = mongoose.model('storeCollection', storeSchema);

// time function returns time in format - year : month : day : hour : min : sec
function getDateTime() {

  var date = new Date();

  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;

  var min = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;

  var sec = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;

  var year = date.getFullYear();

  var month = date.getMonth() + 1;
  month = (month < 10 ? "0" : "") + month;

  var day = date.getDate();
  day = (day < 10 ? "0" : "") + day;

  return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;

}

client.on('connect', function() {
  client.subscribe({
    'nodemcu/relay1': 1,
    'nodemcu/relay2': 1,
    'nodemcu/relay3': 1,
    'nodemcu/relay4': 1
  })
});

var relay = {
  relay1: 'off',
  relay2: 'off',
  relay3: 'off',
  relay4: 'off'
};

client.on('message', function(topic, message) {
  // message is Buffer
  console.log(topic + ' :' + message.toString());
  relay[topic.split('/')[1]] = message.toString();
  store.create({
    relay1: relay.relay1,
    relay2: relay.relay2,
    relay3: relay.relay3,
    relay4: relay.relay4,
    time: getDateTime()
  }, function(err, doc) {
    if (err)
      console.log('Error while storing : ' + err);
    else
      console.log('Saving document : ' + doc);
  })
});

app.get('/api/:number', function(req, res) {

  store.find().exec(function(err, docs) {
    if (err) {
      console.log('Error finding all the docs : ' + err);
      res.status(500).send();
    } else {
      if (docs.length < req.params.number)
        res.json(docs);
      else
        res.json(docs.splice(docs.length - req.params.number, docs.length))
    }
  });

});

app.listen(port, function() {
  console.log('Listening on Port : ' + port);
});