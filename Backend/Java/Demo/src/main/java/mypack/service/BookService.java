package mypack.service;

import java.util.List;
import java.util.Optional;

import mypack.entity.Book;

public interface BookService {
   List<Book> getAllBooks();
   Optional<Book> getBookByID(int id);
   Book addBook(Book book);
   void deleteBookByID(int id);
}
