package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.group.Group;
import com.nangjanggo.yangsim.group.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final GroupRepository groupRepository;

    @Override
    public void run(String... args) {
        if (!groupRepository.existsByGroupName("테스트그룹")) {
            Group group = new Group();
            group.setGroupName("테스트그룹");
            group.setInviteCode("TEST123");
            group.setDescription("테스트용 그룹입니다.");
            groupRepository.save(group);
            System.out.println("[DataInitializer] 테스트 그룹 생성 완료: 그룹명='테스트그룹', 초대코드='TEST123'");
        }
    }
}
