import LoginButton from './components/LoginButton'
import SignMessageButton from './components/SignMessage'
import SignTransactionButton from './components/SignTransactionButton'
import SendTransactionButton from './components/SendTransactionButton'
import BatchSendTransactionButton from './components/BatchSendTransactionButton'
import BatchSignTransactionButton from './components/BatchSignTransactionButton'

function App() {

  return (
    <>
      <LoginButton />
      <SignMessageButton />
      <SignTransactionButton />
      <SendTransactionButton />
      <BatchSignTransactionButton />
      <BatchSendTransactionButton />
    </>
  )
}

export default App
