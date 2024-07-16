import { useState } from "react"
import { CURRENT_USER } from '../queries'
import { useQuery, useApolloClient } from "@apollo/client"

const Books = ({show, books}) => {
  const activeUser = useQuery(CURRENT_USER)

  if (!show || !activeUser) {
    return null
  }

  if (activeUser.loading) {
    return <div>loading...</div>
  }

  return (
    <div>
      <h2>recommendations</h2>
      <p>books in your favourite genre <b>{activeUser.data.me.favouriteGenre}</b></p>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((b) => {
            if (b.genres.includes(activeUser.data.me.favouriteGenre)) {
              return <tr key={b.title}>
              <td>{b.title}</td>
              <td>{b.author.name}</td>
              <td>{b.published}</td>
            </tr>
            }
            return null
          })}
        </tbody>
      </table>
    </div>
  )
}

export default Books
