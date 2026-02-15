import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MomentumScore } from '@/components/coaching/MomentumScore';

describe('MomentumScore Component', () => {
  it('renders score correctly', () => {
    const { getByText } = render(
      <MomentumScore
        score={750}
        currentStreak={5}
        longestStreak={10}
        dailyCompletionAvg={0.85}
      />
    );
    expect(getByText('750')).toBeInTheDocument();
  });

  it('shows streak information', () => {
    const { getByText } = render(
      <MomentumScore
        score={750}
        currentStreak={7}
        longestStreak={15}
        dailyCompletionAvg={0.85}
      />
    );
    expect(getByText(/7/)).toBeInTheDocument();
    expect(getByText(/15/)).toBeInTheDocument();
  });
});
