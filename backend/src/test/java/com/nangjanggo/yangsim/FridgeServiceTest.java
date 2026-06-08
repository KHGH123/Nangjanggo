package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.fridge.*;
import com.nangjanggo.yangsim.group.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FridgeServiceTest {

    @Mock FridgeRepository fridgeRepository;
    @Mock GroupRepository groupRepository;
    @Mock GroupMemberRepository groupMemberRepository;
    @Mock GroupMemberHelper groupMemberHelper;

    @InjectMocks FridgeService fridgeService;

    // ─── getFridges ──────────────────────────────────────────────

    // 테스트 1: 그룹 멤버가 아니면 예외
    @Test
    void getFridges_멤버아니면_예외() {
        doThrow(new IllegalArgumentException("그룹 멤버가 아닙니다."))
                .when(groupMemberHelper).checkMember(1L, 1L);

        assertThatThrownBy(() -> fridgeService.getFridges(1L, 1L, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("그룹 멤버가 아닙니다.");
    }

    // 테스트 2: 냉장고 목록 정상 조회
    @Test
    void getFridges_정상조회() {
        Fridge fridge = new Fridge();
        fridge.setId(1L);
        fridge.setName("메인냉장고");
        when(fridgeRepository.findByGroupId(1L, null)).thenReturn(List.of(fridge));

        List<FridgeResponseDto.Info> result = fridgeService.getFridges(1L, 1L, null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFridgeName()).isEqualTo("메인냉장고");
    }

    // ─── getFridge ───────────────────────────────────────────────

    // 테스트 3: 냉장고 단건 정상 조회
    @Test
    void getFridge_단일조회_정상() {
        Fridge fridge = new Fridge();
        fridge.setId(1L);
        fridge.setName("김치냉장고");
        when(fridgeRepository.findByIdAndGroupId(1L, 1L)).thenReturn(Optional.of(fridge));

        FridgeResponseDto.Info result = fridgeService.getFridge(1L, 1L, 1L);

        assertThat(result.getFridgeId()).isEqualTo(1L);
        assertThat(result.getFridgeName()).isEqualTo("김치냉장고");
    }

    // 테스트 4: 존재하지 않는 냉장고 단건 조회 시 예외
    @Test
    void getFridge_존재하지않는냉장고_예외() {
        when(fridgeRepository.findByIdAndGroupId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> fridgeService.getFridge(1L, 1L, 99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("해당 그룹의 냉장고를 찾을 수 없습니다.");
    }

    // ─── createFridge ────────────────────────────────────────────

    // 테스트 5: 냉장고 생성 정상 동작
    @Test
    void createFridge_정상생성() {
        Group group = new Group();
        group.setId(1L);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        Fridge saved = new Fridge();
        saved.setId(10L);
        saved.setName("김치냉장고");
        when(fridgeRepository.save(any())).thenReturn(saved);

        FridgeRequestDto.Create dto = mock(FridgeRequestDto.Create.class);
        when(dto.getFridgeName()).thenReturn("김치냉장고");

        FridgeResponseDto.Info result = fridgeService.createFridge(1L, 1L, dto);

        assertThat(result.getFridgeId()).isEqualTo(10L);
        assertThat(result.getFridgeName()).isEqualTo("김치냉장고");
    }

    // 테스트 6: 관리자가 아니면 냉장고 생성 불가
    @Test
    void createFridge_관리자아니면_예외() {
        doThrow(new IllegalArgumentException("관리자 권한이 필요합니다."))
                .when(groupMemberHelper).checkAdmin(1L, 1L);

        FridgeRequestDto.Create dto = mock(FridgeRequestDto.Create.class);

        assertThatThrownBy(() -> fridgeService.createFridge(1L, 1L, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("관리자 권한이 필요합니다.");
    }

    // ─── updateFridge ────────────────────────────────────────────

    // 테스트 7: 냉장고 이름 정상 수정
    @Test
    void updateFridge_정상수정() {
        Fridge fridge = new Fridge();
        fridge.setId(1L);
        fridge.setName("기존이름");
        when(fridgeRepository.findByIdAndGroupId(1L, 1L)).thenReturn(Optional.of(fridge));

        FridgeRequestDto.Update dto = mock(FridgeRequestDto.Update.class);
        when(dto.getFridgeName()).thenReturn("새이름");

        fridgeService.updateFridge(1L, 1L, 1L, dto);

        assertThat(fridge.getName()).isEqualTo("새이름");
    }

    // 테스트 8: 관리자가 아니면 냉장고 수정 불가
    @Test
    void updateFridge_관리자아니면_예외() {
        doThrow(new IllegalArgumentException("관리자 권한이 필요합니다."))
                .when(groupMemberHelper).checkAdmin(1L, 1L);

        FridgeRequestDto.Update dto = mock(FridgeRequestDto.Update.class);

        assertThatThrownBy(() -> fridgeService.updateFridge(1L, 1L, 1L, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("관리자 권한이 필요합니다.");
    }

    // ─── deleteFridge ────────────────────────────────────────────

    // 테스트 9: 존재하지 않는 냉장고 삭제 시 예외
    @Test
    void deleteFridge_존재하지않는냉장고_예외() {
        when(fridgeRepository.findByIdAndGroupId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> fridgeService.deleteFridge(1L, 1L, 99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("해당 그룹의 냉장고를 찾을 수 없습니다.");
    }

    // 테스트 10: 냉장고 단건 정상 삭제
    @Test
    void deleteFridge_정상삭제() {
        Fridge fridge = new Fridge();
        fridge.setId(1L);
        when(fridgeRepository.findByIdAndGroupId(1L, 1L)).thenReturn(Optional.of(fridge));

        fridgeService.deleteFridge(1L, 1L, 1L);

        verify(fridgeRepository).delete(fridge);
    }

    // ─── deleteFridges ───────────────────────────────────────────

    // 테스트 11: 삭제 ID 목록이 null이면 예외
    @Test
    void deleteFridges_리스트null이면_예외() {
        assertThatThrownBy(() -> fridgeService.deleteFridges(1L, 1L, false, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("삭제할 냉장고를 지정하세요.");
    }

    // 테스트 12: 한 번에 30개 초과 삭제 시 예외
    @Test
    void deleteFridges_30개초과_예외() {
        List<Long> ids = Collections.nCopies(31, 1L);

        assertThatThrownBy(() -> fridgeService.deleteFridges(1L, 1L, false, ids))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("한 번에 최대 30개까지 삭제할 수 있습니다.");
    }

    // 테스트 13: 일괄 삭제 정상 처리
    @Test
    void deleteFridges_정상삭제() {
        Fridge f1 = new Fridge(); f1.setId(1L);
        Fridge f2 = new Fridge(); f2.setId(2L);
        when(fridgeRepository.findByGroupIdAndIdIn(1L, List.of(1L, 2L))).thenReturn(List.of(f1, f2));

        fridgeService.deleteFridges(1L, 1L, false, List.of(1L, 2L));

        verify(fridgeRepository).deleteAll(List.of(f1, f2));
    }

    // ─── getGroupByFridgeId ──────────────────────────────────────

    // 테스트 14: 냉장고 ID로 그룹 ID 정상 조회
    @Test
    void getGroupByFridgeId_정상조회() {
        Group group = new Group();
        group.setId(10L);
        Fridge fridge = new Fridge();
        fridge.setGroup(group);
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridge));

        Map<String, Long> result = fridgeService.getGroupByFridgeId(1L);

        assertThat(result.get("groupId")).isEqualTo(10L);
    }

    // 테스트 15: 존재하지 않는 냉장고로 그룹 조회 시 예외
    @Test
    void getGroupByFridgeId_존재하지않는냉장고_예외() {
        when(fridgeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> fridgeService.getGroupByFridgeId(99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("냉장고를 찾을 수 없습니다.");
    }
}
