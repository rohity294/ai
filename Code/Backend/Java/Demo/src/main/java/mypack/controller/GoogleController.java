package mypack.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
import mypack.service.GoogleService;

@RestController
@RequestMapping("/api/v1/google-data")
public class GoogleController {
	private GoogleService googleService;

	// @Autowired can be avoided because this Spring bean has only 1 constructor
	public GoogleController(GoogleService googleService) {
		super();
		this.googleService = googleService;
	}

	// Swagger Documentation
	@Operation(summary = "Getting data from Google API")
	@ApiResponse(description = "Returns Google API Data", responseCode = "200")
	// Swagger Documentation
	@GetMapping
	void getAllGoogleApiData() {
	}
	
	@PostMapping
	Object consumePromptAndFetchAllGoogleApiData(@RequestBody String prompt) {
		return this.googleService.consumePromptAndFetchAllGoogleApiData(prompt);
	}
}
