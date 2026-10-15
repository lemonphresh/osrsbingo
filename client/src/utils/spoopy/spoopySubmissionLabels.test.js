import { formatReviewedApprovalBadge, needsTileCompletion } from './spoopySubmissionLabels';

describe('formatReviewedApprovalBadge', () => {
  test('separates approved pre-screenshots from final submissions', () => {
    const submissions = [
      { status: 'APPROVED', type: 'PRE' },
      { status: 'APPROVED', type: 'PRE' },
      { status: 'APPROVED', type: 'FINAL' },
      { status: 'DENIED', type: 'FINAL' },
    ];

    expect(formatReviewedApprovalBadge(submissions)).toBe(
      'approved: 2 pre-screenshots and 1 submission'
    );
  });

  test('shows zero counts and pluralizes both categories', () => {
    expect(
      formatReviewedApprovalBadge([
        { status: 'APPROVED', type: 'FINAL' },
        { status: 'APPROVED', type: 'FINAL' },
      ])
    ).toBe('approved: 0 pre-screenshots and 2 submissions');
  });

  test('uses singular labels for one of each', () => {
    expect(
      formatReviewedApprovalBadge([
        { status: 'APPROVED', type: 'PRE' },
        { status: 'APPROVED', type: 'FINAL' },
      ])
    ).toBe('approved: 1 pre-screenshot and 1 submission');
  });
});

describe('needsTileCompletion', () => {
  const approvedSubmission = { status: 'APPROVED', type: 'FINAL' };

  test('identifies an incomplete tile at 100% with an approved submission', () => {
    expect(
      needsTileCompletion({
        isComplete: false,
        progress: 100,
        submissions: [approvedSubmission],
      })
    ).toBe(true);
  });

  test('does not surface a tile that still has a pending submission', () => {
    expect(
      needsTileCompletion({
        isComplete: false,
        progress: 100,
        submissions: [approvedSubmission, { status: 'PENDING', type: 'FINAL' }],
      })
    ).toBe(false);
  });

  test('does not treat an approved pre-screenshot as a completed task submission', () => {
    expect(
      needsTileCompletion({
        isComplete: false,
        progress: 100,
        submissions: [{ status: 'APPROVED', type: 'PRE' }],
      })
    ).toBe(false);
  });

  test.each([
    ['already complete', { isComplete: true, progress: 100, submissions: [approvedSubmission] }],
    ['below 100%', { isComplete: false, progress: 99, submissions: [approvedSubmission] }],
    [
      'without an approval',
      { isComplete: false, progress: 100, submissions: [{ status: 'DENIED', type: 'FINAL' }] },
    ],
  ])('returns false when the tile is %s', (_label, group) => {
    expect(needsTileCompletion(group)).toBe(false);
  });
});
