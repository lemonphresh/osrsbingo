export function formatReviewedApprovalBadge(submissions) {
  const approved = submissions.filter((submission) => submission.status === 'APPROVED');
  const preScreenshots = approved.filter((submission) => submission.type === 'PRE').length;
  const finalSubmissions = approved.filter((submission) => submission.type === 'FINAL').length;

  const preLabel = preScreenshots === 1 ? 'pre-screenshot' : 'pre-screenshots';
  const submissionLabel = finalSubmissions === 1 ? 'submission' : 'submissions';

  return `approved: ${preScreenshots} ${preLabel} and ${finalSubmissions} ${submissionLabel}`;
}

export function needsTileCompletion(group) {
  if (group.isComplete || (group.progress ?? 0) < 100) return false;

  const hasApproved = group.submissions.some(
    (submission) => submission.status === 'APPROVED' && submission.type === 'FINAL'
  );
  const hasPending = group.submissions.some((submission) => submission.status === 'PENDING');
  return hasApproved && !hasPending;
}
