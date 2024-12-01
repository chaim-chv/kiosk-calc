
const SETTINGS_KEY = 'kioskCalcSettings';

export const defaultSettings = {
  defaultStartDate: '',
  defaultEndDate: ''
};

export const getSettings = () => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
};

export const saveSettings = (settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};