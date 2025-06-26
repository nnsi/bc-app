import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppSettingsContextType {
  // 透過状態
  isTransparent: boolean;
  setIsTransparent: (value: boolean) => void;
  
  // プレイヤーサイド (1P: false, 2P: true)
  is2P: boolean;
  setIs2P: (value: boolean) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
};

interface AppSettingsProviderProps {
  children: ReactNode;
}

export const AppSettingsProvider: React.FC<AppSettingsProviderProps> = ({ children }) => {
  // 透過状態 - localStorageから初期値を取得
  const [isTransparent, setIsTransparent] = useState<boolean>(() => {
    const saved = localStorage.getItem('isTransparent');
    const initialValue = saved === 'true';
    
    // 初期状態でbodyクラスを設定
    if (!initialValue) {
      document.body.classList.add('non-transparent');
    }
    
    return initialValue;
  });
  
  // プレイヤーサイド (1P: false, 2P: true) - localStorageから初期値を取得
  const [is2P, setIs2P] = useState<boolean>(() => {
    const saved = localStorage.getItem('playerSide');
    return saved === '2P';
  });
  
  // localStorage更新も含めたセッター
  const setIsTransparentWithStorage = (value: boolean) => {
    setIsTransparent(value);
    localStorage.setItem('isTransparent', value ? 'true' : 'false');
    
    // bodyクラスの更新（透過制御）
    if (value) {
      document.body.classList.remove('non-transparent');
    } else {
      document.body.classList.add('non-transparent');
    }
  };
  
  const setIs2PWithStorage = (value: boolean) => {
    setIs2P(value);
    localStorage.setItem('playerSide', value ? '2P' : '1P');
  };
  
  const value = {
    isTransparent,
    setIsTransparent: setIsTransparentWithStorage,
    is2P,
    setIs2P: setIs2PWithStorage,
  };
  
  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};