package com.nangjanggo.yangsim;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;

@SpringBootApplication
public class YangsimApplication {

	public static void main(String[] args) {
		SpringApplication.run(YangsimApplication.class, args);
	}

	@GetMapping(value="/")
	public String HelloWorld(){
		return "Hello World";
	}
}
