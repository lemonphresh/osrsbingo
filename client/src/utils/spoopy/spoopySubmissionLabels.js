export function formatReviewedApprovalBadge(submissions) {
  const approved = submissions.filter((submission) => submission.status === 'APPROVED');
  const preScreenshots = approved.filter((submission) => submission.type === 'PRE').length;
  const finalSubmissions = approved.filter((submission) => submission.type === 'FINAL').length;

  const preLabel = preScreenshots === 1 ? 'pre-screenshot' : 'pre-screenshots';
  const submissionLabel = finalSubmissions === 1 ? 'submission' : 'submissions';
  const parts = [];

  if (preScreenshots > 0) parts.push(`${preScreenshots} ${preLabel}`);
  if (finalSubmissions > 0) parts.push(`${finalSubmissions} ${submissionLabel}`);
  return `approved: ${parts.join(' and ')}`;
}

export function isReviewedGroupReadyToComplete(group) {
  if (group.isComplete || (group.progress ?? 0) < 100) return false;

  const hasApproved = group.submissions.some((submission) => submission.status === 'APPROVED');
  const hasPending = group.submissions.some((submission) => submission.status === 'PENDING');
  return hasApproved && !hasPending;
}
