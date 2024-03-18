package mypack.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import exception.BookNotFoundException;
import mypack.entity.Book;
import mypack.repository.BookRepository;

@Service
public class BookServiceImpl implements BookService {
	private BookRepository bookRepository;

	// @Autowired can be avoided because this Spring bean has only 1 constructor
	public BookServiceImpl(BookRepository bookRepository) {
		super();
		this.bookRepository = bookRepository;
	}

	@Override
	public List<Book> getAllBooks() {
		return this.bookRepository.findAll();
	}

	// Crude Approach
	/*
	 * @Override public Optional<Book> getBookByID(int id) { return
	 * this.bookRepository.findById(id); }
	 */

	// Better Approach
	public Optional<Book> getBookByID(int id) {
		return this.bookRepository.findById(id);
	}

	@Override
	public Book addBook(Book book) {
		return this.bookRepository.save(book);
	}

	@Override
	public void deleteBookByID(int id) {
		this.bookRepository.deleteById(id);
	}

}
