package mypack.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;

@Entity
public class Book {
	@Id
    @GeneratedValue(strategy=GenerationType.SEQUENCE, generator="MYBOOKID_SEQ")
	@SequenceGenerator(name="MYBOOKID_SEQ")
	private Integer bookId;
	
	private String bookName;
	private double bookPrice;
	private String bookAuthorName;
	
	public Book() {
		super();
	}

	public Book(Integer bookId, String bookName, double bookPrice, String bookAuthorName) {
		super();
		this.bookName = bookName;
		this.bookPrice = bookPrice;
		this.bookAuthorName = bookAuthorName;
	}

	public Integer getBookId() {
		return bookId;
	}

	public void setBookId(Integer bookId) {
		this.bookId = bookId;
	}

	public String getBookName() {
		return bookName;
	}

	public void setBookName(String bookName) {
		this.bookName = bookName;
	}

	public double getBookPrice() {
		return bookPrice;
	}

	public void setBookPrice(double bookPrice) {
		this.bookPrice = bookPrice;
	}

	public String getBookAuthorName() {
		return bookAuthorName;
	}

	public void setBookAuthorName(String bookAuthorName) {
		this.bookAuthorName = bookAuthorName;
	}

	@Override
	public String toString() {
		return "Book [bookId=" + bookId + ", bookName=" + bookName + ", bookPrice=" + bookPrice + ", bookAuthorName="
				+ bookAuthorName + "]";
	}

	
}
