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
				items: { type: 'string', maxLength: 100},
				minItems: 1,
				maxItems: 5
			},
			trackLevel: {enum: ['Easy', 'Moderate', 'Difficult']},
			trackType: {enum: ['Hiking', 'Biking', 'Boating', 'Offroad']},
			trackFav: {type: 'boolean'},
			trackGPX: {type: 'string'},
			trackName: {type: 'string', maxLength: 200},
			trackDescription: {type: 'string', maxLength: 5000},
			hasPhotos: {type: 'boolean'},
			trackGPXBlob: {type: 'string', maxLength: 4000000},
			trackPhotos: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						picName: {type: 'string', maxLength: 200},
						picThumb: {type: 'string', maxLength: 200},
						picLatLng: {
							type: 'array',
							items: {type: 'number'},
							minItems: 2,
							maxItems: 2
						},
						picCaption: {type: 'string', maxLength: 200},
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
				items: { type: 'string', maxLength: 100},
				minItems: 1,
				maxItems: 5
			},
			trackLevel: {enum: ['Easy', 'Moderate', 'Difficult']},
			trackType: {enum: ['Hiking', 'Biking', 'Boating', 'Offroad']},
			trackFav: {type: 'boolean'},
			trackName: {type: 'string', maxLength: 200},
			trackDescription: {type: 'string', maxLength: 5000},
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