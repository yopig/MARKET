# ---------------------------------------------------------------------------------
CREATE TABLE `auth`
(
    `auth_name` varchar(255) NOT NULL,
    `member_id` bigint(20)   NOT NULL,
    PRIMARY KEY (`member_id`, `auth_name`),
    CONSTRAINT `FK_auth_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `board`
(
    `id`          int(11)    NOT NULL AUTO_INCREMENT,
    `title`       varchar(255)        DEFAULT NULL,
    `content`     varchar(255)        DEFAULT NULL,
    `is_private`  tinyint(1) NOT NULL DEFAULT 0,
    `inserted_at` datetime   NOT NULL DEFAULT current_timestamp(),
    `author`      bigint(20) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `FK_board_author_member_id` (`author`),
    CONSTRAINT `FK_board_author_member_id` FOREIGN KEY (`author`) REFERENCES `member` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB
  AUTO_INCREMENT = 22
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `board_file`
(
    `board_id` int(11)      NOT NULL,
    `name`     varchar(300) NOT NULL,
    PRIMARY KEY (`board_id`, `name`),
    CONSTRAINT `board_file_ibfk_1` FOREIGN KEY (`board_id`) REFERENCES `board` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `board_like`
(
    `board_id`  int(11)    NOT NULL,
    `member_id` bigint(20) NOT NULL,
    PRIMARY KEY (`board_id`, `member_id`),
    KEY `member_id` (`member_id`),
    CONSTRAINT `board_like_ibfk_1` FOREIGN KEY (`board_id`) REFERENCES `board` (`id`) ON DELETE CASCADE,
    CONSTRAINT `board_like_ibfk_2` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `comment`
(
    `id`          int(11)    NOT NULL AUTO_INCREMENT,
    `board_id`    int(11)    NOT NULL,
    `comment`     varchar(255)        DEFAULT NULL,
    `inserted_at` datetime   NOT NULL DEFAULT current_timestamp(),
    `author`      bigint(20) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `board_id` (`board_id`),
    KEY `FK_comment_author_member_id` (`author`),
    CONSTRAINT `FK_comment_author_member_id` FOREIGN KEY (`author`) REFERENCES `member` (`id`) ON DELETE CASCADE,
    CONSTRAINT `comment_ibfk_1` FOREIGN KEY (`board_id`) REFERENCES `board` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB
  AUTO_INCREMENT = 22
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `member`
(
    `id`          bigint(20)   NOT NULL AUTO_INCREMENT,
    `email`       varchar(255) NOT NULL,
    `password`    varchar(255)          DEFAULT NULL,
    `nick_name`   varchar(255) NOT NULL,
    `info`        varchar(255)          DEFAULT NULL,
    `inserted_at` datetime     NOT NULL DEFAULT current_timestamp(),
    `provider`    varchar(255)          DEFAULT NULL,
    `provider_id` varchar(255)          DEFAULT NULL,
    `role`        varchar(50)  NOT NULL DEFAULT 'USER',
    PRIMARY KEY (`id`),
    UNIQUE KEY `nick_name` (`nick_name`),
    UNIQUE KEY `UQ_member_email` (`email`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 17
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `member_file`
(
    `member_id` bigint(20)   NOT NULL,
    `name`      varchar(300) NOT NULL,
    PRIMARY KEY (`member_id`, `name`),
    CONSTRAINT `member_file_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `notice`
(
    `id`          int(11)        NOT NULL AUTO_INCREMENT,
    `title`       varchar(300)   NOT NULL,
    `content`     varchar(10000) NOT NULL,
    `author`      varchar(255)   NOT NULL,
    `is_private`  tinyint(1)     NOT NULL DEFAULT 0,
    `inserted_at` datetime       NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `author` (`author`),
    CONSTRAINT `notice_ibfk_1` FOREIGN KEY (`author`) REFERENCES `member` (`email`) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `notice_file`
(
    `notice_id` int(11)      NOT NULL,
    `name`      varchar(300) NOT NULL,
    PRIMARY KEY (`notice_id`, `name`),
    CONSTRAINT `notice_file_ibfk_1` FOREIGN KEY (`notice_id`) REFERENCES `notice` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `pet_facility`
(
    `name`                      varchar(255) DEFAULT NULL,
    `category1`                 varchar(255) DEFAULT NULL,
    `category2`                 varchar(255) DEFAULT NULL,
    `category3`                 varchar(255) DEFAULT NULL,
    `sido_name`                 varchar(255) DEFAULT NULL,
    `sigungu_name`              varchar(255) DEFAULT NULL,
    `legal_eup_myeon_dong_name` varchar(255) DEFAULT NULL,
    `ri_name`                   varchar(255) DEFAULT NULL,
    `bunji`                     varchar(255) DEFAULT NULL,
    `road_name`                 varchar(255) DEFAULT NULL,
    `building_number`           varchar(255) DEFAULT NULL,
    `latitude`                  double       DEFAULT NULL,
    `longitude`                 double       DEFAULT NULL,
    `postal_code`               varchar(255) DEFAULT NULL,
    `road_address`              varchar(255) DEFAULT NULL,
    `jibun_address`             varchar(255) DEFAULT NULL,
    `phone_number`              varchar(255) DEFAULT NULL,
    `homepage`                  varchar(255) DEFAULT NULL,
    `holiday`                   varchar(255) DEFAULT NULL,
    `operating_hours`           varchar(255) DEFAULT NULL,
    `parking_available`         varchar(255) DEFAULT NULL,
    `admission_fee_info`        varchar(255) DEFAULT NULL,
    `pet_friendly_info`         varchar(255) DEFAULT NULL,
    `pet_only_info`             varchar(255) DEFAULT NULL,
    `allowed_pet_size`          varchar(255) DEFAULT NULL,
    `pet_restrictions`          varchar(255) DEFAULT NULL,
    `indoor_facility`           varchar(255) DEFAULT NULL,
    `outdoor_facility`          varchar(255) DEFAULT NULL,
    `description`               varchar(255) DEFAULT NULL,
    `additional_pet_fee`        varchar(255) DEFAULT NULL,
    `final_creation_date`       varchar(255) DEFAULT NULL,
    `id`                        bigint(20) NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 28306
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `reply_comment`
(
    `id`            int(11)       NOT NULL AUTO_INCREMENT,
    `comment_id`    int(11)       NOT NULL,
    `author`        varchar(255)  NOT NULL,
    `reply_comment` varchar(2000) NOT NULL,
    `inserted_at`   datetime      NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `comment_id` (`comment_id`),
    KEY `author` (`author`),
    CONSTRAINT `reply_comment_ibfk_1` FOREIGN KEY (`comment_id`) REFERENCES `comment` (`id`) ON DELETE CASCADE,
    CONSTRAINT `reply_comment_ibfk_2` FOREIGN KEY (`author`) REFERENCES `member` (`email`) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `review`
(
    `id`            int(11)       NOT NULL AUTO_INCREMENT,
    `facility_name` varchar(255)  NOT NULL,
    `member_email`  varchar(255)  NOT NULL,
    `review`        varchar(2000) NOT NULL,
    `rating`        int(11)       NOT NULL,
    `inserted_at`   datetime      NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `member_email` (`member_email`),
    CONSTRAINT `review_ibfk_1` FOREIGN KEY (`member_email`) REFERENCES `member` (`email`) ON DELETE CASCADE
) ENGINE = InnoDB
  AUTO_INCREMENT = 37
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `review_file`
(
    `review_id` int(11)      NOT NULL,
    `name`      varchar(300) NOT NULL,
    PRIMARY KEY (`review_id`, `name`),
    CONSTRAINT `review_file_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `review` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `review_like`
(
    `review_id` int(11)    NOT NULL,
    `member_id` bigint(20) NOT NULL,
    PRIMARY KEY (`review_id`, `member_id`),
    KEY `member_id` (`member_id`),
    CONSTRAINT `review_like_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `review` (`id`) ON DELETE CASCADE,
    CONSTRAINT `review_like_ibfk_2` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `support`
(
    `id`          bigint(20)     NOT NULL AUTO_INCREMENT,
    `email`       varchar(255)   NOT NULL,
    `title`       varchar(300)   NOT NULL,
    `content`     varchar(10000) NOT NULL,
    `inserted_at` datetime       NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 2
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE favorite
(
    member_id   BIGINT(20) NOT NULL,
    facility_id BIGINT(20) NOT NULL,
    PRIMARY KEY (member_id, facility_id),
    FOREIGN KEY (member_id) REFERENCES member (id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES pet_facility (id) ON DELETE CASCADE
);
# ---------------------------------------------------------------------------------
SELECT DISTINCT category2
FROM pet_facility;

SELECT DISTINCT pet_facility.allowed_pet_size
FROM pet_facility;
# ---------------------------------------------------------------------------------
# ---------------------------------------------------------------------------------