var schemas = {
	trackSchema: {
		type: 'object',
		properties: {
			trackLatLng: {
				type: 'array',
				items: {type: 'number'},
				minItems: 2,
				maxItems: 2
			},
			trackRegionTags: {
				type: 'array',
				items: { type: 'string'},
				minItems: 1
			},
			trackLevel: {type: 'string'},
			trackFav: {type: 'boolean'},
			trackGPX: {type: 'string'},
			trackName: {type: 'string'},
			trackDescription: {type: 'string'},
			trackGPXBlob: {type: 'string'}
		},
		additionalProperties: false,
		required: ['trackLatLng', 'trackRegionTags', 'trackLevel', 'trackFav', 'trackGPX', 'trackName', 'trackDescription', 'trackGPXBlob']
	},
	userRegistrationSchema: {
		type: 'object',
		properties: {
			username: {type: 'string'},
			email: {type: 'string', format: 'email'},
			password: {type: 'string'},
			invitationCode: {type: 'string'}
		},
		additionalProperties: false,
		required: ['username', 'email', 'password', 'invitationCode']
	}
}

module.exports.schemas = schemas;