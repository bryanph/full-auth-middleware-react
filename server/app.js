"use strict"

import path from "path"
import fs from "fs"
import redis from "redis"
import express from "express"
import bodyParser from 'body-parser'
import http from 'http'
import socket_io from "socket.io"
import session from 'express-session'
import cookieParser from 'cookie-parser'
import connect_mongo from "connect-mongo"
import connectRedis from "connect-redis";
import mongoose from "mongoose"
mongoose.Promise = global.Promise; // use ES6 promises

import config from "./config/config.js"

require('es6-promise').polyfill();
require('isomorphic-fetch');

let app = express();
let server = http.Server(app)
let io = socket_io(server)

/*
 * Redis
*/
const redisClient = redis.createClient()
redisClient.on('error', (error) => console.error(error))

const RedisStore = connectRedis(session)
var sessionStore = new RedisStore({ client: redisClient });

// const MongoStore = connect_mongo(session)
// let sessionStore = new MongoStore(config.database)


const sessionMiddleware = session({
    key: 'connect.sid',
    secret: 'foo',
    resave: true,
    saveUninitialized: true,
    store: sessionStore
})

app.set('view engine', 'jade');
app.set('views', [ 
    __dirname + '/views', 
    __dirname + '/node_modules/full-auth-middleware/views' 
])

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('foo'));
app.use(sessionMiddleware)

app.use(function(req, res, next) {
    // useful to have on request object
    req.redisClient = redisClient
    req.app = app
    req.io = io

    next()
})


/*
 * DRYWALL SPECIFIC
*/
app.db = mongoose.createConnection(config.database.url);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {
      //and... we have a data store
    });

import authConfig from './config/auth'
const { setupAuthMiddleware } = require('full-auth-middleware')

const { authRoutes, adminRoutes } = setupAuthMiddleware(app, mongoose, authConfig)

require('./routes')(app, authRoutes, adminRoutes);

io
    .use(function(socket, next) {
        // wrap with session (this mutates socket.request)
        socket.redisClient = redisClient
        sessionMiddleware(socket.request, {}, next)
    })
    .use(function(socket, next) {
        // now deserialize user...
        if (!socket.request.session.passport) {
            return next("failed")
        }

        const id = socket.request.session.passport.user

        app.db.models.User.findOne({ _id: id }, { password: 0 })
            .populate('roles.admin')
            .populate('roles.account')
            .exec(function(err, user) {
                if (user && user.roles && user.roles.admin) {
                    user.roles.admin.populate("groups", function(err, admin) {
                        // TODO: must be admin here? - 2016-08-11
                        socket.request.user = user
                        next()
                    });
                }
                else {
                    socket.request.user = user
                    next()
                }
            });
    })

io.on('connection', function(socket) {
    socket.emit('connected', 'connected');

    const user = socket.request.user;

    // TODO: set socket events here

})

server.listen(config.port)

console.log(`listening on port ${config.port}`);
