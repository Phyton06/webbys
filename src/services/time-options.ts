export const TIME_OPTIONS: { value: string; label: string }[] = Array.from({ length: 96 }, (_, index) => {
  const value = `${String(Math.floor(index / 4)).padStart(2, '0')}:${String((index % 4) * 15).padStart(2, '0')}`;
  return { value, label: value };
});
