package com.nangjanggo.yangsim.user;

import lombok.Getter;

public class UserRequestDto {

    @Getter
    public static class Register {
        private String email;
        private String password;
        private String name;
    }

    @Getter
    public static class Login {
        private String email;
        private String password;
    }

    @Getter
    public static class ForgotPassword {
        private String email;
    }

    @Getter
    public static class UpdateProfile {
        private String name;
        private String email;
    }

    @Getter
    public static class UpdatePassword {
        private String currentPassword;
        private String newPassword;
    }

    @Getter
    public static class VerifyCode {
        private String email;
        private String code;
    }

    @Getter
    public static class ResetPassword {
        private String email;
        private String newPassword;
    }

}
