import { useState } from "react";
import { useQuery, useApolloClient  } from "@apollo/client";

import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import { ALL_AUTHORS, ALL_BOOKS } from "./queries";
import LoginForm from './components/LoginForm'
import Notify from "./components/Notify";

const App = () => {
  const authorsResult = useQuery(ALL_AUTHORS);
  const booksResult = useQuery(ALL_BOOKS);
  const [errorMessage, setErrorMessage] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('books-user-token'))
  const client = useApolloClient()

  const [page, setPage] = useState("authors");

  if (authorsResult.loading || booksResult.loading) {
    return <div>loading...</div>
  }

  const notify = (message) => {
    setErrorMessage(message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 10000)
  }

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  if (!token) {
    return (
      <>
        <Notify errorMessage={errorMessage} />
        <LoginForm setToken={setToken} setError={notify} />
      </>
    )
  }
  console.log('authhhh', authorsResult.data.allAuthors)
  return (
    <div>
      <Notify errorMessage={errorMessage} />
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        <button onClick={() => setPage("add")}>add book</button>
      </div>

      <Authors show={page === "authors"} authors={authorsResult.data.allAuthors} />

      <Books show={page === "books"} books={booksResult.data.allBooks}/>

      <NewBook show={page === "add"} />
    </div>
  );
};

export default App;
