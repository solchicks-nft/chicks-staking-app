import './App.scss';
import React, { useCallback } from 'react';
import { useLocation } from 'react-router';
import {
  Link as RouterLink,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import {
  AppBar,
  Container,
  Link,
  makeStyles,
  Tab,
  Tabs,
  Toolbar,
} from '@material-ui/core';
import { BrowserView, MobileView } from 'react-device-detect';
import SolChicksLogo from './icons/chicks.svg';
import { COLORS, theme } from './muiTheme.js';
import { FlexiblePoolView } from './pages/FlexiblePoolView';
import { HelpView } from './pages/HelpView';
import { LockedPoolView } from './pages/LockedPoolView';

const useStyles = makeStyles(() => ({
  appBar: {
    background: COLORS.nearBlackWithMinorTransparency,
    '& > .MuiToolbar-root': {
      margin: 'auto',
      width: '100%',
      maxWidth: 1230,
    },
  },
  spacer: {
    height: '4em',
  },
  brandLink: {
    display: 'inline-flex',
    alignItems: 'center',
    '&:hover': {
      textDecoration: 'none',
    },
  },
  stakingLink: {
    paddingLeft: '40px',
    fontSize: '14px',
    fontWeight: 'bold',
    lineHeight: '17px',
    color: 'rgba(255,255,255,0.98)',
  },
  bg: {
    backgroundColor: '#000008',
    color: '#ffffff',
    background:
      'linear-gradient(160deg, rgba(69,74,117,.1) 0%, ' +
      'rgba(138,146,178,.1) 33%, rgba(69,74,117,.1) 66%, ' +
      'rgba(98,104,143,.1) 100%), linear-gradient(45deg, ' +
      'rgba(153,69,255,.1) 0%, ' +
      'rgba(121,98,231,.1) 20%, ' +
      'rgba(0,209,140,.1) 100%)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    overflowX: 'hidden',
  },
  solChicksIcon: {
    height: 32,
    filter: 'contrast(0)',
    transition: 'filter 0.5s',
    '&:hover': {
      filter: 'contrast(1)',
    },
    verticalAlign: 'middle',
    marginRight: theme.spacing(1),
    display: 'inline-block',
  },
  content: {
    margin: theme.spacing(2, 0),
    [theme.breakpoints.up('md')]: {
      margin: theme.spacing(4, 0),
    },
  },
  tab: {
    fontFamily: 'Bergern, Poppins, sans-serif',
    fontSize: '1.25rem',
    lineHeight: '1.75',
    textTransform: 'none',
  },
}));

function App() {
  const navigate = useNavigate();
  const classes = useStyles();
  const { pathname } = useLocation();
  const handleTabChange = useCallback(
    (event, value) => {
      navigate(value);
    },
    [navigate],
  );

  return (
    <div className={classes.bg}>
      <AppBar position="static" color="inherit" className={classes.appBar}>
        <Toolbar>
          <Link component={RouterLink} to="/" className={classes.brandLink}>
            <img
              src={SolChicksLogo}
              alt="SolChicks"
              className={classes.solChicksIcon}
            />
          </Link>
        </Toolbar>
      </AppBar>
      <BrowserView>
        <div className={classes.content}>
          <Container>
            <Tabs
              value={pathname}
              variant="fullWidth"
              onChange={handleTabChange}
              indicatorColor="primary"
            >
              <Tab className={classes.tab} label="Flexible Pool" value="/" />
              <Tab
                className={classes.tab}
                label="Locked Pool"
                value="/locked"
                disabled={process.env.NODE_ENV === 'production'}
              />
              <Tab className={classes.tab} label="Help" value="/help" />
            </Tabs>
          </Container>
        </div>
        <Routes>
          <Route path="" element={<FlexiblePoolView />} />
          <Route
            path="locked"
            element={
              process.env.NODE_ENV === 'production' ? (
                <FlexiblePoolView />
              ) : (
                <LockedPoolView />
              )
            }
          />
          <Route path="*" element={<FlexiblePoolView />} />
          <Route path="help" element={<HelpView />} />
        </Routes>
        <div className={classes.spacer} />
      </BrowserView>
      <MobileView>
        <div className={classes.content}>
          <Container className="container">
            Please open this website in your desktop browser, mobile is
            currently unsupported.
          </Container>
        </div>
      </MobileView>
    </div>
  );
}

export default App;
