package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.fridge.*;
import com.nangjanggo.yangsim.group.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FridgeServiceTest {

    @Mock FridgeRepository fridgeRepository;
    @Mock GroupRepository groupRepository;
    @Mock GroupMemberRepository groupMemberRepository;

    @InjectMocks FridgeService fridgeService;

    // 테스트 1: 그룹 멤버가 아니면 예외 발생
    @Test
    void getFridges_멤버아니면_예외() {
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> fridgeService.getFridges(1L, 1L, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("그룹 멤버가 아닙니다.");
    }

    // 테스트 2: 냉장고 추가 시 sequenceNo가 마지막+1
    @Test
    void createFridge_순서번호_마지막플러스1() {
        GroupMember member = new GroupMember();
        member.setStatus(GroupMember.Status.ACTIVE);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
            .thenReturn(Optional.of(member));

        Group group = new Group();
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        Fridge existing = new Fridge();
        existing.setSequenceNo(3);
        when(fridgeRepository.findByGroupIdOrderBySequenceNoAsc(1L))
            .thenReturn(List.of(existing));

        Fridge saved = new Fridge();
        saved.setId(10L);
        saved.setName("김치냉장고");
        saved.setSequenceNo(4);
        when(fridgeRepository.save(any())).thenReturn(saved);

        FridgeRequestDto.Create dto = mock(FridgeRequestDto.Create.class);
        when(dto.getFridgeName()).thenReturn("김치냉장고");

        FridgeResponseDto.Info result = fridgeService.createFridge(1L, 1L, dto);

        assertThat(result.getSequenceNo()).isEqualTo(4);
    }

    // 테스트 3: fridges null이면 전체 삭제
    @Test
    void deleteFridges_리스트null이면_전체삭제() {
        GroupMember member = new GroupMember();
        member.setStatus(GroupMember.Status.ACTIVE);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
            .thenReturn(Optional.of(member));

        Fridge f1 = new Fridge(); f1.setId(1L);
        Fridge f2 = new Fridge(); f2.setId(2L);
        when(fridgeRepository.findByGroupIdOrderBySequenceNoAsc(1L))
            .thenReturn(List.of(f1, f2));

        FridgeRequestDto.Delete dto = new FridgeRequestDto.Delete();

        fridgeService.deleteFridges(1L, 1L, dto);

        verify(fridgeRepository).deleteAll(List.of(f1, f2));
    }
}
