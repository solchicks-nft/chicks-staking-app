import { makeStyles } from '@material-ui/core';

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
    border: '1px solid rgba(255,255,255,0.98)',
  },
  header: {
    padding: '20px 0px',
    fontFamily: 'Bergern, Poppins, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.98)',
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
  contentheading: {
    fontSize: '12px',
    lineHeight: '15px',
  },
  contentpara: {
    fontWeight: 'bold',
    fontSize: '12px',
    lineHeight: '15px',
  },
  textGreen: {
    color: 'rgb(58, 255, 111)',
    fontSize: '12px',
    lineHeight: '15px',
  },
  balanceTab: {
    display: 'flex',
    padding: '20px 0px',
    width: '100%'
  },
  amount: {
    border: '1px solid rgba(255,255,255,0.98)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: '15px',
    padding: '10px 0px',
    margin: '0px 20px',
  },
  amountText: {
    margin: '0px 20px',
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
    border: '1px solid rgba(255,255,255,0.98)',
    borderRadius: '15px',
  },
  mainleft: {
    display: 'flex',
    justifyContent: 'flex-start',
    width: '50%',
    flexDirection: 'column',
    marginBottom: '20px',
  },
  mainright: {
    width: '50%',
    display: 'flex',
    justifyContent: 'center',
  },
  tabmain: {
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
  },
  wallet: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    color: '#000000',
    margin: '0px 60px',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.98)',
    },
  }
}));
