/**
 * Haptic feedback utility for form submissions and interactions
 * Uses the Vibration API when available
 */

/**
 * Checks if the device supports haptic feedback via the Vibration API
 */
export const isHapticFeedbackSupported = (): boolean => {
  return !!navigator.vibrate;
};

/**
 * Triggers a success vibration pattern (short pulse)
 */
export const vibrationSuccess = (): void => {
  if (isHapticFeedbackSupported()) {
    navigator.vibrate(50); // Single short vibration (50ms)
  }
};

/**
 * Triggers an error vibration pattern (two longer pulses)
 */
export const vibrationError = (): void => {
  if (isHapticFeedbackSupported()) {
    navigator.vibrate([100, 100, 100]); // Two 100ms vibrations with 100ms pause
  }
};

/**
 * Triggers a warning vibration pattern (medium pulse)
 */
export const vibrationWarning = (): void => {
  if (isHapticFeedbackSupported()) {
    navigator.vibrate(75); // Single medium vibration (75ms)
  }
};

/**
 * Triggers a custom vibration pattern
 * @param pattern - A single number for a single vibration or an array for a pattern
 */
export const vibrate = (pattern: number | number[]): void => {
  if (isHapticFeedbackSupported()) {
    navigator.vibrate(pattern);
  }
};

/**
 * Triggger a form submission success vibration
 */
export const formSubmitVibration = (): void => {
  vibrationSuccess();
};