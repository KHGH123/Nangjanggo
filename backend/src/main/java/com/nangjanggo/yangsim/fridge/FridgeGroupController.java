package com.nangjanggo.yangsim.fridge;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class FridgeGroupController {

    private final FridgeService fridgeService;

    @GetMapping("/fridges/{fridgeId}/group")
    public ResponseEntity<?> getGroupByFridgeId(@PathVariable Long fridgeId) {
        return ResponseEntity.ok(fridgeService.getGroupByFridgeId(fridgeId));
    }
}