import { useState, useEffect } from 'react'
import { useMutation } from '@apollo/client'
import { LOGIN, CURRENT_USER } from '../queries'

const LoginForm = ({ setError, setToken, show = false }) => {
  if (!show) return false
  const [username, setUsername] = useState('JAP')
  const [password, setPassword] = useState('secret')


  const [ login, result ] = useMutation(LOGIN,
    {
    refetchQueries: [ { query: CURRENT_USER } ],
    onError: (error) => {
      setError(error.graphQLErrors[0].message)
    }
  })


  useEffect(() => {
    if (result.data) {
      const token = result.data.login.value
      localStorage.setItem('books-user-token', token)
      setToken(token)
    }
  }, [result.data])

  const submit = async (event) => {
    event.preventDefault()

    login({ variables: { username, password } })
  }

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          username <input
            value={username}
            onChange={({ target }) => setUsername(target.value)}
          />
        </div>
        <div>
          password <input
            type='password'
            value={password}
            onChange={({ target }) => setPassword(target.value)}
          />
        </div>
        <button type='submit'>login</button>
      </form>
    </div>
  )
}

export default LoginForm