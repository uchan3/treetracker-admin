import React, { useEffect, useReducer } from 'react';
import clsx from 'clsx';
import { connect } from 'react-redux';
import compose from 'recompose/compose';
import { makeStyles } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button'; // replace with icons down the line
import { selectedHighlightColor } from '../common/variables.js';
import * as loglevel from 'loglevel';
import Grid from '@material-ui/core/Grid';
import AppBar from '@material-ui/core/AppBar';
import Modal from '@material-ui/core/Modal';
import LinearProgress from '@material-ui/core/LinearProgress';
import IconFilter from '@material-ui/icons/FilterList';
import IconButton from '@material-ui/core/IconButton';
import Box from '@material-ui/core/Box';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Snackbar from '@material-ui/core/Snackbar';
import Drawer from '@material-ui/core/Drawer';
import MenuIcon from '@material-ui/icons/Menu';
import Toolbar from '@material-ui/core/Toolbar';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import TextField from '@material-ui/core/TextField';

import Filter, { FILTER_WIDTH } from './Filter';
import FilterTop from './FilterTop';
import { MENU_WIDTH } from './common/Menu';
import FilterModel from '../models/Filter';
import { ReactComponent as TreePin } from '../components/images/highlightedPinNoStick.svg';
import IconLogo		from './IconLogo';
import Menu from './common/Menu.js';

const log = require('loglevel').getLogger('../components/TreeImageScrubber');

const SIDE_PANEL_WIDTH = 315;

const useStyles = makeStyles(theme => ({
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: theme.spacing(2, 16, 16, 16),
    userSelect: 'none'
  },
  cardImg: {
    width: '100%',
    height: 'auto'
  },
  cardTitle: {
    color: '#f00'
  },
  card: {
    cursor: 'pointer',
    margin: '0.5rem'
  },
  cardSelected: {
    backgroundColor: theme.palette.action.selected
  },
  cardContent: {
    padding: 0
  },
  selected: {
    border: `2px ${selectedHighlightColor} solid`
  },
  cardMedia: {
    height: '12rem'
  },
  cardWrapper: {
    width: '33.33%',
    minWidth: 300
  },
  title: {
    padding: theme.spacing(2, 16)
  },
  snackbar: {
    bottom: 20
  },
  snackbarContent: {
    backgroundColor: theme.palette.action.active
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  button: {
    marginRight: '8px'
  },

  appBar: {
    width: `calc(100% - ${SIDE_PANEL_WIDTH}px)`,
    left: 0,
    right: 'auto',
  },
  sidePanel: {
  },
  drawerPaper: {
    width: SIDE_PANEL_WIDTH,
  },
  body: {
    width: `calc(100% - ${SIDE_PANEL_WIDTH}px)`,
  },
  sidePanelContainer: {
    padding: theme.spacing(2),
  },
  sidePanelItem: {
    marginTop: theme.spacing(4),
  },
  radioGroup: {
    flexDirection : 'row',
  },
  bottomLine: {
    borderBottom : '1px solid lightgray',
  },
}));

const TreeImageScrubber = ({ getScrollContainerRef, ...props }) => {
  log.debug('render TreeImageScrubber...');
  log.debug('complete:', props.verityState.approveAllComplete);
  const classes = useStyles(props);
  const [complete, setComplete] = React.useState(0);
  const [isFilterShown, setFilterShown] = React.useState(true);
  const [isMenuShown, setMenuShown] = React.useState(false);

  /*
   * effect to load page when mounted
   */
  useEffect(() => {
    log.debug('mounted');
    props.verityDispatch.loadMoreTreeImages();
  }, []);

  /*
   * effect to set the scroll event
   */
  useEffect(() => {
    log.debug('verity state changed');
    //move add listener to effect to let it refresh at every state change
    let scrollContainerRef = getScrollContainerRef();
    const handleScroll = e => {
      if (
        scrollContainerRef &&
        Math.floor(scrollContainerRef.scrollTop) !==
          Math.floor(scrollContainerRef.scrollHeight) -
            Math.floor(scrollContainerRef.offsetHeight)
      ) {
        return;
      }
      props.verityDispatch.loadMoreTreeImages();
    };
    let isListenerAttached = false;
    if (
      scrollContainerRef &&
      //should not listen scroll when loading
      !props.verityState.isLoading
    ) {
      log.debug('attaching listener');
      scrollContainerRef.addEventListener('scroll', handleScroll);
      isListenerAttached = true;
    } else {
      log.debug('do not attach listener');
    }

    return () => {
      if (isListenerAttached) {
        scrollContainerRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, [props.verityState]);

  /* to display progress */
  useEffect(() => {
    setComplete(props.verityState.approveAllComplete);
  }, [props.verityState.approveAllComplete]);

//  /* To update unverified tree count */
//  useEffect(() => {
//      props.verityDispatch.getTreeCount();
//  }, [props.verityState.treeImages]);

  function handleTreeClick(e, treeId) {
    e.stopPropagation();
    e.preventDefault();
    log.debug('click at tree:%d', treeId);
    props.verityDispatch.clickTree({
      treeId,
      isShift: e.shiftKey,
      isCmd: e.metaKey,
      isCtrl: e.ctrlKey
    });
  }

  function handleTreePinClick(e, treeId) {
    e.stopPropagation();
    e.preventDefault();
    log.debug('click at tree:%d', treeId);
    const url = `${process.env.REACT_APP_WEBMAP_DOMAIN}/?treeid=${treeId}`;
    window.open(url, '_blank').opener = null;
  }

  async function handleSubmit(approveAction){
    console.log('approveAction:', approveAction)
    //check selection
    if(props.verityState.treeImagesSelected.length === 0){
      window.alert('Please select some tree')
      return
    }
    const result = await props.verityDispatch.approveAll({approveAction});
    if (result) {
      //if all trees were approved, then, load more
      if (
        props.verityState.treeImagesSelected.length ===
        props.verityState.treeImages.length
      ) {
        log.debug('all trees approved, reload');
        props.verityDispatch.loadMoreTreeImages();
      }
    } else {
      window.alert('sorry, failed to approve some picture');
    }
  }

  let treeImageItems = props.verityState.treeImages.map(tree => {
    if (tree.imageUrl) {
      return (
        <div className={classes.cardWrapper} key={tree.id}>
          <Card
            onClick={e => handleTreeClick(e, tree.id)}
            id={`card_${tree.id}`}
            className={clsx(
              classes.card,
              props.verityState.treeImagesSelected.indexOf(tree.id) >= 0
                ? classes.cardSelected
                : undefined
            )}
            elevation={3}
          >
            <CardContent className={classes.cardContent}>
              <CardMedia className={classes.cardMedia} image={tree.imageUrl} />
              <Typography variant='body2' gutterBottom>
                Tree# {tree.id}, Planter# {tree.planterId}, Device# {tree.deviceId}
              </Typography>
            </CardContent>
            <CardActions className={classes.cardActions}>
              <Box>
                <Button
                  className={classes.button}
                  color='secondary'
                  size='small'
                  onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    props.verityDispatch.rejectTreeImage(tree.id).then(() => {
                      //after approve/reject, clear selection
                      props.verityDispatch.resetSelection();
                      //when finished, check if the list is empty, if true,
                      //load more tree
                      //why 1? because it is old state in hook
                      if (props.verityState.treeImages.length === 1) {
                        log.debug('empty, load more');
                        props.verityDispatch.loadMoreTreeImages();
                      } else {
                        log.trace('not empty');
                      }
                    });
                  }}
                  disabled={tree.active === false}
                >
                  Reject
                </Button>
                <Button
                  color='primary'
                  size='small'
                  onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    props.verityDispatch.approveTreeImage(tree.id).then(() => {
                      //after approve/reject, clear selection
                      props.verityDispatch.resetSelection();
                      //when finished, check if the list is empty, if true,
                      //load more tree
                      //why 1? because it is old state in hook
                      if (props.verityState.treeImages.length === 1) {
                        log.debug('empty, load more');
                        props.verityDispatch.loadMoreTreeImages();
                      } else {
                        log.trace(
                          'not empty',
                          props.verityState.treeImages.length
                        );
                      }
                    });
                  }}
                  disabled={tree.approved === true}
                >
                  Approve
                </Button>
              </Box>
              <Box>
                <TreePin
                  width='25px'
                  height='25px'
                  title={`Open Webmap for Tree# ${tree.id}`}
                  onClick={e => {
                    handleTreePinClick(e, tree.id);
                  }}
                />
              </Box>
            </CardActions>
          </Card>
        </div>
      );
    }
  });

  function handleFilterClick() {
    if (isFilterShown) {
      setFilterShown(false);
    } else {
      setFilterShown(true);
    }
  }

  function handleToggleMenu(){
    setMenuShown(!isMenuShown)
  }

  return (
    <React.Fragment>
      <Grid 
        container
        direction='column'
      >
        <Grid item>
          <AppBar
            color='default'
            className={classes.appBar}
          >
            <Grid container direction='column'>
              <Grid item>
                <Grid container justify='space-between'>
                  <Grid item>
                    <IconButton>
                      <MenuIcon onClick={handleToggleMenu}/>
                    </IconButton>
                    <IconLogo/>
                  </Grid>
                  <Grid item>
                    <IconButton
                      onClick={handleFilterClick}
                    >
                      <IconFilter />
                    </IconButton>
                  </Grid>
                </Grid>
              </Grid>
              {isFilterShown &&
              <Grid item>
                <FilterTop
                  isOpen={isFilterShown}
                  onSubmit={filter => {
                    props.verityDispatch.updateFilter(filter);
                  }}
                  filter={props.verityState.filter}
                  onClose={handleFilterClick}
                />
              </Grid>
              }
            </Grid>
          </AppBar>
        </Grid>
        <Grid 
          item 
          className={classes.body}
          style={{
            marginTop: isFilterShown? 100:50,
          }}
        >
          <Grid container>
            <Grid
              item
              style={{
                width: '100%',
              }}
            >
              <Grid
                container
                justify={'space-between'}
                className={classes.title}
              >
                <Grid item>
                  <Typography
                    variant='h5'
                    style={{
                      paddingTop: 20
                    }}
                  >
                  {false /* close counter*/&& props.verityState.treeCount} trees to verify
                  </Typography>
                </Grid>
                <Grid item>
                </Grid>
              </Grid>
            </Grid>
            <Grid
              item
              style={{
                width: '100%'
              }}
            >
              <section className={classes.wrapper}>{treeImageItems}</section>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <SidePanel
        onSubmit={handleSubmit}
      />
      {isMenuShown &&
        <Menu
          onClose={() => setMenuShown(false)}
        />
      }
      {props.verityState.isApproveAllProcessing && (
        <AppBar
          position='fixed'
          style={{
            zIndex: 10000
          }}
        >
          <LinearProgress
            color='primary'
            variant='determinate'
            value={complete}
          />
        </AppBar>
      )}
      {props.verityState.isApproveAllProcessing && (
        <Modal open={true}>
          <div></div>
        </Modal>
      )}
      {false /* close undo */&& !props.verityState.isApproveAllProcessing && !props.verityState.isRejectAllProcessing &&
        props.verityState.treeImagesUndo.length > 0 && (
          <Snackbar
            open
            autoHideDuration={15000}
            ContentProps={{
              className: classes.snackbarContent,
              'aria-describedby': 'snackbar-fab-message-id'
            }}
            message={
              <span id='snackbar-fab-message-id'>
                You have { props.verityState.isBulkApproving ? ' approved ' : ' rejected '}
                {props.verityState.treeImagesUndo.length}{' '}
                trees
              </span>
            }
            color='primary'
            action={
              <Button
                color='inherit'
                size='small'
                onClick={async () => {
                  const result = await props.verityDispatch.undoAll();
                  log.log('finished');
                }}
              >
                Undo
              </Button>
            }
            className={classes.snackbar}
          />
        )}
    </React.Fragment>
  )

  return (
    <React.Fragment>
      <Grid container>
        <Grid
          item
          style={{
            width: isFilterShown
              ? `calc(100vw - ${MENU_WIDTH}px - ${FILTER_WIDTH}px`
              : '100%'
          }}
        >
        </Grid>
        <Grid
          item
          style={{
            width: `${FILTER_WIDTH}px`
          }}
        >
        </Grid>
      </Grid>
      {props.verityState.isApproveAllProcessing && (
        <AppBar
          position='fixed'
          style={{
            zIndex: 10000
          }}
        >
          <LinearProgress
            color='primary'
            variant='determinate'
            value={complete}
          />
        </AppBar>
      )}
      {props.verityState.isApproveAllProcessing && (
        <Modal open={true}>
          <div></div>
        </Modal>
      )}
      {!props.verityState.isApproveAllProcessing && !props.verityState.isRejectAllProcessing &&
        props.verityState.treeImagesUndo.length > 0 && (
          <Snackbar
            open
            autoHideDuration={15000}
            ContentProps={{
              className: classes.snackbarContent,
              'aria-describedby': 'snackbar-fab-message-id'
            }}
            message={
              <span id='snackbar-fab-message-id'>
                You have { props.verityState.isBulkApproving ? ' approved ' : ' rejected '}
                {props.verityState.treeImagesUndo.length}{' '}
                trees
              </span>
            }
            color='primary'
            action={
              <Button
                color='inherit'
                size='small'
                onClick={async () => {
                  const result = await props.verityDispatch.undoAll();
                  log.log('finished');
                }}
              >
                Undo
              </Button>
            }
            className={classes.snackbar}
          />
        )}
    </React.Fragment>
  );
};

function SidePanel(props){
  const classes = useStyles(props);
  const [switchApprove, handleSwitchApprove] = React.useState(0)
  const [morphology, handleMorphology] = React.useState('seedling')
  const [age, handleAge] = React.useState('new_tree')
  const [captureApprovalTag, handleCaptureApprovalTag] = React.useState('simple_leaf')
  const [rejectionReason, handleRejectionReason] = React.useState('not_tree')

  function handleSubmit(){
    const approveAction = switchApprove === 0?
      {
        isApproved: true,
        morphology,
        age,
        captureApprovalTag,
      }
    :
      {
        isApproved: false,
        rejectionReason,
      }
    props.onSubmit(approveAction)
  }

  return (
    <Drawer
      variant='permanent'
      anchor='right'
      className={classes.sidePanel}
      classes={{
        paper: classes.drawerPaper
      }}
      elevation={11}
    >
      <Grid container direction={'column'} className={classes.sidePanelContainer}>
        <Grid>
          <Typography variant='h4' >Tags</Typography>
        </Grid>
        <Grid className={`${classes.bottomLine} ${classes.sidePanelItem}`}>
          <RadioGroup value={morphology} className={classes.radioGroup}>
            <FormControlLabel value='seedling' control={<Radio/>} label='Seedling' />
            <FormControlLabel value='direct_seeding' control={<Radio/>} label='Direct seeding' />
            <FormControlLabel value='fmnr' control={<Radio/>} label='Pruned/tied(FMNR)' />
          </RadioGroup>
        </Grid>
        <Grid className={`${classes.bottomLine} ${classes.sidePanelItem}`}>
          <RadioGroup value={age} className={classes.radioGroup}>
            <FormControlLabel checked value='new_tree' control={<Radio/>} label='New tree(s)' />
            <FormControlLabel value='over_two_years' control={<Radio/>} label='> 2 years old' />
          </RadioGroup>
        </Grid>
        <Grid className={`${classes.bottomLine} ${classes.sidePanelItem}`}>
          <RadioGroup className={classes.radioGroup}>
            <FormControlLabel disabled value='Create token' control={<Radio/>} label='Create token' />
            <FormControlLabel disabled value='No token' control={<Radio/>} label='No token' />
          </RadioGroup>
        </Grid>
        <Grid className={`${classes.bottomLine} ${classes.sidePanelItem}`}>
          <Tabs 
            indicatorColor='primary'
            textColor='primary'
            variant='fullWidth'
            value={switchApprove}
          >
            <Tab label='APPROVE' 
              id='full-width-tab-0'
              aria-controls='full-width-tabpanel-0'
              onClick={() => handleSwitchApprove(0)}
            />
            <Tab 
              label='REJECT'
              id='full-width-tab-0'
              aria-controls='full-width-tabpanel-0'
              onClick={() => handleSwitchApprove(1)}
            />
          </Tabs>
          {switchApprove === 0 &&
            <RadioGroup
              value={captureApprovalTag}
            >
              <FormControlLabel value='simple_leaf' control={<Radio/>} label='Simple leaf' />
              <FormControlLabel value='complex_leaf' control={<Radio/>} label='Complex leaf' />
              <FormControlLabel value='acacia_like' control={<Radio/>} label='Acacia-like' />
              <FormControlLabel value='conifer' control={<Radio/>} label='Conifer' />
              <FormControlLabel value='fruit' control={<Radio/>} label='Fruit' />
              <FormControlLabel value='mangrove' control={<Radio/>} label='Mangrove' />
              <FormControlLabel value='plam' control={<Radio/>} label='Palm' />
              <FormControlLabel value='timber' control={<Radio/>} label='Timber' />
            </RadioGroup>
          }
          {switchApprove === 1 &&
            <RadioGroup
              value={rejectionReason}
            >
              <FormControlLabel checked value='not_tree' control={<Radio/>} label='Not a tree' />
              <FormControlLabel value='unapproved_tree' control={<Radio/>} label='Not an approved tree' />
              <FormControlLabel value='blurry_image' control={<Radio/>} label='Blurry photo' />
              <FormControlLabel value='dead' control={<Radio/>} label='Dead' />
              <FormControlLabel value='duplicate_image' control={<Radio/>} label='Duplicate photo' />
              <FormControlLabel value='flag_user' control={<Radio/>} label='Flag user!' />
              <FormControlLabel value='needs_contact_or_review' control={<Radio/>} label='Flag tree for contact/review' />
            </RadioGroup>
          }
        
        </Grid>
        <Grid className={`${classes.sidePanelItem}`}>
          <TextField placeholder='Note(optional)' ></TextField>
        </Grid>
        <Grid className={`${classes.sidePanelItem}`}>
          <Button onClick={handleSubmit} color='primary' >SUBMIT</Button>
        </Grid>
      </Grid>
    </Drawer>
  )
}


export default connect(
  //state
  state => ({
    verityState: state.verity
  }),
  //dispatch
  dispatch => ({
    verityDispatch: dispatch.verity
  })
)(TreeImageScrubber);
