function calculateClimbInfo(climbDetails) {
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
	var totalCalories = 0;
	var totalFlights = 0;
	for (var floor = endFloor; floor != startFloor; --floor) {
		//console.log('looping. floor = ' + floor);
		var flight = stairsByFloor[floor + ''];
		totalSteps += flight.steps;
		totalCalories += flight.calories;
		totalFlights++
	}

	return {
		stairs: totalSteps,
		calories: totalCalories,
		flights: totalFlights
	};
}

function storeActivityRecord(db, climbDetails) {
	console.log('storing climb details to activityRecords');

	var userPicture;
	try {
		userPicture = user.photos[0].value;
	} catch (e) {

	}

	var activityRecord = {
		type: 'climb',
		date: new Date(climbDetails.start.time),
		details: climbDetails,
		user: {
			id: user.id,
			name: user.displayName,
			picture: userPicture
		}
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

function storeToUserProfile(db, user, climbDetails) {
	console.log('storing climb details to user profile');
	var users = db.collection('users');
	users.findOne({
		id: user.id
	}, function (err, doc) {
		if (err || !doc) {
			console.log('no user, creating');
			var newUserRecord = user;
			newUserRecord.totals = {
				stepsAscended: climbDetails.stairsAscended
			};
			users.insert(newUserRecord, function (err) {
				if (err) {
					console.log('error creating user record ' + err);
				} else {
					console.log('user record created')
				}
			});
		} else {
			console.log('user found, updating');
			users.update({
				id: user.id
			}, {
				$inc: {
					quantity: climbDetails.stairsAscended
				}
			}, {
				upsert: false
			}, function (err) {
				if (err) {
					console.log('error updating user record ' + err);
				} else {
					console.log('user record updated')
				}
			});
		}
	});
};


function augmentClimbDetails(climbDetails) {
	climbDetails.durationInSeconds = ((climbDetails.end.time - climbDetails.start.time) / 1000);
	var climbInfo = calculateClimbInfo(climbDetails);
	climbDetails.stairsAscended = climbInfo.stairs;
	climbDetails.caloriesUsed = climbInfo.calories;
	climbDetails.flightsAscended = climbDetails.flights;
}

module.exports = function (db) {
	return {
		recordStairClimb: function (user, climbDetails) {
			console.log('recording stair climb');
			console.log(climbDetails);

			augmentClimbDetails(climbDetails);
			storeActivityRecord(db, climbDetails);
			storeToUserProfile(db, user, climbDetails);

			console.log('stairsAscended = ' + climbDetails.stairsAscended);
		}
	};
}
