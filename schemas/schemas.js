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
			trackType: {type: 'string'},
			trackFav: {type: 'boolean'},
			trackGPX: {type: 'string'},
			trackName: {type: 'string'},
			trackDescription: {type: 'string'},
			hasPhotos: {type: 'boolean'},
			trackGPXBlob: {type: 'string', maxLength: 4000000},
			trackPhotos: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						picName: {type: 'string'},
						picThumb: {type: 'string'},
						picLatLng: {
							type: 'array',
							items: {type: 'number'},
							minItems: 2,
							maxItems: 2
						},
						picCaption: {type: 'string'},
						picThumbDataUrl: {type: 'string', minLength:50, maxLength: 100000}
					},
					additionalProperties: false,
					required: ['picName', 'picThumb', 'picCaption', 'picThumbDataUrl']
				}
			}
		},
		additionalProperties: false,
		required: ['trackLatLng', 'trackRegionTags', 'trackLevel', 'trackFav', 'trackGPX', 'trackName', 'trackDescription', 'hasPhotos', 'trackGPXBlob']
	},
	trackEditSchema: {
		type: 'object',
		properties: {
			trackRegionTags: {
				type: 'array',
				items: { type: 'string'},
				minItems: 1
			},
			trackLevel: {type: 'string'},
			trackType: {type: 'string'},
			trackFav: {type: 'boolean'},
			trackName: {type: 'string'},
			trackDescription: {type: 'string'},
		},
		additionalProperties: false
	},
	userRegistrationSchema: {
		type: 'object',
		properties: {
			username: {type: 'string', pattern: '^[^~,;%\\`\'\"<>{}()\\[\\]/]*$', minLength: 6, maxLength: 40},
			email: {type: 'string', format: 'email'},
			password: {type: 'string', pattern: '^[^~,;%\\`\'\"<>{}()\\[\\]/]*$', minLength: 6, maxLength: 18},
			invitationCode: {type: 'string', minLength:4, maxLength:20}
		},
		additionalProperties: false,
		required: ['username', 'email', 'password', 'invitationCode']
	},
	userProfileUpdateSchema: {
		type: 'object',
		properties: {
			email: {type: 'string', format: 'email'},
			password: {type: 'string', pattern: '^[^~,;%\\`\'\"<>{}()\\[\\]/]*$', minLength: 6, maxLength: 18}
		},
		additionalProperties: false
	}
}

module.exports.schemas = schemas;