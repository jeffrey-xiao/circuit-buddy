module.exports = {
	entry: "./static/js/src/app.js",
	output: {
		path: __dirname + "/static/js/dist",
		filename: "bundle.js"
	},
	resolve: {
		alias: {
			'vue$': 'vue/dist/vue.common.js'
		}
	},
	module: {
		loaders: [
			{
				test: /\.js$/,
        		loader: 'babel',
        		exclude: /node_modules/
      		},
		    {
				test: /\.vue$/,
				loader: 'vue'
			}
		]
	},
  	vue: {
  		loaders: {
      		js: 'babel'
      	}
  	}
}