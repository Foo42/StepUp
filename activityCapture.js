module.exports = function (db) {
	return {
		recordStairClimb: function (user, climbDetails) {
			console.log('recording stair climb');
			console.log(climbDetails);
			var userPicture;
			try {
				userPicture = user.photos[0].value;
			} catch (e) {

			}

			climbDetails.user = {
				id: user.id,
				name: user.displayName,
				picture: userPicture
			};

			climbDetails.durationInSeconds = ((climbDetails.end.time - climbDetails.start.time) / 1000);

			var activityRecord = {
				type: 'climb',
				date: new Date(climbDetails.start.time),
				details: climbDetails
			}

			var activities = db.collection('activities');
			activities.insert(activityRecord, function (err, docs) {
				if (err) {
					console.error('error saving climb ' + err);
				}

				activities.count(function (err, count) {
					console.log("records count = " + count);
				});
			});
		}
	};
}
