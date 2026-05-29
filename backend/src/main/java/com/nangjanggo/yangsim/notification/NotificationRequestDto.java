package com.nangjanggo.yangsim.notification;

import lombok.Getter;

public class NotificationRequestDto {

    @Getter
    public static class RegisterToken {
        private String token;
    }

    @Getter
    public static class UpdateSettings {
        private Boolean pushEnabled;
        private Boolean expiryAlertEnabled;
        private Boolean sharedPurchaseAlertEnabled;
        private Boolean boardAlertEnabled;
    }
}
