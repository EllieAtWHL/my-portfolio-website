import type { Stadium, StadiumName } from '@/types/spurs-women-admin';

/** Resolves the stadium name that was in effect on a given match date. */
export function getCurrentStadiumName(
  stadiums: Stadium[],
  stadiumNames: StadiumName[],
  stadiumId: string,
  matchDate: string
): string {
  const stadium = stadiums.find(s => s.id === stadiumId);
  if (!stadium) return '';

  const validNames = stadiumNames.filter(sn => {
    if (sn.stadium_id !== stadiumId) return false;

    const validFrom = sn.valid_from ? new Date(sn.valid_from) : null;
    const validTo = sn.valid_to ? new Date(sn.valid_to) : null;
    const matchDateTime = new Date(matchDate);

    if (validFrom && matchDateTime < validFrom) return false;
    if (validTo && matchDateTime > validTo) return false;

    return true;
  });

  if (validNames.length > 0) {
    validNames.sort((a, b) => {
      const dateA = a.valid_from ? new Date(a.valid_from).getTime() : 0;
      const dateB = b.valid_from ? new Date(b.valid_from).getTime() : 0;
      return dateB - dateA;
    });
    return validNames[0].name;
  }

  return stadium.name;
}
