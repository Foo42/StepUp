function calculateStepsClimbed(climbDetails) {
	var startFloor = climbDetails.start.floor;
	var endFloor = climbDetails.end.floor;

	var stairsByFloor = {
		'12': {
			steps: 24,
			calories: 17
		},
		'11': {
			steps: 24,
			calories: 17
		},
		'10': {
			steps: 24,
			calories: 17
		},
		'9': {
			steps: 24,
			calories: 17
		},
		'8': {
			steps: 24,
			calories: 17
		},
		'7': {
			steps: 24,
			calories: 17
		},
		'6': {
			steps: 24,
			calories: 17
		},
		'5': {
			steps: 24,
			calories: 17
		},
		'4': {
			steps: 24,
			calories: 17
		},
		'3': {
			steps: 24,
			calories: 17
		},
		'2': {
			steps: 24,
			calories: 17
		},
		'1': {
			steps: 26,
			calories: 18
		},
		'0': {
			steps: 22,
			calories: 15
		},
		'-1': {
			steps: 16,
			calories: 11
		},
		'-2': {
			steps: 16,
			calories: 11
		},
		'-3': {
			steps: 16,
			calories: 11
		}
	};

	if (startFloor >= endFloor) {
		return 0;
	}

	var totalSteps = 0;
	for (var floor = endFloor; floor != startFloor; --floor) {
		//console.log('looping. floor = ' + floor);
		totalSteps += stairsByFloor[floor + ''].steps;
	}

	return totalSteps;
}

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
			climbDetails.stairsAscended = calculateStepsClimbed(climbDetails);
			console.log('stairsAscended = ' + climbDetails.stairsAscended);

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
