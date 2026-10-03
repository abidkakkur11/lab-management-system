// Date & Day formatting utilities

export const formatBookingDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }); // e.g. "Sat, Oct 3, 2026"
  } catch (err) {
    return dateStr;
  }
};

export const formatBookingDayAndDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }); // e.g. "Saturday, October 3, 2026"
  } catch (err) {
    return dateStr;
  }
};
