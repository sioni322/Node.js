//module_crypto.js : Do encryption by Sion Lee

var crypto = require('crypto');
var encrypt_key;

//Do encryption using SHA256 algorithm and salting
module.exports = {
	encrypt_await: function(string) {
		return new Promise(function(resolve, reject) {
			var encrypt_key;

			console.log(string);
			crypto.randomBytes(64, function(error, buf) {
				var salt = buf.toString('base64');
				crypto.pbkdf2(string, salt, 10000, 64, 'sha256', function(error, key) {
					encrypt_key = key.toString('base64');
					resolve(encrypt_key);
					console.log(encrypt_key);
				});
			});
		});
	},

	encrypt: async function(string) {
		var encrypt_key = await encrypt_await(string);
		return encrypt_key;
	}
}
