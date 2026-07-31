import { getCurrentStadiumName } from '../admin-stadium-names';
import type { Stadium, StadiumName } from '@/types/spurs-women-admin';

const stadium: Stadium = {
  id: 'stadium-1',
  name: 'White Hart Lane',
  slug: 'white-hart-lane',
  city: 'London',
  country: 'England',
  capacity: null,
  opened_date: null,
  address_line_1: null,
  postcode: null,
  latitude: null,
  longitude: null,
  home_team_id: 1,
};

const names: StadiumName[] = [
  { id: 'name-1', stadium_id: 'stadium-1', name: 'White Hart Lane', valid_from: null, valid_to: '2017-05-14' },
  { id: 'name-2', stadium_id: 'stadium-1', name: 'Tottenham Hotspur Stadium', valid_from: '2019-04-03', valid_to: null },
];

describe('getCurrentStadiumName', () => {
  it('falls back to the base stadium name when the stadium is unknown', () => {
    expect(getCurrentStadiumName([], names, 'stadium-1', '2020-01-01')).toBe('');
  });

  it('falls back to the base stadium name when no name record covers the date', () => {
    expect(getCurrentStadiumName([stadium], [], 'stadium-1', '2020-01-01')).toBe('White Hart Lane');
  });

  it('picks the name record whose validity window covers the match date', () => {
    expect(getCurrentStadiumName([stadium], names, 'stadium-1', '2016-01-01')).toBe('White Hart Lane');
    expect(getCurrentStadiumName([stadium], names, 'stadium-1', '2022-01-01')).toBe('Tottenham Hotspur Stadium');
  });

  it('picks the most recent name when multiple records could match', () => {
    const overlapping: StadiumName[] = [
      ...names,
      { id: 'name-3', stadium_id: 'stadium-1', name: 'Sponsor Stadium', valid_from: '2020-01-01', valid_to: null },
    ];
    expect(getCurrentStadiumName([stadium], overlapping, 'stadium-1', '2021-01-01')).toBe('Sponsor Stadium');
  });
});
