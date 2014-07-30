var passport = require('passport');
module.exports = passport;

passport.serializeUser(function (user, done) {
	console.log('in serializeUser. user = ' + JSON.stringify(user));
	done(null, user);
});

passport.deserializeUser(function (obj, done) {
	//attach context engine here?
	console.log("deserializeUser: " + JSON.stringify(obj));
	done(null, obj);
});

if ((process.env.OFFLINE_MODE || '').toLowerCase() === 'true') {
	console.log('Using offline authentication Strategy');
	var LocalStratergy = require('passport-local').Strategy;

	function verificationFunction(username, password, done) {
		console.log('in localStratergy auth verify method with ' + arguments);
		var user = {
			displayName: username,
			name: username,
			id: username,
			username: username,
			photos: [{
				value: 'http://placekitten.com/g/150/150'
			}]
		};
		return done(null, user);
	}
	passport.use(new LocalStratergy(verificationFunction));
} else {
	console.log('configuring twitter authentication Strategy');
	var TwitterStrategy = require('passport-twitter').Strategy;
	var config = require(process.env.CONFIG_PATH || '/etc/stepup.json');

	passport.use(new TwitterStrategy({
			consumerKey: config.twitter.consumerKey,
			consumerSecret: config.twitter.consumerSecret,
			callbackURL: "http://stairs.taggedstuff.net/auth/twitter/callback"
		},
		function (token, tokenSecret, profile, done) {
			console.log('in twitter auth verify function');
			done(null, profile);
			// User.findOrCreate(..., function (err, user) {
			// 	if (err) {
			// 		return done(err);
			// 	}
			// 	done(null, user);
			// });
		}
	));
}
