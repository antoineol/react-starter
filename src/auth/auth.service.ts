import { fromJS } from 'immutable';
import { Reducer } from 'redux';
import { call, takeLatest, select } from 'redux-saga/effects';
import { createSelector } from 'reselect';
import { appConfig } from '../common/app.config';
import { StoreOf } from '../common/app.models';
import {
  apiPost,
  dispatchSaga,
  dispatchSagaErr,
  getCookie,
  selectState,
  SimpleAction,
  dispatchOther,
} from '../common/app.utils';
import { localSignOut, scheduleJwtRefresh, signInWithGoogle } from './googleSignIn.service';

// Model

// To add to src/common/app.models.ts
export interface AuthModel {
  loading?: boolean;
  resolve?: () => void;
  error?: any;
  jwt?: string | boolean;
}

type AuthStore = StoreOf<AuthModel>;

export const AUTH_REDUCER = 'auth';

// Actions

export enum AuthAT {
  ShowSignIn = 'AuthAT_ShowSignIn',
  SignIn = 'AuthAT_SignIn',
  SignInSuccess = 'AuthAT_SignInSuccess',
  SignInError = 'AuthAT_SignInError',
  SignOut = 'AuthAT_SignOut',
  SignOutSuccess = 'AuthAT_SignOutSuccess',
  SignOutError = 'AuthAT_SignOutError',
}

type AuthAction = SimpleAction<AuthAT>;

// Selectors

const selectHasJwt = selectState(AUTH_REDUCER, 'jwt', jwt => !!jwt);
const selectResolve = selectState(AUTH_REDUCER, 'resolve');
export const selectIsLoggedIn = createSelector(selectHasJwt, selectResolve,
  (hasJwt, resolve) => hasJwt && !resolve);
export const selectAuthLoading = selectState(AUTH_REDUCER, 'loading');
export const selectAuthResolve = selectState(AUTH_REDUCER, 'resolve');
export const selectAuthError = selectState(AUTH_REDUCER, 'error');

// Saga

function* signInSaga() {
  yield takeLatest(AuthAT.SignIn, function* () {
    try {
      const jwt = yield signInWithGoogle();
      const resolve = yield select(selectAuthResolve);
      if (resolve) {
        resolve();
      }
      yield dispatchSaga(AuthAT.SignInSuccess, jwt);
    } catch (err) {
      yield dispatchSagaErr(AuthAT.SignInError, err, err.message === 'CANCELED');
    }
  });
}

function* signOutSaga() {
  yield takeLatest(AuthAT.SignOut, function* () {
    try {
      yield call(remoteSignOut);
      yield dispatchSaga(AuthAT.SignOutSuccess);
    } catch (err) {
      yield dispatchSagaErr(AuthAT.SignOutError, err);
    }
    localSignOut();
  });
}

// To add to src/core/app.sagas.ts
export const authSagas = [
  signInSaga,
  signOutSaga,
];

// Reducer
const jwt = getCookie(appConfig.jwtCookieName);
scheduleJwtRefresh(jwt);
const initialState: AuthStore = fromJS({ jwt: jwt || false } as AuthModel);

// To add to src/core/app.reducers.ts
export const authReducer: Reducer<AuthStore, AuthAction> = (state = initialState,
                                                            action) => {
  switch (action.type) {
    case AuthAT.ShowSignIn:
      return state.set('resolve', fromJS(action.payload));
    case AuthAT.SignIn:
    case AuthAT.SignOut:
      return state
        .set('loading', true)
        .remove('error');
    case AuthAT.SignInSuccess:
      return state
        .remove('loading')
        .remove('resolve')
        .set('jwt', fromJS(action.payload));
    case AuthAT.SignInError:
      return state
        .remove('loading')
        .remove('resolve')
        .set('error', fromJS(action.payload));
    case AuthAT.SignOutSuccess:
      return state
        .remove('loading')
        .remove('jwt');
    case AuthAT.SignOutError:
      return state
        .remove('loading')
        .set('error', fromJS(action.payload));
    default:
      return state;
  }
};

export function signIn(): Promise<void> {
  // TODO
  //  Generate deferred and its promise, return the promise
  //  put the deferred in state as indication that there is an auth request
  //  Update the sign in dialog to read this deferred, include in the condition to show dialog
  //  End of Google auth, resolve deferred (if defined)
  //  should be ok
  //  Should we reject in any case?
  return new Promise<void>(resolve => {
    dispatchOther(AuthAT.ShowSignIn, resolve); // Do we need it?
  });
}

export async function backgroundSignOut(): Promise<void> {
  try {
    await remoteSignOut();
  } catch (e) {
  }
  localSignOut();
}

function remoteSignOut(): Promise<void> {
  return apiPost('/auth/signout');
}
