import { useState } from "react"

const Books = ({show, books}) => {
  const [filterGenre, setFilterGenre] = useState(null)

  if (!show) {
    return null
  }

  let genres = books.reduce((genres, book) => {
    return genres.concat(book.genres)
  }, [])
  genres = new Set(genres)
  genres = genres.keys().toArray()

  const toggleGenre = (genre) => {
    if (filterGenre === genre) {
      setFilterGenre(null)
      return
    }
    setFilterGenre(genre)
  }
  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((b) => {
            if (b.genres.includes(filterGenre) || filterGenre === null) {
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
    {
      genres.map(g => { return <button key={g} onClick={() => toggleGenre(g)}>{g}</button>})
    }
    </div>
  )
}

export default Books
