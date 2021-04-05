import { makeStyles, Theme } from '@material-ui/core';

// An issue with TypeScript prevents CSS properties auto-completion. We can
// hope to have a fix in TypeScript 3.3. Issues to follow up:
// https://github.com/Microsoft/TypeScript/issues/22077
// https://github.com/mui-org/material-ui/issues/11693
// A workaround to have auto-completion is to set CSSProperties type to class values as below.
export const useHomeStyles = makeStyles((theme: Theme) => ({
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    animation: 'Home-logo-spin infinite 20s linear',
    height: 150,
  },
  incrButton: {
    marginTop: '1rem',
  },
  loader: {
    marginLeft: '0.5rem',
  },
  '@keyframes Home-logo-spin': {
    from: {
      transform: 'rotate(0deg)',
    },
    to: {
      transform: 'rotate(360deg)',
    },
  },
}));