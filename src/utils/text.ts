export const getTextSizeClass = (scale: number) => {
  switch (scale) {
    case 0: return 'text-xs sm:text-sm';
    case 1: return 'text-sm sm:text-base';
    case 2: return 'text-base sm:text-lg';
    case 3: return 'text-lg sm:text-xl';
    case 4: return 'text-xl sm:text-2xl';
    default: return 'text-sm sm:text-base';
  }
};
