const express = require("express");
const app = express();
const port = 4000;
const { query } = require('./database.js');
require("dotenv").config();
// const books = require("./books.js");

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Welcome to the Job App Tracker API!!!!");
  });

// app.get("/books", (req, res) => {
//     res.send(books);
//   });
app.get("/books", async (req,res) => {
    try {
      const allBooks = await query(`SELECT * FROM book_inventory`);
      res.status(200).json(allBooks.rows);
    } catch (error) {
      console.log(error);
    }
  })

app.get("/books/:id", async (req, res) => {
  const bookId = parseInt (req.params.id, 10);
  
  try {
    const book = await query (`SELECT * FROM book_inventory WHERE id = $1`, [bookId]);

    if (book.rows.length > 0) {
      res.status(200).json(book.rows[0]);
    } else {
      res.status(404).send({message: "Book not found"});
    }
  } catch (error) {
    console.log(error)
  }
})

app.post("/books", async (req, res) => {
    const { title, author, pages, yearPublished, genre, status } = req.body;

    try {
        const newBook = await query (
            `INSERT INTO book_inventory (title, author, pages, yearPublished, genre, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, author, pages, yearPublished, genre, status]
        );
        console.log(newBook);
        res.status(201).json(newBook.rows[0]);
    } catch (error) {
        console.log("Something went wrong", error);
    }
});

app.delete("/books/:id", async (req, res) => {
  const bookId = parseInt (req.params.id, 10);
  
  try {
    const deleteOp = await query (`DELETE FROM book_inventory WHERE id = $1`, [bookId]);
    if (deleteOp.rowCount > 0) {
      res.status(200).send({ message: "book deleted successfully "});
    } else {
      res.status(404).send({message: "book not found"});
    }

  } catch (error) {
    console.log(error)
  }
});

app.patch("/books/:id", async (req, res) => {
  const bookId = parseInt(req.params.id, 10);

  const fieldNames = [
    "title",
    "author",
    "pages",
    "yearPublished",
    "genre",
    "status",
  ].filter((name) => req.body[name]);

  const updatedValues = fieldNames.map((name) => req.body[name]);
  const setValuesSQL = fieldNames
    .map((name, i) => {
      return `${name} = $${i + 1}`;
    })
    .join(', ');

  try {
    const updatedBook = await query(
      `UPDATE book_inventory SET ${setValuesSQL} WHERE id = $${fieldNames.length + 1} RETURNING *`,
      [...updatedValues, bookId]
    );

    if (updatedBook.rows.length > 0) {
      res.status(200).json(updatedBook.rows[0]);
    } else {
      res.status(404).send({ message: "Book not found" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
    console.error(err);
  }
});



app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
