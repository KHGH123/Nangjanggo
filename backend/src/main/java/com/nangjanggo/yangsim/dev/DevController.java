package com.nangjanggo.yangsim.dev;

import com.nangjanggo.yangsim.food.Food;
import com.nangjanggo.yangsim.food.FoodRepository;
import com.nangjanggo.yangsim.food.FoodStatusScheduler;
import com.nangjanggo.yangsim.fridge.FridgeRepository;
import com.nangjanggo.yangsim.group.Group;
import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.group.GroupRepository;
import com.nangjanggo.yangsim.ranking.RankingService;
import com.nangjanggo.yangsim.user.User;
import com.nangjanggo.yangsim.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import org.springframework.context.annotation.Profile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/dev")
@Profile("dev")
public class DevController {

    private final FoodStatusScheduler foodStatusScheduler;
    private final RankingService rankingService;
    private final DevClock devClock;
    private final FoodRepository foodRepository;
    private final FridgeRepository fridgeRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String[] FOOD_NAMES = {
        "우유", "계란", "닭가슴살", "두부", "요거트", "치즈", "햄", "소세지",
        "오렌지주스", "사과", "바나나", "딸기", "당근", "브로콜리", "시금치",
        "김치", "된장", "고추장", "라면", "떡볶이", "삼겹살", "소고기", "참치캔",
        "버터", "크림치즈", "아보카도", "블루베리", "토마토", "오이", "파프리카"
    };

    private static final String[] TAGS = { "육류", "유제품", "채소", "과일", "가공식품", null, null };

    private static final String[] MOCK_NAMES = {
        "김테스트", "이개발", "박모크", "최더미", "정샘플",
        "한테스터", "조디버그", "윤알파", "장베타", "임감마"
    };

    // POST /dev/mock-data  body: { groupId, fridgeId, count, datetime }
    @PostMapping("/mock-data")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> addMockFoods(@RequestBody Map<String, Object> body) {
        Long groupId = Long.valueOf(body.get("groupId").toString());
        Long fridgeId = Long.valueOf(body.get("fridgeId").toString());
        int count = body.containsKey("count") ? Integer.parseInt(body.get("count").toString()) : 10;
        String datetimeStr = body.containsKey("datetime") ? body.get("datetime").toString() : null;
        LocalDateTime now = datetimeStr != null
                ? LocalDateTime.parse(datetimeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : LocalDateTime.now();

        List<GroupMember> members = groupMemberRepository.findByGroupId(groupId).stream()
                .filter(m -> m.getStatus() == GroupMember.Status.ACTIVE)
                .toList();
        if (members.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "그룹에 활성 멤버가 없습니다."));

        fridgeRepository.findByIdAndGroupId(fridgeId, groupId)
                .orElseThrow(() -> new IllegalArgumentException("냉장고를 찾을 수 없습니다."));

        Random rng = new Random();
        // 만료일 분포: D-5 ~ D+14 (음수=이미만료)
        int[] expiryDays = { -5, -2, -1, 0, 1, 1, 2, 3, 5, 7, 10, 14 };

        for (int i = 0; i < count; i++) {
            GroupMember owner = members.get(rng.nextInt(members.size()));
            int dday = expiryDays[rng.nextInt(expiryDays.length)];
            LocalDateTime expiry = now.toLocalDate().plusDays(dday).atStartOfDay();

            Food f = new Food();
            f.setUserId(owner.getUserId());
            f.setGroupId(groupId);
            f.setFridgeId(fridgeId);
            f.setName(FOOD_NAMES[rng.nextInt(FOOD_NAMES.length)] + (i + 1));
            f.setQuantity(rng.nextInt(5) + 1);
            f.setStorageDate(now.minusDays(rng.nextInt(7)));
            f.setExpirationDate(expiry);
            f.setTag(TAGS[rng.nextInt(TAGS.length)]);
            f.setStatus(dday <= 0 ? Food.STATUS.EXPIRING
                    : dday == 1 ? Food.STATUS.CANDIDATE
                    : Food.STATUS.PRIVATE);
            foodRepository.save(f);
        }

        return ResponseEntity.ok(Map.of("message", count + "개 음식 추가 완료", "groupId", groupId, "fridgeId", fridgeId));
    }

    // POST /dev/mock-members  body: { groupId, count, datetime }
    @PostMapping("/mock-members")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> addMockMembers(@RequestBody Map<String, Object> body) {
        Long groupId = Long.valueOf(body.get("groupId").toString());
        int count = body.containsKey("count") ? Integer.parseInt(body.get("count").toString()) : 3;
        String datetimeStr = body.containsKey("datetime") ? body.get("datetime").toString() : null;
        LocalDate joinDate = datetimeStr != null
                ? LocalDateTime.parse(datetimeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME).toLocalDate()
                : LocalDate.now();

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다."));

        String defaultPassword = passwordEncoder.encode("test1234");
        Random rng = new Random();

        for (int i = 0; i < count; i++) {
            String uid = UUID.randomUUID().toString().substring(0, 8);
            String name = MOCK_NAMES[rng.nextInt(MOCK_NAMES.length)] + "_" + uid.substring(0, 4);

            User user = new User();
            user.setEmail("mock_" + uid + "@dev.test");
            user.setPassword(defaultPassword);
            user.setName(name);
            user = userRepository.save(user);

            GroupMember member = new GroupMember();
            member.setGroup(group);
            member.setUserId(user.getId());
            member.setNickname(name);
            member.setRole(GroupMember.Role.MEMBER);
            member.setStatus(GroupMember.Status.ACTIVE);
            member.setJoinDate(joinDate);
            groupMemberRepository.save(member);
        }

        return ResponseEntity.ok(Map.of("message", count + "명 멤버 추가 완료 (비밀번호: test1234)", "groupId", groupId));
    }

    // POST /dev/scheduler  body: { "datetime": "2026-05-28T00:00:00" }
    @PostMapping("/scheduler")
    public ResponseEntity<?> runScheduler(@RequestBody Map<String, String> body) {
        String datetimeStr = body.get("datetime");
        LocalDateTime datetime = datetimeStr != null
                ? LocalDateTime.parse(datetimeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : LocalDateTime.now();

        devClock.setMock(datetime);
        foodStatusScheduler.updateFoodStatuses(datetime);

        // 해당 날짜가 1일이면 랭킹 스냅샷도 함께 실행
        if (datetime.getDayOfMonth() == 1) {
            rankingService.snapshotAndReset(YearMonth.from(datetime));
        }

        return ResponseEntity.ok(Map.of(
                "message", "스케줄러 실행 완료" + (datetime.getDayOfMonth() == 1 ? " (랭킹 스냅샷 포함)" : ""),
                "datetime", datetime.toString()
        ));
    }
}
