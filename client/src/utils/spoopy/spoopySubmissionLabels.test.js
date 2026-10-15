import {
  formatReviewedApprovalBadge,
  isReviewedGroupReadyToComplete,
} from './spoopySubmissionLabels';

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

  test('omits the pre-screenshot count when it is zero', () => {
    expect(
      formatReviewedApprovalBadge([
        { status: 'APPROVED', type: 'FINAL' },
        { status: 'APPROVED', type: 'FINAL' },
      ])
    ).toBe('approved: 2 submissions');
  });

  test('omits the submission count when it is zero', () => {
    expect(
      formatReviewedApprovalBadge([
        { status: 'APPROVED', type: 'PRE' },
        { status: 'DENIED', type: 'FINAL' },
      ])
    ).toBe('approved: 1 pre-screenshot');
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

describe('isReviewedGroupReadyToComplete', () => {
  const approvedSubmission = { status: 'APPROVED', type: 'FINAL' };

  test('identifies a reviewed group at 100% with an approval', () => {
    expect(
      isReviewedGroupReadyToComplete({
        isComplete: false,
        progress: 100,
        submissions: [approvedSubmission],
      })
    ).toBe(true);
  });

  test.each([
    ['already complete', { isComplete: true, progress: 100, submissions: [approvedSubmission] }],
    ['below 100%', { isComplete: false, progress: 99, submissions: [approvedSubmission] }],
    [
      'without an approval',
      { isComplete: false, progress: 100, submissions: [{ status: 'DENIED', type: 'FINAL' }] },
    ],
    [
      'with pending review',
      {
        isComplete: false,
        progress: 100,
        submissions: [approvedSubmission, { status: 'PENDING', type: 'FINAL' }],
      },
    ],
  ])('returns false when the group is %s', (_label, group) => {
    expect(isReviewedGroupReadyToComplete(group)).toBe(false);
  });
});
