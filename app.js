'use strict';

const app = require('express')();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const path = require('path');


module.exports = (serial, mqtt) => {

    /* View Engine Setup */
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');


    /* App Stacks */
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));
    app.use(cookieParser());
    app.use('/', require('./routes/index'));
    app.use('/api', require('./routes/api')(serial, mqtt));


    /* Catch 404 and Forward to Error Handler */
    app.use((req, res, next) => {
        let err = new Error('Not Found');
        err.status = 404;
        next(err);
    });


    /* Error Handlers */
    app.use((err, req, res) => {
        res.status(err.status || 500);
        // only print stacktrace in development, hide in production
        err = app.get('env') === 'development' ? err : {};
        res.render('error', {
            message: err.message,
            error: err
        });
    });

    return app;
};
