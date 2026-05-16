package com.nangjanggo.yangsim.hardware;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface HardwareDeviceRepository extends JpaRepository<HardwareDevice, Long> {
    Optional<HardwareDevice> findByFridgeId(Long fridgeId);
    Optional<HardwareDevice> findByDeviceIdAndFridgeId(String deviceId, Long fridgeId);
}
