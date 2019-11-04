'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;

const assert = require('assert');

var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code;

// Connection URL
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017';
console.log(url);
// Database Name
const dbName = 'heroku_44g51tbh';

// Create a new MongoClient
const client = new MongoClient(url);

function connectToMongo(callback) {
  // Use connect method to connect to the Server
  client.connect(function(err) {
    assert.equal(null, err);
    console.log('Connected successfully to server');

    const db = client.db(dbName);

    callback(db);
  });
}
function initWebSockets(db) {
  const wss = new SocketServer({ server });

  wss.on('connection', ws => {
    console.log('Client connected');

    ws.on('close', () => console.log('Client disconnected'));
    ws.on('message', function incoming(message) {
      wss.clients.forEach(client => {
        client.send(message);
        const collection = db.collection('messages');
        collection.insert(JSON.parse(message));
      });
    });
  });
}

function initAPIs(db) {
  app.get('/history', function(req, res) {
    const collection = db.collection('messages');
    // Find some documents
    let query = {}
    console.log(req.query)
    console.log(req)
    if (req.query.after) {
      var newObjectId = new ObjectID.createFromHexString(req.query.after);
      query = {
        _id: { $gt: newObjectId }
      }
      console.log(query)
    }
    collection.find(query).toArray(function(err, docs) {
      assert.equal(err, null);
      res.send(JSON.stringify({'stations': docs}));
    });
  });
}

function init(db) {
  initWebSockets(db);
  initAPIs(db);
}

const app = express();
// .use((req, res) => res.sendFile(INDEX))

const server = app
  .use(express.static('public'))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

connectToMongo(init);
