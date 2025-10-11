/**
 * JSON Schema for LibraryData validation
 */
export const libraryDataSchema = {
  type: 'object',
  required: ['releases', 'artists'],
  properties: {
    releases: {
      type: 'array',
      items: {
        type: 'object',
        required: ['artistRymIds', 'title', 'rymId', 'cover', 'media'],
        properties: {
          artistRymIds: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            description: 'Array of RateYourMusic artist IDs'
          },
          title: {
            type: 'string',
            minLength: 1,
            description: 'Release title'
          },
          rymId: {
            type: 'string',
            minLength: 1,
            description: 'RateYourMusic release ID'
          },
          rymUrl: {
            type: 'string',
            description: 'RateYourMusic release URL'
          },
          cover: {
            type: 'string',
            minLength: 1,
            description: 'Cover image filename'
          },
          media: {
            type: 'object',
            properties: {
              spotify: { type: 'string' },
              appleMusic: { type: 'string' },
              youtubeMusic: { type: 'string' },
              tidal: { type: 'string' },
              bandcamp: { type: 'string' }
            },
            description: 'Media player links'
          }
        }
      }
    },
    artists: {
      type: 'array',
      items: {
        type: 'object',
        required: ['displayName', 'rymId'],
        properties: {
          displayName: {
            type: 'string',
            minLength: 1,
            description: 'Artist display name'
          },
          rymId: {
            type: 'string',
            minLength: 1,
            description: 'RateYourMusic artist ID'
          },
          rymUrl: {
            type: 'string',
            description: 'RateYourMusic artist URL'
          }
        }
      }
    }
  }
} as const
