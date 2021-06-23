import { PageTitle } from 'features/shared/components'
import React from 'react'
import { connect } from 'react-redux'
import styles from './New.scss'
import actions from 'actions'
import componentClassNames from 'utility/componentClassNames'
import { btmID } from 'utility/environment'
import Tutorial from 'features/tutorial/components/Tutorial'
import NormalTxForm from './NormalTransactionForm'
import CrossChain from './CrossChain/CrossChainTransaction'
import AdvancedTxForm from './AdvancedTransactionForm'
import IssueAssets from './IssueAssets'
import Vote from './Vote'
import { withRouter } from 'react-router'
import {getValues} from 'redux-form'
import {withNamespaces} from 'react-i18next'
import { replace } from 'react-router-redux'

class Form extends React.Component {
  constructor(props) {
    super(props)
    this.handleFormEmpty = this.handleFormEmpty.bind(this)
  }

  componentDidMount() {
    if (!this.props.autocompleteIsBalanceLoaded) {
      this.props.fetchBalanceAll().then(() => {
        // this.props.getVoteDetail().then(()=>{
        //   this.props.didLoadBalanceAutocomplete()
        // })
        this.props.didLoadBalanceAutocomplete()
      })
    }
    if (!this.props.autocompleteIsAssetLoaded) {
      this.props.fetchAssetAll().then(() => {
        this.props.didLoadAssetAutocomplete()
      })
    }
    this.props.router.setRouteLeaveHook(this.props.route, (nextLocation) => {
      if (!(this.handleFormEmpty() || nextLocation.state || nextLocation.pathname.startsWith('/transactions/generated/')))
        return this.props.t('transaction.new.unsaveWarning')
    })
  }

  handleKeyDown(e, cb, disable) {
    if (e.key === 'Enter' && e.shiftKey === false && !disable) {
      e.preventDefault()
      cb()
    }
  }

  handleFormEmpty() {
    if(this.props.normalSelected){
      const array = [
        'assetAlias',
        'assetId',
        'password']

      for (let k in array){
        if(this.props.normalform[array[k]]){
          return false
        }
      }

      return !(this.props.normalform['receivers'].length > 1)
    }else if(this.props.advancedSelected){
      return !(this.props.advform['actions'].length > 0 ||
      this.props.advform['signTransaction'] ||
      this.props.advform['password'])
    }else if(this.props.voteSelected){
      const array = [
        'amount',
        'nodePubkey'
      ]

      for (let k in array){
        if(this.props.voteform[array[k]]){
          return false
        }
      }
      return true
    }else if(this.props.crossChainSelected){
      const array = [
        'assetAlias',
        'assetId',
        'address',
        'amount',
        'password'
      ]

      for (let k in array){
        if(this.props.crossChainform[array[k]]){
          return false
        }
      }
      return true
    }else if(this.props.issueAssetSelected){
      return true
    }
  }

  showForm(e, type){
    e.preventDefault()
    if (( !this.handleFormEmpty() && !window.confirm(this.props.t('transaction.new.unsaveWarning')) )){
      return
    }
    this.props.createForm(type)
  }

  render() {
    const t = this.props.t

    return (
      <div className={componentClassNames(this, 'flex-container')}>
        <PageTitle title={t('transaction.new.new')} />

        <div className={`${styles.mainContainer} flex-container`}>

          <div className={styles.center}>
            <div className={styles.btnGroup} >
              <div className={'btn-group'} role='group'>
                <button
                  className={`btn btn-default ${this.props.normalSelected && 'active'}`}
                  onClick={(e) => this.showForm(e, 'normal')}>
                  {t('transaction.new.normal')}
                  </button>
                <button
                  className={`btn btn-default ${this.props.advancedSelected && 'active'}`}
                  onClick={(e) => this.showForm(e, 'advanced')}>
                  {t('transaction.new.advanced')}
                  </button>
                <button
                  className={`btn btn-default ${this.props.voteSelected && 'active'}`}
                  onClick={(e) => this.showForm(e, 'vote')}>
                  {t('transaction.new.vote')}
                  </button>
                {/* <button
                  className={`btn btn-default ${this.props.crossChainSelected && 'active'}`}
                  onClick={(e) => this.showForm(e, 'crossChain')}>
                  {t('transaction.new.crossChain')}
                  </button> */}
                <button
                  className={`btn btn-default ${this.props.issueAssetSelected && 'active'}`}
                  onClick={(e) => this.showForm(e, 'issueAsset')}>
                  {t('transaction.issue.issueAsset')}
                  </button>
              </div>
            </div>

              {this.props.normalSelected &&
              <NormalTxForm
                btmAmountUnit={this.props.btmAmountUnit}
                asset={this.props.asset}
                balances ={this.props.balances}
                handleKeyDown={this.handleKeyDown}
                tutorialVisible={this.props.tutorialVisible}
              /> }

              {this.props.advancedSelected &&
              <AdvancedTxForm
                btmAmountUnit={this.props.btmAmountUnit}
                asset={this.props.asset}
                handleKeyDown={this.handleKeyDown}
              />}

              {this.props.voteSelected &&
              <Vote
                handleKeyDown={this.handleKeyDown}
                {...this.props}
              />}

              {this.props.crossChainSelected &&
              <CrossChain
                handleKeyDown={this.handleKeyDown}
                {...this.props}
              />}

              {this.props.issueAssetSelected &&
              <IssueAssets
                handleKeyDown={this.handleKeyDown}
                {...this.props}
              />}
          </div>


          <Tutorial types={['TutorialForm']} advTx={this.props.advancedSelected}/>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  let balances = []
  for (let key in state.balance.items) {
    balances.push(state.balance.items[key])
  }

  const mergeById = (a1, a2) =>
    a1.map(itm => ({
      ...a2.find((item) => (item.accountId === itm.accountId && itm.assetId === btmID) && item),
      ...itm
    }))

  const voteDetail = state.balance.voteDetail || []
  balances =  voteDetail.length === 0?  balances: mergeById(balances, voteDetail)

  return {
    autocompleteIsBalanceLoaded: state.balance.autocompleteIsLoaded,
    autocompleteIsAssetLoaded: state.asset.autocompleteIsLoaded,
    btmAmountUnit: state.core.btmAmountUnit,
    balances,
    asset: Object.keys(state.asset.items).map(k => state.asset.items[k]),
    normalform: getValues(state.form.NormalTransactionForm),
    advform: getValues(state.form.AdvancedTransactionForm),
    voteform: getValues(state.form.Vote),
    crossChainform: getValues(state.form.CrossChainTransaction),
    tutorialVisible: !state.tutorial.location.isVisited,
    normalSelected : ownProps.location.query.type == 'normal' || ownProps.location.query.type == undefined,
    advancedSelected : ownProps.location.query.type == 'advanced',
    voteSelected : ownProps.location.query.type == 'vote',
    crossChainSelected : ownProps.location.query.type == 'crossChain',
    issueAssetSelected : ownProps.location.query.type == 'issueAsset',
  }
}

const mapDispatchToProps = (dispatch) => ({
  didLoadBalanceAutocomplete: () => dispatch(actions.balance.didLoadAutocomplete),
  fetchBalanceAll: (cb) => dispatch(actions.balance.fetchAll(cb)),
  getVoteDetail: () => dispatch(actions.balance.getVoteDetail()),
  didLoadAssetAutocomplete: () => dispatch(actions.asset.didLoadAutocomplete),
  fetchAssetAll: (cb) => dispatch(actions.asset.fetchAll(cb)),
  createForm: (type) => dispatch(replace(`/transactions/create?type=${type}`)),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)( withNamespaces('translations')  (withRouter(Form)) )