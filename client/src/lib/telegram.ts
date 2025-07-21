// Telegram Web App integration
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        sendData: (data: string) => void;
        openLink: (url: string) => void;
        openTelegramLink: (url: string) => void;
      };
    };
  }
}

export const tg = window.Telegram?.WebApp;

export const initTelegramApp = () => {
  if (tg) {
    tg.ready();
    tg.expand();
  }
};

export const getUserFromTelegram = () => {
  return tg?.initDataUnsafe?.user || null;
};

export const hapticFeedback = {
  light: () => tg?.HapticFeedback.impactOccurred('light'),
  medium: () => tg?.HapticFeedback.impactOccurred('medium'),
  heavy: () => tg?.HapticFeedback.impactOccurred('heavy'),
  success: () => tg?.HapticFeedback.notificationOccurred('success'),
  error: () => tg?.HapticFeedback.notificationOccurred('error'),
  warning: () => tg?.HapticFeedback.notificationOccurred('warning'),
  selection: () => tg?.HapticFeedback.selectionChanged(),
};

export const mainButton = {
  setText: (text: string) => tg?.MainButton.setText(text),
  show: () => tg?.MainButton.show(),
  hide: () => tg?.MainButton.hide(),
  onClick: (callback: () => void) => tg?.MainButton.onClick(callback),
  offClick: (callback: () => void) => tg?.MainButton.offClick(callback),
};

export const backButton = {
  show: () => tg?.BackButton.show(),
  hide: () => tg?.BackButton.hide(),
  onClick: (callback: () => void) => tg?.BackButton.onClick(callback),
  offClick: (callback: () => void) => tg?.BackButton.offClick(callback),
};

export const closeApp = () => tg?.close();

export const openLink = (url: string) => tg?.openLink(url);

export const sendDataToBot = (data: any) => {
  if (tg) {
    tg.sendData(JSON.stringify(data));
  }
};
