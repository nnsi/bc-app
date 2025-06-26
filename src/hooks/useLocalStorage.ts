import { useEffect } from 'react';
import { 
  playerSideToString,
  transparencyToString,
} from '../utils/appBusinessLogic';

export const useLocalStorage = (is2P: boolean, isTransparent: boolean) => {
  // プレイヤーサイドの保存
  useEffect(() => {
    localStorage.setItem('playerSide', playerSideToString(is2P));
  }, [is2P]);
  
  // 透過状態の保存とbodyクラスの更新
  useEffect(() => {
    localStorage.setItem('isTransparent', transparencyToString(isTransparent));
    if (isTransparent) {
      document.body.classList.remove('non-transparent');
    } else {
      document.body.classList.add('non-transparent');
    }
  }, [isTransparent]);
};