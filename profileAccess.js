var async = require('async');

module.exports = function (db) {

	var getStatsForPeriod = function getStatsForPeriod(user, periodLength, callback) {
		var activities = db.collection('activities');
		var today = new Date();
		var milliSecondsInPeriod = periodLength * 24 * 60 * 60 * 1000;
		var periodStart = new Date(today.getTime() - milliSecondsInPeriod);

		var matchRequirements = {
			type: 'climb',
			'user.id': user.id + ''
		};

		var getStatsForAllTime = periodLength < 0;
		if (!getStatsForAllTime) {
			matchRequirements.date = {
				$gt: periodStart
			}
		}

		activities.aggregate([{
			$match: matchRequirements
		}, {
			$group: {
				_id: 'hello',
				'totalSteps': {
					$sum: '$details.stepsAscended'
				},
				'fastestTime': {
					$min: '$details.durationInSeconds'
				}
			}
		}], function (err, docs) {
			if (err) {
				console.error('error getting stats for period ' + err);
				return callback(err);
			}
			console.log('stats for period = ' + JSON.stringify(docs));
			var stats = docs[0] || {
				totalSteps: 0
			};
			callback(null, stats);
		});
	}

	return {
		getProfileForUser: function getProfileForUser(user, callback) {
			var users = db.collection('users');
			async.parallel({
				profile: users.findOne.bind(users, {
					id: user.id
				}),
				allTimeStats: getStatsForPeriod.bind(null, user, -1)
			}, function (err, results) {
				if (err) {
					return callback(err);
				}
				results.profile.totals.stepsAscended = results.allTimeStats.totalSteps;
				results.profile.totals.bestTime = results.allTimeStats.fastestTime;
				callback(null, results.profile);
			});
		},

		getStatsForPeriod: getStatsForPeriod
	}
}
