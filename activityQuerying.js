var moment = require('moment');

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

		getRecentActivities: function getRecentActivities(number, callback) {
			var activities = db.collection('activities');
			activities.find({}).sort({
				date: -1
			}).limit(number).toArray(function (err, docs) {
				if (err) {
					return callback(err);
				}
				docs.forEach(function (doc) {
					var formattedDate = moment(doc.date).format('h:mm a - dddd Do MMM YYYY');
					doc.formattedDate = formattedDate;
				});
				callback(null, docs);
			});
		}
	}
}
