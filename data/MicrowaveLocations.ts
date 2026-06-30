type MicrowaveLocation = {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  description: string;
  note?: string;
};

export const MICROWAVE_LOCATIONS = [
  {
    name: 'Mason Hall',
    address: '500 S State St, Ann Arbor, MI 48109',
    coordinates: {
      latitude: 42.276489,
      longitude: -83.738451,
    },
    description: 'Ground floor near the main entrance.',
  },
  {
    name: 'Angell Hall',
    address: '435 S State St, Ann Arbor, MI 48109',
    coordinates: {
      latitude: 42.276806,
      longitude: -83.737694,
    },
    description: 'Basement student lounge area.',
  },
  {
    name: 'Michigan Union',
    address: '530 S State St, Ann Arbor, MI 48109',
    coordinates: {
      latitude: 42.274942,
      longitude: -83.742887,
    },
    description: '1st floor near the food court.',
  },
  {
    name: 'Undergraduate Science Building (USB)',
    address: '204 Washtenaw Ave, Ann Arbor, MI 48109',
    coordinates: {
      latitude: 42.276048,
      longitude: -83.731902,
    },
    description: 'Ground floor vending area.',
  },
  {
    name: 'West Hall',
    address: '1085 S University Ave, Ann Arbor, MI 48109',
    coordinates: {
      latitude: 42.275063,
      longitude: -83.737419,
    },
    description: 'Student lounge on the 1st floor.',
  },
  {
    name: 'Pierpont Commons (North Campus)',
    address: '2101 Bonisteel Blvd, Ann Arbor, MI 48109',
    coordinates: {
      latitude: 42.292896,
      longitude: -83.715766,
    },
    description: 'Near the food court on the main level.',
  },
  {
    name: 'Shapiro Undergraduate Library',
    address: '919 S University Ave, Ann Arbor, MI 48109',
    coordinates: {
      latitude: 42.276333,
      longitude: -83.738833,
    },
    description: 'Lower level student lounge.',
  },
  {
    name: 'East Quad',
    address: '701 E University Ave, Ann Arbor, MI 48109',
    coordinates: {
      latitude: 42.27563,
      longitude: -83.733479,
    },
    description: 'Common room near the dining hall entrance.',
  },
  {
    name: 'North Quad',
    address: '105 S State St, Ann Arbor, MI 48109',
    coordinates: {
      latitude: 42.280228,
      longitude: -83.742363,
    },
    description: 'Ground floor lounge.',
  },
  {
    name: 'Duderstadt Center (North Campus)',
    address: '2281 Bonisteel Blvd, Ann Arbor, MI 48109',
    coordinates: {
      latitude: 42.291222,
      longitude: -83.716108,
    },
    description: '1st floor near the vending machines.',
  },
] as const satisfies MicrowaveLocation[];
