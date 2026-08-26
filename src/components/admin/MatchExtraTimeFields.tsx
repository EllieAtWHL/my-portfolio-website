import { FormField, NumberInput } from './FormField';
import type { MatchForm } from './MatchForm';

interface MatchExtraTimeFieldsProps {
  matchForm: Partial<MatchForm>;
  setMatchForm: (form: Partial<MatchForm>) => void;
}

export function MatchExtraTimeFields({ matchForm, setMatchForm }: MatchExtraTimeFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Spurs Score (AET)" htmlFor="spurs-score-aet">
          <NumberInput
            id="spurs-score-aet"
            value={matchForm.spurs_score_aet ?? null}
            onChange={(value) => setMatchForm({ ...matchForm, spurs_score_aet: value })}
            min={0}
          />
        </FormField>
        <FormField label="Opponent Score (AET)" htmlFor="opponent-score-aet">
          <NumberInput
            id="opponent-score-aet"
            value={matchForm.opponent_score_aet ?? null}
            onChange={(value) => setMatchForm({ ...matchForm, opponent_score_aet: value })}
            min={0}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Spurs Score (Penalties)" htmlFor="spurs-score-pens">
          <NumberInput
            id="spurs-score-pens"
            value={matchForm.spurs_score_pens ?? null}
            onChange={(value) => setMatchForm({ ...matchForm, spurs_score_pens: value })}
            min={0}
          />
        </FormField>
        <FormField label="Opponent Score (Penalties)" htmlFor="opponent-score-pens">
          <NumberInput
            id="opponent-score-pens"
            value={matchForm.opponent_score_pens ?? null}
            onChange={(value) => setMatchForm({ ...matchForm, opponent_score_pens: value })}
            min={0}
          />
        </FormField>
      </div>
    </>
  );
}
