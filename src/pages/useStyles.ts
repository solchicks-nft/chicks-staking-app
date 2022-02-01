import { makeStyles } from '@material-ui/core';
import { COLORS } from '../muiTheme.js';

export const useStyles = makeStyles((theme) => ({
  chainSelectWrapper: {
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
    },
  },
  chainSelectContainer: {
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
    width: '40%',
    display: 'flex',
    flexDirection: 'column',
  },
  chainSelectArrow: {
    position: 'relative',
    top: '12px',
    [theme.breakpoints.down('sm')]: { transform: 'rotate(90deg)' },
  },
  chainStepCaption: {
    fontFamily: 'Bergern, Poppins, sans-serif',
    display: 'flex',
    alignItems: 'center',
  },
  transferField: {
    marginTop: theme.spacing(5),
  },
  statusMessage: {
    marginTop: theme.spacing(1),
  },
  tab: {
    fontFamily: 'Bergern, Poppins, sans-serif',
    fontSize: '1.25rem',
    lineHeight: '1.75',
    textTransform: 'none',
  },
  card: {
    marginBottom: '24px',
    borderRadius: '15px',
    border: '1px solid rgba(119, 136, 152, 0.3)',
  },
  header: {
    padding: '20px 0px',
    fontFamily: 'Bergern-Bold, Poppins, sans-serif',
    display: 'flex',
    fontSize: '20px',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid rgba(119, 136, 152, 0.3)',
  },
  content: {
    display: 'flex',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
    gap: '8px',
    padding: '11px 0px',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: '8px',
    padding: '11px 0px',
  },
  flexibleContentContainer: {
    display: 'flex',
  },
  lockedContentContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: '8px',
  },
  contentHeading: {
    fontSize: '16px',
    lineHeight: '15px',
  },
  contentText: {
    fontWeight: 'bold',
    fontSize: '14px',
    lineHeight: '15px',
  },
  textGreen: {
    color: 'rgb(58, 255, 111)',
    fontSize: '14px',
    lineHeight: '15px',
  },
  balanceTab: {
    display: 'flex',
    padding: '20px 0px',
    width: '100%',
  },
  amount: {
    border: '1px solid rgba(119, 136, 152, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '16px',
    borderRadius: '15px',
    padding: '10px 0px',
    margin: '0px 20px',
  },
  amountText: {
    width: '20%',
    textAlign: 'right',
  },
  max: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    color: '#000000',
    padding: '2px 0px',
    margin: '0px 20px',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.98)',
    },
  },
  mainTab: {
    padding: '20px 100px',
  },
  centerTab: {
    border: '1px solid rgba(119, 136, 152, 0.3)',
    borderRadius: '15px',
  },
  childTabContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '50%',
    flexDirection: 'column',
    marginBottom: '20px',
  },
  mainRightContainer: {
    width: '50%',
    display: 'flex',
    justifyContent: 'center',
  },
  tabContainer: {
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
  },
  wallet: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    color: '#000000',
    borderRadius: '20px',
    width: '200px',
    height: '44px',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.98)',
    },
  },
  flexibleAlert: {
    border: '1px solid rgba(23, 99, 192, 1)',
    width: '100%',
    display: 'flex',
    padding: '15px 0px',
    marginBottom: '20px',
    borderRadius: '10px',
  },
  alertText: {
    marginLeft: '10px',
  },
  mainCard: {
    padding: theme.spacing(3),
    backgroundColor: COLORS.nearBlackWithMinorTransparency,
  },
  spacer: {
    height: theme.spacing(5),
  },
  info: {
    width: '20px',
    marginTop: '1px',
    padding: '0px 10px',
  },
}));
