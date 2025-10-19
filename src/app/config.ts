export const MAIN_COLOR = '#9ef147'

export const GOOGLE_MAP_DEFAULT_CENTER = { lat: 34.682952, lng: 135.532147 };
export const GOOGLE_MAP_DEFAULT_ZOOM = 12;
export const GOOGLE_MAP_MAX_ZOOM = 20
export const GOOGLE_MAP_MIN_ZOOM = 8

export const styledMapTypeOptions = [
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [
      {
        color: '#bbbbbb'
      }
    ]
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [
      {
        color: '#999999'
      }
    ]
  },
  {
    featureType: 'transit.line',
    elementType: 'geometry',
    stylers: [{ color: '#999999' }]
  },
  {
    featureType: 'transit.line',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#dddddd' }]
  }
]