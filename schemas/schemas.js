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
			trackType: {enum: ['Hiking', 'Biking', 'Boating', 'Offroad', 'Motorcycling', 'Flying', 'Skiing', 'Snowshoeing', 'Getting There']},
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
			trackId: {type: 'string'},
			trackRegionTags: {
				type: 'array',
				items: { type: 'string', maxLength: 100},
				minItems: 1,
				maxItems: 5
			},
			trackLevel: {enum: ['Easy', 'Moderate', 'Difficult']},
			trackType: {enum: ['Hiking', 'Biking', 'Boating', 'Offroad', 'Motorcycling', 'Flying', 'Skiing', 'Snowshoeing', 'Getting There']},
			trackFav: {type: 'boolean'},
			trackName: {type: 'string', maxLength: 200},
			trackDescription: {type: 'string', maxLength: 5000},
			hasPhotos: {type: 'boolean'},
			trackPhotos: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						picName: {type: 'string', maxLength: 200},
						picThumb: {type: 'string', maxLength: 200},
						picIndex: {type: 'number'},
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
		required: ['trackId']
	},
	userRegistrationSchema: {
		type: 'object',
		properties: {
			username: {type: 'string', pattern: '^[^~,;%\\`\'\"<>{}()\\[\\]/]*$', minLength: 6, maxLength: 40},
			email: {type: 'string', format: 'email'},
			password: {type: 'string', pattern: '^[^~,;%\\`\'\"<>{}()\\[\\]/]*$', minLength: 6, maxLength: 18},
			rturl: {type: 'string', format: 'uri'}
		},
		additionalProperties: false,
		required: ['username', 'email', 'password']
	},
	userProfileUpdateSchema: {
		type: 'object',
		properties: {
			email: {type: 'string', format: 'email'},
			password: {type: 'string', pattern: '^[^~,;%\\`\'\"<>{}()\\[\\]/]*$', minLength: 6, maxLength: 18}
		},
		additionalProperties: false
	},
	resetPasswordSchema: {
		type: 'object',
		properties: {
			password: {type: 'string', pattern: '^[^~,;%\\`\'\"<>{}()\\[\\]/]*$', minLength: 6, maxLength: 18}
		},
		additionalProperties: false,
		required: ['password']
	},
	invitationSchema: {
		type: 'object',
		properties: {
			email: {type: 'string', format: 'email'}
		},
		additionalProperties: false
	}
};

module.exports.schemas = schemas;
