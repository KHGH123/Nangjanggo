package com.nangjanggo.yangsim.fridge;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FridgeRepository extends JpaRepository<Fridge, Long> {

    List<Fridge> findByGroupId(Long groupId);
    List<Fridge> findByGroupId(Long groupId, Sort sort);
    List<Fridge> findByGroupIdAndNameContaining(Long groupId, String name, Sort sort);
    Optional<Fridge> findByIdAndGroupId(Long id, Long groupId);
    List<Fridge> findByGroupIdAndIdIn(Long groupId, List<Long> ids);
    void deleteByGroupId(Long groupId);
}
