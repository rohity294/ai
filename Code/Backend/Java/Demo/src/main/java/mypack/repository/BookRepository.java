package mypack.repository;
import mypack.entity.Book;


import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Integer>{
   
}
