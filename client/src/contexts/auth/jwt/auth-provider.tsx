import PropTypes from 'prop-types';
import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useReducer } from 'react';

import type { User } from '@libs/types';
import { authApi } from 'src/api/auth';
import { Issuer } from 'src/utils/auth';

import type { State } from './auth-context';
import { AuthContext, initialState } from './auth-context';

const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';
const LOGIN_LOG_ID_STORAGE_KEY = 'loginLogId';

enum ActionType {
  INITIALIZE = 'INITIALIZE',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT'
}

type InitializeAction = {
  type: ActionType.INITIALIZE;
  payload: {
    isAuthenticated: boolean;
    user: User | null;
  };
};

type SignInAction = {
  type: ActionType.SIGN_IN;
  payload: {
    user: User;
  };
};

type SignOutAction = {
  type: ActionType.SIGN_OUT;
};

type Action = InitializeAction | SignInAction | SignOutAction;

type Handler = (state: State, action: any) => State;

const handlers: Record<ActionType, Handler> = {
  INITIALIZE: (state: State, action: InitializeAction): State => {
    const { isAuthenticated, user } = action.payload;

    return {
      ...state,
      isAuthenticated,
      isInitialized: true,
      user
    };
  },
  SIGN_IN: (state: State, action: SignInAction): State => {
    const { user } = action.payload;

    return {
      ...state,
      isAuthenticated: true,
      user
    };
  },
  SIGN_OUT: (state: State): State => ({
    ...state,
    isAuthenticated: false,
    user: null
  })
};

const reducer = (state: State, action: Action): State =>
  handlers[action.type] ? handlers[action.type](state, action) : state;

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = (props) => {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, initialState);

  const initialize = useCallback(async (): Promise<void> => {
    try {
      const accessToken = window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

      if (accessToken) {
        const user = await authApi.me();

        dispatch({
          type: ActionType.INITIALIZE,
          payload: {
            isAuthenticated: true,
            user
          }
        });
      } else {
        dispatch({
          type: ActionType.INITIALIZE,
          payload: {
            isAuthenticated: false,
            user: null
          }
        });
      }
    } catch (err) {
      console.error(err);
      // Token is present but no longer valid (expired/revoked) - clear it so
      // the guard doesn't keep bouncing the user between login and dashboard.
      sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(LOGIN_LOG_ID_STORAGE_KEY);
      dispatch({
        type: ActionType.INITIALIZE,
        payload: {
          isAuthenticated: false,
          user: null
        }
      });
    }
  }, [dispatch]);

  useEffect(
    () => {
      initialize();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const signIn = useCallback(
    async (username: string, password: string): Promise<void> => {
      const { accessToken, loginLogId, user } = await authApi.signIn({ username, password });

      sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
      if (loginLogId != null) {
        sessionStorage.setItem(LOGIN_LOG_ID_STORAGE_KEY, String(loginLogId));
      }

      dispatch({
        type: ActionType.SIGN_IN,
        payload: {
          user
        }
      });
    },
    [dispatch]
  );

  const signOut = useCallback(async (): Promise<void> => {
    const loginLogId = sessionStorage.getItem(LOGIN_LOG_ID_STORAGE_KEY);

    try {
      await authApi.signOut(loginLogId ? Number(loginLogId) : undefined);
    } catch (err) {
      // Still clear local session state even if the logout call fails
      // (e.g. token already expired) - the user's intent is to be signed out.
      console.error(err);
    }

    sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(LOGIN_LOG_ID_STORAGE_KEY);
    dispatch({ type: ActionType.SIGN_OUT });
  }, [dispatch]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        issuer: Issuer.JWT,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};
