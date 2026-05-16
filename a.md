
| Domain | Method | Endpoint | Request / Response | Description |
|---|---|---|---|---|
| User | POST | /register | {email:String, NOT NULL<br>password:String, NOT NULL<br>name:String, NOT NULL<br>isActive:boolean, default True<br>createdAt:Date, NOT NULL} | 회원가입 정보 전송 |
| User | POST | /login | {email:String, NOT NULL<br>password:String, NOT NULL} | 로그인 정보 전송 |
| User | POST | /user/verification/send | {email:String,<br>type:"REGISTER" \| "PASSWORD_RESET"} | 인증 코드 전송 |
| User | POST | /user/verification/verify | {email:String,<br>code:String} | 인증 코드 검증 |
| User | PUT | /mypage/img |  | 이미지 변경 |
| User | PUT | /mypage | {name:String, NOT NULL<br>email:String, NOT NULL} | 이메일, 이름 변경 |
| User | PUT | /mypage/pwd | {currentPassword:String<br>newPassword:String} | 비밀번호 변경 |
| User | POST | /user/reset-password |  | 비밀번호 재설정 |
| User | GET | /mypage | OUTPUT<br>email:String, NULL<br>name:String, NOT NULL<br>profileImageUrl:String, NULL | 내 정보 조회 |
| User | DELETE | /mypage |  | 회원 탈퇴 |
| Group | GET | /groups | INPUT<br>?groupName=String&sort=String<br>ex) ?sort=joindate,asc<br><br>OUTPUT<br>groupId:Long<br>groupName:String<br>memberCount:Int<br>isAdmin:Boolean<br>joinDate:Date<br>leaveDate:Date | 내가 속한 그룹 조회 |
| Group | POST | /groups | {groupName:String, NOT NULL<br>nickname:String, NOT NULL<br>sharedSchedule:boolean<br>description:String<br>period:Date, default 14<br>usePersonalDates:boolean<br>createdBy:Long, NOT NULL<br>createdAt:Date, NOT NULL<br>joinDate:Date<br>leaveDate:Date} | 그룹 생성 |
| Group | GET | /groups/{groupId} | OUTPUT<br>groupName:String<br>periodDate:Date<br>joinDate:Date<br>leaveDate:Date<br>createdBy:Long | 그룹 단일 조회 |
| Group | PUT | /groups/{groupId} | {groupName:String, NOT NULL<br>description:String<br>period:Date} | (관리자) 그룹 정보 수정 |
| Group | DELETE | /groups/{groupId} |  | (관리자) 그룹 삭제 |
| Group | POST | /groups/join | {joinDate:Date<br>leaveDate:Date<br>nickname:String} | 그룹 참여 |
| Group | GET | /groups/{groupId}/invite-code | OUTPUT<br>code:String | 초대 코드 생성 |
| Group | POST | /groups/{groupId}/verify-code | {code:String} | 초대 코드 검증 |
| Group | GET | /groups/{groupId}/members | INPUT<br>?nickname=String&sort=name,desc<br><br>OUTPUT<br>memberId:Long<br>nickname:String<br>role:String<br>joinDate:Date<br>leaveDate:Date<br>isMe:Boolean | 그룹 멤버 조회 |
| Group | GET | /groups/{groupId}/members/{memberId} | OUTPUT<br>memberId:Long<br>nickname:String<br>role:String<br>joinDate:Date<br>leaveDate:Date<br>isMe:Boolean | 멤버 상세 조회 |
| Group | PUT | /groups/{groupId}/members/{memberId} | 관리자: {role:ENUM(ADMIN,MEMBER)}<br>사용자: {nickname:String} | 권한/닉네임 수정 |
| Group | DELETE | /groups/{groupId}/members/{memberId} |  | 멤버 강퇴 또는 탈퇴 |
| Group | DELETE | /groups/{groupId}/members | 전체삭제: ?confirmAll=true<br>선택삭제: {"memberIds":["m1","m2"]} | 멤버 다중 삭제 |
| Fridge | GET | /groups/{groupId}/fridges | INPUT<br>?fridgeName=String&sort=String<br><br>OUTPUT<br>fridgeId:Long<br>fridgeName:String | 냉장고 목록 조회 |
| Fridge | POST | /groups/{groupId}/fridges | {fridgeId:Long<br>fridgeName:String} | 냉장고 추가 |
| Fridge | GET | /groups/{groupId}/fridges/{fridgeId} | OUTPUT<br>fridgeId:Long<br>fridgeName:String | 냉장고 상세 조회 |
| Fridge | PUT | /groups/{groupId}/fridges/{fridgeId} | {fridgeName:String} | 냉장고 이름 변경 |
| Fridge | DELETE | /groups/{groupId}/fridges/{fridgeId} |  | 냉장고 삭제 |
| Fridge | DELETE | /groups/{groupId}/fridges | 전체삭제: ?confirmAll=true<br>선택삭제: {"fridgeIds":["f1","f2"]} | 냉장고 다중 삭제 |
| Food | GET | /groups/{groupId}/foods | INPUT<br>?status=ENUM&memberId=Long&sort=String<br><br>OUTPUT<br>foodId:Long<br>status:ENUM<br>quantity:Int<br>storedDate:Date<br>expirationDate:Date<br>ownerId:Long<br>ownerNickname:String | 그룹 전체 음식 조회 |
| Food | GET | /groups/{groupId}/foods/me | INPUT<br>?status=ENUM<br><br>OUTPUT<br>foodId:Long<br>status:ENUM<br>quantity:Int<br>storedDate:Date<br>expirationDate:Date | 내 음식 조회 (그룹) |
| Food | GET | /groups/{groupId}/fridges/{fridgeId}/foods | INPUT<br>?status=ENUM&memberId=Long&sort=String<br><br>OUTPUT<br>foodId:Long<br>status:ENUM<br>quantity:Int<br>storedDate:Date<br>expirationDate:Date<br>ownerId:Long<br>ownerNickname:String | 특정 냉장고 음식 조회 |
| Food | GET | /groups/{groupId}/fridges/{fridgeId}/foods/me | INPUT<br>?status=ENUM<br><br>OUTPUT<br>foodId:Long<br>status:ENUM<br>quantity:Int<br>storedDate:Date<br>expirationDate:Date | 내 음식 조회 (냉장고) |
| Food | POST | /groups/{groupId}/fridges/{fridgeId}/foods | {name:String<br>quantity:Int<br>memo:String} | 음식 추가 |
| Food | GET | /foods/{foodId} | OUTPUT<br>foodId:Long<br>name:String<br>quantity:Int<br>memo:String<br>status:ENUM(PRIVATE,CANDIDATE,SHARED,EXPIRING,CONSUMED)<br>storedDate:Date<br>expirationDate:Date | 음식 상세 조회 |
| Food | PUT | /foods/{foodId} | {fridgeId:Long<br>name:String<br>quantity:Int<br>memo:String<br>status:ENUM<br>storageDate:Date<br>expirationDate:Date} | 음식 정보 수정 |
| Food | DELETE | /foods/{foodId} |  | 특정 음식 삭제 |
| Food | DELETE | /foods | {"foodIds":[1,2,3]} | 다중 음식 삭제 |
| Food | DELETE | /groups/{groupId}/fridges/{fridgeId}/foods | 전체삭제: ?confirmAll=true<br>선택삭제: {"foodIds":[1,2]} | 냉장고 음식 비우기 |
| Food | DELETE | /groups/{groupId}/members/{memberId}/foods | 전체삭제: ?confirmAll=true<br>선택삭제: {"foodIds":[1,2]} | 특정 멤버 음식 삭제 |
| Food | POST | /groups/{groupId}/foods/{foodId}/claim |  | 찜하기 / 기간 연장 |
| Food | DELETE | /groups/{groupId}/foods/{foodId}/claim |  | 찜 취소 |
| Hardware | POST | /hardware/fridges/{fridgeId}/devices |  | 라즈베리파이 등록 (관리자, deviceId 발급) |
| Hardware | PATCH | /hardware/fridges/{fridgeId}/devices/{deviceId} | {printerUrl:String} | 라즈베리파이 IP 등록 (부팅 시) |
| Hardware | POST | /hardware/fridges/{fridgeId}/label | ?foodId=Long | 라벨 출력 (그룹원 검증 포함) |
| Notification | POST | /api/devices/token | {"token":"ExponentPushToken[xxxxxx]"} | FCM 토큰 등록 |
| Notification | DELETE | /api/devices/token |  | FCM 토큰 삭제 |
| Notification | GET | /api/notification-settings | RESPONSE<br>{pushEnabled:Boolean} | 알림 설정 조회 |
| Notification | PATCH | /api/notification-settings | {pushEnabled:Boolean, default true} | 알림 설정 변경 |
| Notification | GET | /api/notifications |  | 알림 목록 조회 |
| Community | POST | /posts | {userId:String, NOT NULL<br>groupId:String, NOT NULL<br>title:String, NOT NULL<br>context:String, NOT NULL<br>postType:ENUM(NOTICE,NORMAL)<br>createdAt:Date, NOT NULL} | 게시글 작성 |
| Community | GET | /posts |  | 게시글 목록 조회 |
| Community | DELETE | /posts/{postId} | {postId:String, NOT NULL} | 게시글 삭제 |
| Community | PUT | /posts/{postId} | {postId:String, NOT NULL<br>userId:String, NOT NULL<br>title:String, NOT NULL<br>context:String, NOT NULL<br>createdAt:Date, NOT NULL} | 게시글 수정 |
| Community | GET | /posts/{postId} |  | 게시글 상세 조회 |
| Community | GET | /posts/{postId}/comments |  | 댓글 목록 조회 |
| Community | POST | /posts/{postId}/comments | {postId:String, NOT NULL<br>userId:String, NOT NULL<br>context:String, NOT NULL<br>createdAt:Date, NOT NULL} | 댓글 작성 |
| Community | PUT | /comments/{commentId} | {commentId:String, NOT NULL<br>userId:String, NOT NULL<br>context:String, NOT NULL<br>updatedAt:Date, NOT NULL} | 댓글 수정 |
| Community | DELETE | /comments/{commentId} |  | 댓글 삭제 |
| Community | POST | /posts/{postId}/like | {userId:String, NOT NULL} | 게시글 좋아요 |
