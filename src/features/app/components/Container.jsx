import React from 'react'
import { connect } from 'react-redux'
import actions from 'actions'
import { Main, Config, Login, Loading, Init, Register, Modal } from './'
import { Initialization } from 'features/initialization/components/index'
import moment from 'moment'
import { withI18n } from 'react-i18next'

const CORE_POLLING_TIME = 2 * 1000

class Container extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      noAccountItem: false
    }
    this.redirectRoot = this.redirectRoot.bind(this)
  }

  redirectRoot(props) {
    const {
      authOk,
      configKnown,
      configured,
      location,
      accountInit
    } = props

    if (!authOk || !configKnown) {
      return
    }

    if (accountInit|| this.state.noAccountItem) {
      if (location.pathname === '/' ) {
        this.props.showRoot()
      }
    } else {
      this.props.showInitialization()
    }
  }

  componentDidMount() {
    this.props.fetchAccountItem().then(resp => {
      if (resp.data.length == 0) {
        this.setState({noAccountItem: true})
      }
    })
    if(this.props.lng === 'zh'){
      moment.locale('zh-cn')
    }else{
      moment.locale(this.props.lng)
    }
  }

  componentWillMount() {
    this.props.fetchInfo().then(() => {
      this.redirectRoot(this.props)
    })

    setInterval(() => this.props.fetchInfo(), CORE_POLLING_TIME)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.authOk != this.props.authOk ||
        nextProps.configKnown != this.props.configKnown ||
        nextProps.configured != this.props.configured ||
        nextProps.location.pathname != this.props.location.pathname) {
      this.redirectRoot(nextProps)
    }
  }

  render() {
    let layout

    const { i18n } = this.props
    i18n.on('languageChanged', function(lng) {
      if(lng === 'zh'){
        moment.locale('zh-cn')
      }else{
        moment.locale(lng)
      }
    })

    if (!this.props.authOk) {
      layout = <Login/>
    } else if (!this.props.configKnown) {
      return <Loading>Connecting to Bytom Core...</Loading>
    } else if (!this.props.configured) {
      layout = <Config>{this.props.children}</Config>
    } else if (!this.props.accountInit && this.state.noAccountItem){
      layout = <Config>{this.props.children}</Config>
    } else{
      layout = <Main>{this.props.children}</Main>
    }

    return <div>
      {layout}
      <Modal />

      {/* For copyToClipboard(). TODO: move this some place cleaner. */}
      <input
        id='_copyInput'
        onChange={() => 'do nothing'}
        value='dummy'
        style={{display: 'none'}}
      />
    </div>
  }
}

export default connect(
  (state) => ({
    authOk: !state.core.requireClientToken || state.core.validToken,
    configKnown: true,
    configured: true,
    onTestnet: state.core.onTestnet,
    accountInit: state.core.accountInit,
  }),
  (dispatch) => ({
    fetchInfo: options => dispatch(actions.core.fetchCoreInfo(options)),
    showRoot: () => dispatch(actions.app.showRoot),
    showInitialization: () => dispatch(actions.app.showInitialization()),
    fetchAccountItem: () => dispatch(actions.account.fetchItems())
  })
)( withI18n() (Container) )
