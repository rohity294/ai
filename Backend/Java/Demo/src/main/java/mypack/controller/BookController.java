package mypack.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import exception.BookNotFoundException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.Content;
//http://localhost:8080/swagger-ui/index.html

import mypack.entity.Book;
import mypack.service.BookService;




@RestController
@RequestMapping("/api/v1/books")
public class BookController {
    private BookService bookService;
    
    //@Autowired can be avoided because this Spring bean has only 1 constructor
	public BookController(BookService bookService) {
		super();
		this.bookService = bookService;
	}
	
	//Swagger Documentation
	@Operation(summary = "Getting all the books from the database")
	@ApiResponse(description = "Return a list of books" , responseCode = "200")
	//Swagger Documentation
	@GetMapping
	List<Book> getAllBooks(){
		return this.bookService.getAllBooks();
	}
	
	//Crude Approach
	/*@GetMapping("/{id}")
	Optional<Book> getBookByID(@PathVariable Integer id){
		return this.bookService.getBookByID(id);
	}*/
	
	//Swagger Documentation
	@Operation(summary = "Fetching book by ID from the database")
	@ApiResponses(value = {
			@ApiResponse(description = "Return a book of specified ID" , responseCode = "200",
					content = {@Content(mediaType = MediaType.APPLICATION_JSON_VALUE)}),
			@ApiResponse(description = "When no book exist for the id input", responseCode = "404",
			content = {@Content(mediaType = MediaType.APPLICATION_JSON_VALUE)})
	})
	//Swagger Documentation
	//Better Approach With Exception Handling
	@GetMapping("/{id}")
	Optional<Book> getBookByID(@PathVariable Integer id){
		Optional<Book> foundBook = this.bookService.getBookByID(id);
		System.out.println(foundBook);
		if(!foundBook.isEmpty()) {
			return foundBook;
		}
		throw new BookNotFoundException("No such book exists with id: " + id);
	}
	
	//Crude Approach
	/*@PostMapping
	Book addBook(@RequestBody Book book) {
		Book createdBook = bookService.addBook(book);
		return createdBook;
	}*/
	
	//Approach returning location URI
	/*@PostMapping
	ResponseEntity<Book> addBook(@RequestBody Book book) {
		Book createdBook = bookService.addBook(book);
		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(createdBook.getBookId()).toUri();
		return ResponseEntity.created(location).build()	;
	}*/
	
	//Swagger Demo
	@Operation(summary = "Creating a new book or adding a new book to the database")
	@ApiResponses(value = {
			@ApiResponse(description = "Book Created" , responseCode = "200",
					content = {@Content(mediaType = MediaType.APPLICATION_JSON_VALUE)})
	})
	//Swagger Demo
	//Approach returning status ok()
	@PostMapping
	ResponseEntity<Book> addBook(@RequestBody Book book) {
		Book createdBook = bookService.addBook(book);
		if(createdBook!=null) {
			return ResponseEntity.ok().build()	;
		}
		return null;
	}
	
	@DeleteMapping("/{id}")
	void deleteBookByID(@PathVariable Integer id) {
		this.bookService.deleteBookByID(id);
	}
	
	@PostMapping("/{id}")
	Book updateBook(@RequestBody Book updatedBook, @PathVariable Integer id) {
		Optional<Book> existingBookOp = this.bookService.getBookByID(id);
		if(existingBookOp.isEmpty()) {// should never happen because only when the book exists, it would show on the UI, clicking whose update button the use has reached till this point
			return null;
		}
		Book existingBook = existingBookOp.get();
		existingBook.setBookName(updatedBook.getBookName());
		existingBook.setBookPrice(updatedBook.getBookPrice());
		existingBook.setBookAuthorName(updatedBook.getBookAuthorName());
		this.bookService.addBook(existingBook);
		return existingBook;
	}
    
}
