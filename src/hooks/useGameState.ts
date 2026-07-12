import { useReducer, useCallback } from 'react';
import type { GameState, GameView, ModalType, SidebarTab, PlayerData } from '../types/game';

type GameAction =
  | { type: 'SET_VIEW'; view: GameView }
  | { type: 'SET_MODAL'; modal: ModalType }
  | { type: 'SELECT_SECT'; sectId: string | null }
  | { type: 'START_GAME'; sectName: string; subsectName: string }
  | { type: 'EXIT_GAME' }
  | { type: 'SET_SIDEBAR_TAB'; tab: SidebarTab }
  | { type: 'SET_PLAYER'; player: PlayerData }
  | { type: 'COMPLETE_SPLASH' }
  | { type: 'SHOW_CHAR_CREATION' }
  | { type: 'HIDE_CHAR_CREATION' };

const initialState: GameState = {
  view: 'splash',
  modal: null,
  selectedSectId: null,
  activeGame: null,
  sidebarTab: 'chat',
  player: null,
  splashComplete: false,
  showCharacterCreation: false,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'SET_MODAL':
      return { ...state, modal: action.modal };
    case 'SELECT_SECT':
      return {
        ...state,
        selectedSectId: action.sectId,
        view: action.sectId ? 'sect-detail' : state.view,
      };
    case 'START_GAME':
      return {
        ...state,
        activeGame: { sectName: action.sectName, subsectName: action.subsectName },
        view: 'game-shell',
        sidebarTab: 'chat',
      };
    case 'EXIT_GAME':
      return {
        ...state,
        activeGame: null,
        view: 'sect-detail',
        sidebarTab: 'chat',
      };
    case 'SET_SIDEBAR_TAB':
      return { ...state, sidebarTab: action.tab };
    case 'SET_PLAYER':
      return { ...state, player: action.player, showCharacterCreation: false };
    case 'COMPLETE_SPLASH':
      return { ...state, splashComplete: true, view: 'sect-orbit' };
    case 'SHOW_CHAR_CREATION':
      return { ...state, showCharacterCreation: true };
    case 'HIDE_CHAR_CREATION':
      return { ...state, showCharacterCreation: false };
    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const actions = {
    setView: useCallback((view: GameView) => dispatch({ type: 'SET_VIEW', view }), []),
    setModal: useCallback((modal: ModalType) => dispatch({ type: 'SET_MODAL', modal }), []),
    selectSect: useCallback(
      (sectId: string | null) => dispatch({ type: 'SELECT_SECT', sectId }), []),
    startGame: useCallback(
      (sectName: string, subsectName: string) =>
        dispatch({ type: 'START_GAME', sectName, subsectName }), []),
    exitGame: useCallback(() => dispatch({ type: 'EXIT_GAME' }), []),
    setSidebarTab: useCallback(
      (tab: SidebarTab) => dispatch({ type: 'SET_SIDEBAR_TAB', tab }), []),
    setPlayer: useCallback(
      (player: PlayerData) => dispatch({ type: 'SET_PLAYER', player }), []),
    completeSplash: useCallback(() => dispatch({ type: 'COMPLETE_SPLASH' }), []),
    showCharCreation: useCallback(() => dispatch({ type: 'SHOW_CHAR_CREATION' }), []),
    hideCharCreation: useCallback(() => dispatch({ type: 'HIDE_CHAR_CREATION' }), []),
  };

  return { state, actions };
}
