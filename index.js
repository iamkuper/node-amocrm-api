var assert = require('assert');
var ApiClient = require('apiapi');
var request = require('axios');
var Promise = require('bluebird');

const REQUEST_DELAY = 150;


function delayedRequest () {
	var args = arguments;
	return new Promise(function (resolve, reject) {
		setTimeout(function callRequest () {
			return request.apply(request, args)
				.then(resolve)
				.catch(reject);
		}, REQUEST_DELAY);
	});
}

module.exports = function buildClient (config) {

	assert(typeof config.domain === 'string', 'config.domain must be string');

	const zone = config.zone || 'ru';
	const baseUrl = `https://${ config.domain }.amocrm.${ zone }`;


	const auth = config.auth;

	
	var client = new ApiClient({
		baseUrl: baseUrl,
	    headers: {
	        'user-agent': 'node-amocrm-api/2.0'
	    },

	    auth: function (params, requestBody, opts) {

	    	// Old auth type
	    	if (auth.hash && auth.login) {
	    		params.USER_LOGIN = auth.login;
	    		params.USER_HASH = auth.hash;
	    	} 

	    	// oAuth
	    	if (auth.access_token) {
	    		opts.headers = { 'Authorization': `Bearer ${ auth.access_token }` };
	    	}

	    	if (!auth.hash || !auth.access_token) {
	    		throw new Error('Undefined amoCRM auth data');
	    	}
	        
	        return [params, requestBody, opts];
	    }

		methods: {
			
			// Account
			getAccount: 'get /api/v2/account',

			// Companies
			getCompanies: 'get /api/v2/companies'
		
		},

		transformRequest: {
			getAccount: (params, requestBody, opts) => {
				if (params.with && (typeof params.with === 'array')) {
					params.with = params.with.join(',');
				}
				return this.auth(params, requestBody, opts);
			}
		},

		transformResponse: {
			getAccount: (res) => {
				console.log(res);
				assert(res.data.response.links.length && res.status === 200, 'Get Contacts Links due to some error');
				return res.data.response.links;
			}
		}
	});

	client.request = delayedRequest;
	return client;
};