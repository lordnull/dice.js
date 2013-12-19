// Karma configuration

module.exports = function(config){
	config.set({
		frameworks: ["jasmine"],

		// list of files / patterns to load in the browser
		files: [
			'tests/underscore-min.js',
			'build/dice.js',
			'tests/dice.spec.js'
		],

		// Start these browsers, currently available:
		// - Chrome
		// - ChromeCanary
		// - Firefox
		// - Opera
		// - Safari (only Mac)
		// - PhantomJS
		// - IE (only Windows)
		browsers: ['Chrome'],

		logLevel: config.LOG_INFOj,

		port: 9876,

		reporters: ['progress'],

		runnerPort: 9100

	});
}

