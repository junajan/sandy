module.exports = {
	env: 'PROD',
	mysql: {
		user: "root",
		password: "",
		database: "sandy",
		host: 'localhost',
		// showSQL: true,
	},
	email: {
		enabled: false,
		from: "Sandy Bot <mail@sandy.janjuna.cz>",
		email: 'mail@janjuna.cz'
	},
	ibApi: {
		host: '127.0.0.1',
		port: 4001
	},
	logFile: '/var/log/syslog',
	livereload: true,
	sessionSecret: 'old man is standing still on the coast'
};