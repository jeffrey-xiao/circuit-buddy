module.exports = {
	entry: "./static/js/src/app.js",
	output: {
		path: __dirname + "/static/js/dest",
		filename: "bundle.js"
	},
	resolve: {
		alias: {
			'vue$': 'vue/dist/vue.common.js'
		}
	}
}