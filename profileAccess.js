module.exports = function (db) {
	return {
		getProfileForUser: function getProfileForUser(user, callback) {
			var users = db.collection('users');
			users.findOne({
				id: user.id
			}, callback);
		}
	}
}
