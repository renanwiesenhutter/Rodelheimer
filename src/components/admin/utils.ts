const pad2 = (n: number) => String(n).padStart(2, '0');

export const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
};

export const getRequiredSlots = (startTime: string, durationSlots: number, allSlots: string[]) => {
  const startIndex = allSlots.indexOf(startTime);
  if (startIndex === -1) return [];
  return allSlots.slice(startIndex, startIndex + Math.max(durationSlots, 1));
};
