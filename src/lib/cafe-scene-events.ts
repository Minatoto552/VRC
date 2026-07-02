export const CAFE_LOTTERY_PULSE_EVENT = 'cafe-lottery-pulse';

export const dispatchCafeLotteryPulse = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(CAFE_LOTTERY_PULSE_EVENT));
};
