const app = require('express')();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const path = require('path');

const routes = require('./routes/index');
// const api = require('./routes/api'); // TODO temporary remove



/* View Engine Setup */

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());



/* Routes */

app.use('/', routes);
// app.use('/api', api); // TODO temporary remove



/* Catch 404 and Forward to Error Handler */

app.use((req, res, next) => {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});



/* Error Handlers */

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    // only print stacktrace in development, hide in production
    err = app.get('env') === 'development' ? err : {};
    res.render('error', {
        message: err.message,
        error: err
    });
});


module.exports = app;
