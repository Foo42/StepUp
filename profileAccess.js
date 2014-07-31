module.exports = function (db) {
	return {
		getProfileForUser: function getProfileForUser(user, callback) {
			var users = db.collection('users');
			users.findOne({
				id: user.id
			}, callback);
		},

		getStatsForPeriod: function getStatsForPeriod(user, periodLength, callback) {
			var activities = db.collection('activities');
			var today = new Date();
			var milliSecondsInPeriod = periodLength * 24 * 60 * 60 * 1000;
			var periodStart = new Date(today.getTime() - milliSecondsInPeriod);
			activities.aggregate([{
				$match: {
					type: 'climb',
					'user.id': user.id + '',
					'date': {
						$gt: periodStart
					}
				}
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
				var stats = docs[0];
				callback(null, stats);
			});
		},
	}
}
