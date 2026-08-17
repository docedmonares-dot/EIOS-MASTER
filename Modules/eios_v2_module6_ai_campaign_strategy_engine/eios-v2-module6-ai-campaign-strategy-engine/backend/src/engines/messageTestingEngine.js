export function scoreMessage({ message_text = '', target_issue = '', target_segment = '' }) {
  const text = String(message_text || '');
  const length = text.length;

  const clarity = length >= 40 && length <= 240 ? 80 : 55;
  const emotional = /(pag-asa|tiwala|malasakit|serbisyo|pamilya|kinabukasan|kabuhayan|kaligtasan)/i.test(text) ? 85 : 60;
  const credibility = /(record|nagawa|patunay|serbisyo|programa|resulta)/i.test(text) ? 82 : 58;
  const risk = /(paninira|galit|takot|banta|kalaban)/i.test(text) ? 70 : 20;
  const persuasion = Math.round((clarity + emotional + credibility + (100 - risk)) / 4);

  return {
    clarity_score: clarity,
    emotional_score: emotional,
    credibility_score: credibility,
    risk_score: risk,
    persuasion_score: persuasion,
    test_score: persuasion,
    notes: {
      target_issue,
      target_segment,
      interpretation: persuasion >= 75 ? 'Strong message' : persuasion >= 60 ? 'Usable but needs refinement' : 'Weak message'
    }
  };
}