import { FormField, NumberInput } from './FormField';
import type { MatchForm } from './MatchForm';

interface MatchStatsFieldsProps {
  matchForm: Partial<MatchForm>;
  setMatchForm: (form: Partial<MatchForm>) => void;
}

export function MatchStatsFields({ matchForm, setMatchForm }: MatchStatsFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Possession */}
      <FormField label="Home Possession (%)" htmlFor="home-possession">
        <NumberInput
          id="home-possession"
          value={matchForm.home_possession}
          onChange={(value) => setMatchForm({ ...matchForm, home_possession: value })}
          min={0}
          max={100}
          step="0.1"
        />
      </FormField>
      <FormField label="Away Possession (%)" htmlFor="away-possession">
        <NumberInput
          id="away-possession"
          value={matchForm.away_possession}
          onChange={(value) => setMatchForm({ ...matchForm, away_possession: value })}
          min={0}
          max={100}
          step="0.1"
        />
      </FormField>

      <FormField label="Home Total Shots" htmlFor="home-total-shots">
        <NumberInput
          id="home-total-shots"
          value={matchForm.home_total_shots}
          onChange={(value) => setMatchForm({ ...matchForm, home_total_shots: value })}
          min={0}
        />
      </FormField>
      <FormField label="Away Total Shots" htmlFor="away-total-shots">
        <NumberInput
          id="away-total-shots"
          value={matchForm.away_total_shots}
          onChange={(value) => setMatchForm({ ...matchForm, away_total_shots: value })}
          min={0}
        />
      </FormField>

      <FormField label="Home Shots On Target" htmlFor="home-shots-on-target">
        <NumberInput
          id="home-shots-on-target"
          value={matchForm.home_shots_on_target}
          onChange={(value) => setMatchForm({ ...matchForm, home_shots_on_target: value })}
          min={0}
        />
      </FormField>
      <FormField label="Away Shots On Target" htmlFor="away-shots-on-target">
        <NumberInput
          id="away-shots-on-target"
          value={matchForm.away_shots_on_target}
          onChange={(value) => setMatchForm({ ...matchForm, away_shots_on_target: value })}
          min={0}
        />
      </FormField>

      <FormField label="Home Corners" htmlFor="home-corners">
        <NumberInput
          id="home-corners"
          value={matchForm.home_corners}
          onChange={(value) => setMatchForm({ ...matchForm, home_corners: value })}
          min={0}
        />
      </FormField>
      <FormField label="Away Corners" htmlFor="away-corners">
        <NumberInput
          id="away-corners"
          value={matchForm.away_corners}
          onChange={(value) => setMatchForm({ ...matchForm, away_corners: value })}
          min={0}
        />
      </FormField>
    </div>
  );
}
