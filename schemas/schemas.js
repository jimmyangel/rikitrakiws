var schemas = {
	trackSchema: {
		type: "object",
		properties: {
			trackLatLng: {
				type: "array",
				items: {type: "number"}
			},
			trackRegionTags: {
				type: "array",
				items: { type: "string"}
			},
			trackLevel: {type: "string"},
			trackFav: {type: "boolean"},
			trackGPX: {type: "string"},
			trackName: {type: "string"},
			trackDescription: {type: "string"},
			trackGPXBlob: {type: "string"}
		},
		additionalProperties: false
	}
}

module.exports.schemas = schemas;