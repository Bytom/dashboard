import {
  BaseNew,
  FormSection,
  FieldLabel,
  SubmitIndicator,
  ErrorBanner,
  PasswordField
} from 'features/shared/components'
import TransactionDetails from './MultiSignTransactionDetails/TransactionDetails'
import {DropdownButton, MenuItem} from 'react-bootstrap'
import {reduxForm} from 'redux-form'
import ActionItem from './FormActionItem'
import React from 'react'
import styles from './New.scss'
import  TxContainer  from './NewTransactionsContainer/TxContainer'
import disableAutocomplete from 'utility/disableAutocomplete'
import actions from 'actions'
import { getAssetDecimal} from '../../transactions'
import {withNamespaces} from 'react-i18next'
import { btmID } from 'utility/environment'



class AdvancedTxForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showDropdown: false,
      showAdvanced: false,
      counter: 0
    }

    this.submitWithValidation = this.submitWithValidation.bind(this)
    this.addActionItem = this.addActionItem.bind(this)
    this.removeActionItem = this.removeActionItem.bind(this)
    this.toggleDropwdown = this.toggleDropwdown.bind(this)
    this.closeDropdown = this.closeDropdown.bind(this)
    this.disableSubmit = this.disableSubmit.bind(this)
  }

  toggleDropwdown() {
    this.setState({showDropdown: !this.state.showDropdown})
  }

  closeDropdown() {
    this.setState({showDropdown: false})
  }

  addActionItem(type) {
    const counter = this.state.counter
    let obj
    if(type === 'spend_account' || type === 'veto'){
      obj = {
        type: type,
        ID: counter,
        accountAlias: this.props.currentAccount
      }
    }else{
      obj = {
        type: type,
        ID: counter,
      }
    }
    this.props.fields.actions.addField(obj)
    this.closeDropdown()
    this.setState({
      counter: counter+1
    })
  }

  disableSubmit(actions) {
    return actions.length == 0 && !this.state.showAdvanced
  }

  removeActionItem(index) {
    this.props.fields.actions.removeField(index)
  }

  submitWithValidation(data) {
    return new Promise((resolve, reject) => {
      this.props.submitForm(Object.assign({}, data, {state: this.state, form: 'advancedTx'}))
        .catch((err) => {
          const response = {}

          if (err.data) {
            response.actions = []

            err.data.forEach((error) => {
              response.actions[error.data.actionIndex] = {type: error}
            })
          }

          response['_error'] = err
          return reject(response)
        })
    })
  }

  render() {
    const {
      fields: {signTransaction, actions, submitAction, password},
      error,
      handleSubmit,
      submitting
    } = this.props
    const t = this.props.t

    let submitLabel = t('transaction.new.submit')
    const hasBaseTransaction = ((signTransaction.value || '').trim()).length > 0
    if (submitAction.value == 'generate' && !hasBaseTransaction) {
      submitLabel = t('transaction.advance.generateJson')
    }

    return (
      <TxContainer
        error={error}
        onSubmit={handleSubmit(this.submitWithValidation)}
        submitting={submitting}
        submitLabel= {submitLabel}
        disabled={this.disableSubmit(actions)}
        className={`${styles.content} ${styles.center}`}
      >
        <FormSection title='Actions'>
          {actions.map((action, index) =>
            <ActionItem
              key={`form-action-${action.ID.value}`}
              index={index}
              fieldProps={action}
              accounts={this.props.accounts}
              assets={this.props.assets}
              remove={this.removeActionItem}
              decimal={getAssetDecimal(action, this.props.asset)}
            />)}

          <div className={`btn-group ${styles.addActionContainer} ${this.state.showDropdown && 'open'}`}>
            <DropdownButton
              className={`btn btn-default ${styles.addAction}`}
              id='input-dropdown-addon'
              title='+ Add action'
              onSelect={this.addActionItem}
            >
              <MenuItem eventKey='spend_account'>Spend from account</MenuItem>
              <MenuItem eventKey='control_address'>Control with address</MenuItem>
              <MenuItem eventKey='vote_output'>Vote</MenuItem>
              <MenuItem eventKey='veto'>Veto</MenuItem>
              {/* <MenuItem eventKey='cross_chain_in'>Cross Chain In</MenuItem> */}
              {/* <MenuItem eventKey='cross_chain_out'>Cross Chain Out</MenuItem> */}
            </DropdownButton>
          </div>
        </FormSection>

        {!this.state.showAdvanced &&
        <FormSection>
          <a href='#'
             className={styles.showAdvanced}
             onClick={(e) => {
               e.preventDefault()
               this.setState({showAdvanced: true})
             }}
          >
          {t('transaction.advance.showAdvanced')}
          </a>
        </FormSection>
        }

        {this.state.showAdvanced &&
        <FormSection title={t('transaction.advance.option')}>
          <div>
            <TransactionDetails
              fieldProps={signTransaction}
              decode={this.props.decode}
              transaction={this.props.decodedTx}
              showJsonModal={this.props.showJsonModal}
              asset={this.props.asset}
              btmAmountUnit = {this.props.btmAmountUnit}
            />

            <FieldLabel>{t('transaction.advance.buildType')}</FieldLabel>
            <table className={styles.submitTable}>
              <tbody>
              <tr>
                <td><input id='submit_action_submit' type='radio' {...submitAction} value='submit'
                           checked={submitAction.value == 'submit'}/></td>
                <td>
                  <label
                    htmlFor='submit_action_submit'>{ t('transaction.advance.submitToBlockchain')}</label>
                  <br/>
                  <label htmlFor='submit_action_submit' className={styles.submitDescription}>
                    {t('transaction.advance.submitLabel')}
                  </label>
                </td>
              </tr>
              <tr>
                <td><input id='submit_action_generate' type='radio' {...submitAction} value='generate'
                           checked={submitAction.value == 'generate'}/></td>
                <td>
                  <label htmlFor='submit_action_generate'>{ t('transaction.advance.needMoreSign')}</label>
                  <br/>
                  <label htmlFor='submit_action_generate' className={styles.submitDescription}>
                    {t('transaction.advance.needMoreSignDescription')}
                  </label>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </FormSection>}

        {(actions.length > 0 || this.state.showAdvanced) && <FormSection>
            <label className={styles.title}>{t('key.password')}</label>
            <PasswordField
              placeholder={t('key.passwordPlaceholder')}
              fieldProps={password}
            />
          </FormSection>}
        </TxContainer>
    )
  }
}

const validate = (values, props) => {
  const errors = {actions: {}}
  const t = props.t

  // Base transaction
  let baseTx = (values.signTransaction || '').trim()
  try {
    JSON.parse(baseTx)
  } catch (e) {
    if (baseTx && e) {
      errors.signTransaction = t('errorMessage.jsonError')
    }
  }

  // Actions
  let numError
  values.actions.forEach((action, index) => {
    const item = values.actions[index]
    numError = (!/^\d+(\.\d+)?$/i.test(values.actions[index].amount))
    if (numError) {
      errors.actions[index] = {...errors.actions[index], amount: t('errorMessage.amountError')}
    }
    if(((item.assetAlias &&
      (item.assetAlias).toUpperCase() !== 'BTM') ||
        ((item.assetId &&
        item.assetId !== btmID)))
      && item.type == 'cross_chain_in' && !item.rawDefinitionByte){
      errors.actions[index] = {...errors.actions[index], rawDefinitionByte: t('errorMessage.rawDefinitionByteError')}

    }
  })
  return errors
}

const mapDispatchToProps = (dispatch) => ({
  ...BaseNew.mapDispatchToProps('transaction')(dispatch),
  decode: (transaction) => dispatch( actions.transaction.decode(transaction)),
  showJsonModal: (body) => dispatch(actions.app.showModal(
    body,
    actions.app.hideModal,
    null,
    { wide: true }
  )),
})

export default withNamespaces('translations') (BaseNew.connect(
  (state, ownProps) => ({
    ...BaseNew.mapStateToProps('transaction')(state, ownProps),
    decodedTx: state.transaction.decodedTx,
    currentAccount : state.account.currentAccount
  }),
  mapDispatchToProps,
  reduxForm({
    form: 'AdvancedTransactionForm',
    fields: [
      'signTransaction',
      'actions[].ID',
      'actions[].accountId',
      'actions[].accountAlias',
      'actions[].assetId',
      'actions[].assetAlias',
      'actions[].amount',
      'actions[].outputId',
      'actions[].type',
      'actions[].address',
      'actions[].vote',
      'actions[].sourceId',
      'actions[].vmVersion',
      'actions[].rawDefinitionByte',
      'actions[].issuanceProgram',
      'actions[].sourcePos',
      'actions[].password',
      'submitAction',
      'password'
    ],
    validate,
    touchOnChange: true,
    initialValues: {
      submitAction: 'submit',
    },
  }
  )(AdvancedTxForm)
))


