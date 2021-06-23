import { BaseList } from 'features/shared/components'
import { ProgressBar } from 'react-bootstrap'
import { btmID } from 'utility/environment'
import ListItem from './ListItem'
import React from 'react'
import actions from 'actions'
import RescanDialog from './RescanDialog/RescanDialog'
import {withNamespaces} from 'react-i18next'

const type = 'balance'

class List extends React.Component {
  componentDidMount() {
    // this.props.getVoteDetail()
  }

  rescanWallet(){
    this.props.showModal(
      <RescanDialog
        closeModal = {this.props.closeModal()}
      />
    )
  }

  render() {
    const ItemList = BaseList.ItemList
    const newButton = <button key='showRescan' className='btn btn-primary' onClick={() => this.rescanWallet()}>
      {this.props.t('balances.rescan')}
    </button>

    let items
    if(this.props.items.length !== 0){
      const mergeById = (a1, a2) =>
        a1.map(itm => ({
          ...a2.find((item) => (item.accountId === itm.accountId && itm.assetId === btmID) && item),
          ...itm
        }))
      items =  this.props.voteDetail.length === 0?  this.props.items: mergeById(this.props.items, this.props.voteDetail)
    }

    return <div>
      <ItemList
        actions={[newButton]}
      {...this.props}
        items = {items}
      />
    </div>
  }
}

const newStateToProps = (state, ownProps) => {
  const props =  {
    ...BaseList.mapStateToProps(type, ListItem)(state, ownProps),
    rescanning: state.balance.rescanning,
    rescanProgress: state.balance.rescanProgress,
    voteDetail: state.balance.voteDetail,
    skipCreate: true
  }

  return props
}

const mapDispatchToProps = ( dispatch ) => ({
  rescan: () => dispatch(actions.balance.rescan()),
  info: () => dispatch(actions.balance.walletInfo()),
  getVoteDetail: () => dispatch(actions.balance.getVoteDetail()),
  showModal: (body) => dispatch(actions.app.showModal(
    body,
    actions.app.hideModal,
    null,
    {
      dialog: true,
      noCloseBtn: true
    }
  )),
  closeModal:() => dispatch(actions.app.hideModal),
  ...BaseList.mapDispatchToProps(type),
})

export default BaseList.connect(
  newStateToProps,
  mapDispatchToProps,
  withNamespaces('translations')(List)
)
