import React from 'react'
import { BaseNew, FormContainer, FormSection, TextField } from 'features/shared/components'
import { reduxForm } from 'redux-form'

class New extends React.Component {
  constructor(props) {
    super(props)

    this.submitWithValidations = this.submitWithValidations.bind(this)
  }

  submitWithValidations(data) {
    return new Promise((resolve, reject) => {
      this.props.submitForm(data)
        .catch((err) => reject({_error: err}))
    })
  }

  render() {
    const {
      fields: { alias, filter },
      error,
      handleSubmit,
      submitting
    } = this.props

    return(
      <FormContainer
        error={error}
        label='New transaction feed'
        onSubmit={handleSubmit(this.submitWithValidations)}
        submitting={submitting} >

        <FormSection title='Feed Information'>
          <TextField title='Alias' placeholder='Alias' fieldProps={alias} autoFocus={true} />
          <TextField title='Filter' placeholder='Filter' fieldProps={filter} />
        </FormSection>
      </FormContainer>
    )
  }
}

const fields = [ 'alias', 'filter' ]
export default BaseNew.connect(
  BaseNew.mapStateToProps('transactionFeed'),
  BaseNew.mapDispatchToProps('transactionFeed'),
  reduxForm({
    form: 'newTxFeed',
    fields,
  })(New)
)
