import { useState } from "react"
import { EDIT_AUTHOR, ALL_AUTHORS } from "../queries"
import { useMutation } from "@apollo/client"

const Authors = ({show, authors}) => {
  const [name, setName] = useState('')
  const [born, setBorn] = useState('')

  const [ editAuthor ] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
    onError: (error) => {
      console.log(error)
    }
  })

  if (!show) {
    return null
  }
  
  const updateAuthor = (e) => {
    e.preventDefault()
    editAuthor({ variables: { name, setBornTo: parseInt(born, 10) } })
    setName('')
    setBorn('')
  }

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Set birthyear</h2>
      <br />
      author<select onChange={(e) => { setName(e.target.value) }}>
      {
        authors.map(a => 
          <option key={a.name} value={a.name}>{ a.name }</option>
        )
      }
      </select>
      <br />
      born<input
            value={born}
            type="number"
            onChange={({ target }) => setBorn(target.value)}
          />
      <button onClick={updateAuthor} type="button">
        update author
      </button>
      </div>
  )
}

export default Authors
