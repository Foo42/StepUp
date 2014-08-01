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

	var totalStairs = 0;
	var totalCalories = 0;
	var totalFlights = 0;
	for (var floor = endFloor; floor != startFloor; --floor) {
		//console.log('looping. floor = ' + floor);
		var flight = stairsByFloor[floor + ''];
		totalStairs += flight.steps;
		totalCalories += flight.calories;
		totalFlights++
	}


	var stepHeight = 4 / 22; //massive guess!! 4 metres per floor with 22 steps????

	return {
		stairs: totalStairs,
		calories: totalCalories,
		flights: totalFlights,
		metres: stepHeight * totalStairs
	};
}

function storeActivityRecord(db, user, climbDetails, callback) {
	console.log('storing climb details to activityRecords');

	var userPicture;
	try {
		userPicture = user.photos[0].value;
	} catch (e) {

	}

	var activityRecord = {
		_id: user.id + '-' + climbDetails.start.time,
		type: 'climb',
		date: new Date(parseInt(climbDetails.start.time)),
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
			return callback(err);
		}
		callback(null);
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
			newUserRecord.dateStartedClimbing = new Date();
			newUserRecord.totals = {
				stepsAscended: climbDetails.stepsAscended,
				caloriesUsed: climbDetails.caloriesUsed,
				metresAscended: climbDetails.metresAscended,
				time: climbDetails.durationInSeconds
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
					'totals.stepsAscended': climbDetails.stepsAscended,
					'totals.caloriesUsed': climbDetails.caloriesUsed,
					'totals.metresAscended': climbDetails.metresAscended,
					'totals.time': climbDetails.durationInSeconds
				},
				$min: {
					'bestTime': climbDetails.durationInSeconds
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
	climbDetails.stepsAscended = climbInfo.stairs;
	climbDetails.caloriesUsed = climbInfo.calories;
	climbDetails.flightsAscended = climbInfo.flights;
	climbDetails.metresAscended = climbInfo.metres;
}

module.exports = function (db) {
	return {
		recordStairClimb: function (user, climbDetails) {
			console.log('recording stair climb');
			console.log(climbDetails);

			augmentClimbDetails(climbDetails);
			storeActivityRecord(db, user, climbDetails, function (err) {
				if (!err) {
					storeToUserProfile(db, user, climbDetails);
				}
			});

			console.log('stairsAscended = ' + climbDetails.stairsAscended);
		}
	};
}
