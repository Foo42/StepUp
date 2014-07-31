module.exports = function (db) {
	return {
		getFastestClimbs: function getFastestClimbs(number, periodLength, callback) {
			var activities = db.collection('activities');
			activities.find({
				type: 'climb'
			}).sort({
				"details.durationInSeconds": 1
			}).limit(3).toArray(function (err, docs) {
				callback(err, docs);
			});
		},

		getHighestClimbers: function getHighestClimbers(number, periodLength, callback) {
			var users = db.collection('users');
			users.find({}).sort({
				"totals.stepsAscended": -1
			}).limit(3).toArray(function (err, docs) {
				callback(err, docs);
			});
		},


	}
}
