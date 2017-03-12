/*
    Simple Auth
*/
var passport = require('passport')

import { middleware } from 'full-auth-middleware'
import config from "./config/config.js"
import express from "express"

module.exports = function(app, authRoutes, adminRoutes) {
    /*
     * Main routes
    */

    app.get('/', (req, res) => {
        // landing page or redirect
        res.redirect('/app')
    })

    app.get('/app/?*', middleware.ensureVerified, function(req, res) {
        res.end('<p>logged in! Click <a href="/auth/logout">here</a> to log out!</p>')
    })

    /*
     * Authentication
    */
    app.use('/auth', authRoutes)

    /*
     * Admin section
    */
    app.use('/admin', adminRoutes)

    if (config.env === "development") {
        app.use('/media', express.static(config.media_root))
        app.use('/static', express.static(config.static_root))
    }

    // error handling
    app.use(function(error, req, res, next) {
        if (error instanceof Error) {
            return res.status(500).send({
                status: 500,
                error: error,
            })
        }

        const status = error.code ? error.code : 500

        return res.status(status).send({
            status,
            error: error,
        })
    })
}
