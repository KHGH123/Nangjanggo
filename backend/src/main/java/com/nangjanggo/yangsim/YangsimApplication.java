package com.nangjanggo.yangsim;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class YangsimApplication {

	public static void main(String[] args) {
		SpringApplication.run(YangsimApplication.class, args);
	}
}
