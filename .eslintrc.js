module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es2021: true
	},
	extends: 'standard-with-typescript',
	overrides: [],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'script',
		project: './tsconfig.json'
	},
	rules: {
		'@typescript-eslint/indent': ['error', 'tab'],
		indent: ['error', 'tab'],
		'no-tabs': 'off'
	}
}
