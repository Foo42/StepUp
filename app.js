var MongoClient = require('mongodb').MongoClient;
var config = require(process.env.CONFIG_PATH || '/etc/stepup.json');
var mongoConnectionString = 'mongodb://' + config.mongo.username + ':' + config.mongo.password + '@kahana.mongohq.com:10067/stepup';
MongoClient.connect(mongoConnectionString, function (err, db) {
    if (err) {
        console.error('failed to connect to db with err ' + err);
        return process.exit(1);
    };

    if ((process.env.CLEAR_DB || '') === 'true') {
        console.log('going to clear db');
        db.collection('activities').remove({}, function (err) {
            if (err) {
                console.log('failed to clear db with err' + err);
                return;
            }
            console.log('cleared db')
        });
    }


    /*
     * Dependencies
     */
    var express = require('express'),
        path = require('path'),
        fs = require('fs'),
        http = require('http'),
        exphbs = require('express3-handlebars'),
        passport = require('./authentication/configurePassport'),
        activityCapture = require('./activityCapture')(db),
        sassMiddleware = require('node-sass-middleware');


    /*
     * Initiate Express
     */
    var app = express();

    app.get('/login', function (req, res) {
        res.render('login');
    });


    app.get('/leaderboard', function (req, res) {
        res.render('leaderboard');
    });

    /*
     * App Configurations
     */
    app.configure(function () {
        app.set('port', process.env.PORT || 5000);

        app.set('views', __dirname + '/views');

        app.set('view engine', 'html');
        app.engine('html', exphbs({
            defaultLayout: 'main',
            extname: '.html'
            //helpers: helpers
        }));
        app.enable('view cache');



        app.use(express.static(path.join(__dirname, 'public')));

        app.use(express.favicon());
        app.use(express.logger('dev'));
        app.use(express.methodOverride());
        app.use(express.bodyParser());
        app.use(express.cookieParser());
        app.use(express.session({
            secret: 'keyboard cfssdfsfsdt'
        }));
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(app.router);
        // app.use(sassMiddleware({
        //     src: __dirname + '/public/styles/src/',
        //     dest: __dirname + '/public/styles/',
        //     debug: true,
        //     outputStyle: 'compressed'
        // }));
    });

    app.configure('development', function () {
        app.use(express.errorHandler());
    });

    /*
     * Route for Index
     */

    function isAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.redirect('/login');
        }
    }

    function makeUserStuff(req) {
        return {
            displayName: req.user.displayName,
            fromReq: JSON.stringify(req.user),
            photos: JSON.stringify(req.user.photos),
            photo: req.user.photos[0].value
        };
    }

    app.get('/login', function (req, res) {
        res.render('index');
    });

    app.get('/', function (req, res) {
        res.redirect('/dashboard');
    });

    app.get('/dashboard', isAuthenticated, function (req, res) {
        res.render('dashboard');
    });

    app.get('/leaderboard', function (req, res) {
        res.render('leaderboard');
    });

    app.get('/profile', isAuthenticated, function (req, res) {
        res.render('profile', {
            user: makeUserStuff(req)
        });
    });

    app.get('/scan', isAuthenticated, function (req, res) {
        res.render('scan');
    });

    app.post('/activity/stairs', isAuthenticated, function (req, res) {
        activityCapture.recordStairClimb(req.user, req.body);
    });

    app.get('/dashboard', isAuthenticated, function (req, res) {
        console.log('req.user' + JSON.stringify(req.user));
        res.render('dashboard', {
            user: makeUserStuff(req)
        });
    });

    if ((process.env.OFFLINE_MODE || '').toLowerCase() === 'true') {
        app.get('/testing/login', function (req, res) {
            res.render('localAuthLoginForm');
        });

        app.post('/testing/login', passport.authenticate('local', {
            successRedirect: '/dashboard',
            failureRedirect: '/testing/login',
            failureFlash: false
        }));
    } else {
        app.get('/auth/twitter', passport.authenticate('twitter'));
        app.get('/auth/twitter/callback',
            passport.authenticate('twitter', {
                successRedirect: '/dashboard',
                failureRedirect: '/login'
            }));
    }


    /*
     * Routes for Robots/404
     */
    app.get('/robots.txt', function (req, res) {
        fs.readFile(__dirname + "/robots.txt", function (err, data) {
            res.header('Content-Type', 'text/plain');
            res.send(data);
        });
    });

    app.get('*', function (req, res) {
        res.render('404');
    });


    http.createServer(app).listen(app.get('port'), function () {
        console.log("Express server listening on port " + app.get('port'));
    });

});
