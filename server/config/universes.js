const universeConfig = [
  { id: 'mcu', slug: 'mcu', name: 'Marvel Cinematic Universe', shortName: 'MCU', type: 'shared-universe', description: 'Marvel Cinematic Universe', featured: true, tmdbCollectionIds: [86311], tmdbCompanyIds: [], tmdbKeywordIds: [] },
  { id: 'dc', slug: 'dc', name: 'DC', shortName: 'DC', type: 'shared-universe', description: 'DC screen universes and stories.', featured: true, membershipStrategy: 'dc', explicitPrimaryMovieIds: [192, 8536, 9531, 11411, 268, 364, 414, 155, 272, 209112, 49521, 297761, 297762, 141052, 297802, 287947, 495764, 464052, 436270, 298618, 565770], tmdbCollectionIds: [], tmdbCompanyIds: [9993], tmdbKeywordIds: [] },
  { id: 'star-wars', slug: 'star-wars', name: 'Star Wars', shortName: 'STAR WARS', type: 'franchise', description: 'Stories from a galaxy far, far away.', featured: true, tmdbCollectionIds: [10], tmdbCompanyIds: [], tmdbKeywordIds: [] },
  { id: 'wizarding-world', slug: 'wizarding-world', name: 'Wizarding World', shortName: 'WIZARDING WORLD', type: 'franchise', description: 'Magic, myth, and the worlds of wizardry.', featured: true, tmdbCollectionIds: [1241], tmdbCompanyIds: [], tmdbKeywordIds: [] },
  { id: 'jurassic', slug: 'jurassic', name: 'Jurassic', shortName: 'JURASSIC', type: 'franchise', description: 'Life finds a way.', featured: true, tmdbCollectionIds: [328], tmdbCompanyIds: [], tmdbKeywordIds: [] },
  { id: 'conjuring', slug: 'conjuring', name: 'Conjuring Universe', shortName: 'CONJURING', type: 'shared-universe', description: 'Supernatural cases and haunted histories.', featured: true, tmdbCollectionIds: [313086], tmdbCompanyIds: [], tmdbKeywordIds: [] },
  { id: 'monsterverse', slug: 'monsterverse', name: 'MonsterVerse', shortName: 'MONSTERVERSE', type: 'shared-universe', description: 'Titans awaken.', featured: true, tmdbCollectionIds: [535313], tmdbCompanyIds: [], tmdbKeywordIds: [] },
  { id: 'john-wick', slug: 'john-wick', name: 'John Wick', shortName: 'JOHN WICK', type: 'franchise', description: 'Consequences are coming.', featured: true, tmdbCollectionIds: [404609], tmdbCompanyIds: [], tmdbKeywordIds: [] },
  { id: 'transformers', slug: 'transformers', name: 'Transformers', shortName: 'TRANSFORMERS', type: 'franchise', description: 'More than meets the eye.', featured: true, tmdbCollectionIds: [8650], tmdbCompanyIds: [], tmdbKeywordIds: [] },
]

module.exports = { universeConfig }
