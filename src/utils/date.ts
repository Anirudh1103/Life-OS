export const formatDate = (timestamp?: number) => {
  if (!timestamp) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(timestamp));
};
