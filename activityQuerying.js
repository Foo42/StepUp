module.exports = function (db) {
	return {
		getFastestClimbs: function getFastestClimbs(number, callback) {
			var activities = db.collection('activities');
			activities.find({
				type: 'climb'
			}).sort({
				"details.durationInSeconds": 1
			}).limit(3).toArray(function (err, docs) {
				callback(err, docs);
			});
		},

		getHighestClimbers: function getFastestClimbs(number, callback) {
			var activities = db.collection('activities');
			activities.find({
				type: 'climb'
			}).sort({
				"details.durationInSeconds": 1
			}).limit(3).toArray(function (err, docs) {
				callback(err, docs);
			});
		}
	}
}
