var MongoClient = require('mongodb').MongoClient;
var config = require(process.env.CONFIG_PATH || '/etc/stepup.json');
var moment = require('moment');
var async = require('async');
var mongoConnectionString = 'mongodb://' + config.mongo.username + ':' + config.mongo.password + '@kahana.mongohq.com:10067/stepup';
MongoClient.connect(mongoConnectionString, function (err, db) {
    if (err) {
        console.error('failed to connect to db with err ' + err);
        return process.exit(1);
    };
    console.log('connected to mongo');

    if ((process.env.CLEAR_DB || '') === 'true') {
        console.log('going to clear db');
        db.collection('activities').remove({}, function (err) {
            if (err) {
                console.log('failed to clear db with err' + err);
                return;
            }
            console.log('cleared activities');
            db.collection('users').remove({}, function (err) {
                console.log('cleared users');
                console.log('cleared db')
            });
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
        activityQuerying = require('./activityQuerying')(db),
        profileAccess = require('./profileAccess')(db),
        sassMiddleware = require('node-sass-middleware');


    /*
     * Initiate Express
     */
    var app = express();

    // app.get('/login', function (req, res) {
    //     res.render('login');
    // });


    // app.get('/leaderboard', function (req, res) {
    //     res.render('leaderboard');
    // });

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
        res.render('login');
    });

    app.get('/', function (req, res) {
        res.redirect('/dashboard');
    });



    app.get('/leaderboard', isAuthenticated, function (req, res) {
        async.parallel({
            fastest: activityQuerying.getFastestClimbs.bind(activityQuerying, 3, -1),
            highest: activityQuerying.getHighestClimbers.bind(activityQuerying, 3, -1),
            userProfile: profileAccess.getProfileForUser.bind(profileAccess, req.user),
            sevenDayStats: profileAccess.getStatsForPeriod.bind(profileAccess, req.user, 7)
        }, function (err, results) {
            if (err) {
                return res.send(500);
            }
            var climbs = results.fastest;
            console.log('fastests climbs: ' +
                JSON.stringify(climbs));

            var trophyImages = {
                1: 'images/badges/first.png',
                2: 'images/badges/second.png',
                3: 'images/badges/third.png',
            }
            var fastestViewModel = (function () {
                var position = 1;
                return climbs.map(function (climbRecord) {
                    var formattedDate = moment(new Date(parseInt(climbRecord.details.start.time))).format('h:mm a - dddd Do MMM YYYY');
                    return {
                        trophyImage: trophyImages[position],
                        position: position++,
                        user: climbRecord.user || climbRecord.details.user,
                        durationInSeconds: climbRecord.details.durationInSeconds,
                        whenDone: formattedDate
                    };
                });
            })();

            var highestViewModel = (function () {
                var position = 1;
                return results.highest.map(function (user) {
                    var userPicture;
                    try {
                        userPicture = user.photos[0].value;
                    } catch (e) {}
                    return {
                        trophyImage: trophyImages[position],
                        position: position++,
                        user: {
                            name: user.name,
                            picture: userPicture
                        },
                        stairs: user.totals.stepsAscended,
                    };
                });
            })();

            console.log('highest vm: ' + JSON.stringify(highestViewModel));
            console.log('user profile ' + JSON.stringify(results.userProfile));

            var viewModel = {
                leaderboards: {
                    allTimeFastest: fastestViewModel,
                    allTimeHighest: highestViewModel
                },
                userProfile: results.userProfile,
                sevenDayStats: results.sevenDayStats
            };

            console.log('viewmodel = ' + JSON.stringify(viewModel));
            res.render('leaderboard', viewModel);
        });

    });

    app.get('/profile', isAuthenticated, function (req, res) {
        async.parallel({
            profile: profileAccess.getProfileForUser.bind(profileAccess, req.user),
            sevenDayStats: profileAccess.getStatsForPeriod.bind(profileAccess, req.user, 7)
        }, function (err, results) {
            if (err) {
                return res.send(err);
            }
            res.render('profile', {
                user: makeUserStuff(req),
                profile: results.profile,
                sevenDayStats: results.sevenDayStats
            });
        });

    });

    app.get('/scan', isAuthenticated, function (req, res) {
        res.render('scan2');
    });

    app.post('/activity/stairs', isAuthenticated, function (req, res) {
        activityCapture.recordStairClimb(req.user, req.body);
    });

    app.get('/dashboard', isAuthenticated, function (req, res) {
        async.parallel({
            profile: profileAccess.getProfileForUser.bind(profileAccess, req.user),
            sevenDayStats: profileAccess.getStatsForPeriod.bind(profileAccess, req.user, 7),
            recentActivities: activityQuerying.getRecentActivities.bind(activityQuerying, 2)
        }, function (err, results) {
            if (err) {
                return res.send(err);
            }

            var vm = {
                userProfile: results.profile,
                sevenDayStats: results.sevenDayStats,
                activities: results.recentActivities
            }
            console.log('dashboard vm ' + JSON.stringify(vm));
            res.render('dashboard', vm);
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
