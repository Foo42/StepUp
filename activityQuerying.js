module.exports = function (db) {
	return {
		getFastestClimbs: function (number, callback) {
			db.find({​
				type: "climb"
			}).sort({
				"details.durationInSeconds": 1
			}).limit(3).toArray(function (err, docs) {
				callback(err, docs);
			});
		}
	};
}
