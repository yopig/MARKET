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
    `kakao_id`    bigint(20)            DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `nick_name` (`nick_name`),
    UNIQUE KEY `UQ_member_email` (`email`),
    UNIQUE KEY `UKtqi1nx9ul3nx7guxpqycuvgue` (`kakao_id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 32
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
    `facility_name` varchar(255)           DEFAULT NULL,
    `member_email`  varchar(255)  NOT NULL,
    `review`        varchar(2000) NOT NULL,
    `rating`        int(11)       NOT NULL,
    `inserted_at`   datetime      NOT NULL DEFAULT current_timestamp(),
    `facility_id`   bigint(20)    NOT NULL,
    PRIMARY KEY (`id`),
    KEY `FKg5515o0nnntje78uxpmiaq084` (`facility_id`),
    KEY `idx_member_date` (`member_email`, `inserted_at`),
    CONSTRAINT `FKg5515o0nnntje78uxpmiaq084` FOREIGN KEY (`facility_id`) REFERENCES `pet_facility` (`id`),
    CONSTRAINT `review_ibfk_1` FOREIGN KEY (`member_email`) REFERENCES `member` (`email`) ON DELETE CASCADE
) ENGINE = InnoDB
  AUTO_INCREMENT = 144
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
CREATE TABLE `review_report`
(
    `id`             bigint(20)    NOT NULL AUTO_INCREMENT,
    `review_id`      int(11)       NOT NULL,
    `reporter_email` varchar(255)  NOT NULL,
    `reason`         varchar(1000) NOT NULL,
    `reported_at`    datetime      NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `review_id` (`review_id`),
    CONSTRAINT `review_report_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `review` (`id`) ON DELETE CASCADE
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
CREATE TABLE `favorite`
(
    `member_id`   bigint(20) NOT NULL,
    `facility_id` bigint(20) NOT NULL,
    PRIMARY KEY (`member_id`, `facility_id`),
    KEY `facility_id` (`facility_id`),
    CONSTRAINT `favorite_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`) ON DELETE CASCADE,
    CONSTRAINT `favorite_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `pet_facility` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `tags`
(
    `id`   int(11)     NOT NULL AUTO_INCREMENT,
    `name` varchar(50) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_tag_name` (`name`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 32
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
CREATE TABLE `review_tags`
(
    `review_id` INT(11) NOT NULL,
    `tag_id`    INT(11) NOT NULL,
    PRIMARY KEY (`review_id`, `tag_id`),
    KEY `fk_review_tags_tag_id` (`tag_id`),
    CONSTRAINT `fk_review_tags_review_id` FOREIGN KEY (`review_id`) REFERENCES `review` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_review_tags_tag_id` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
# ---------------------------------------------------------------------------------
# ---------------------------------------------------------------------------------
# ---------------------------------------------------------------------------------
SELECT DISTINCT category2
FROM pet_facility;

SELECT DISTINCT pet_facility.allowed_pet_size
FROM pet_facility;

SHOW CREATE TABLE member;
SHOW CREATE TABLE review;
SHOW CREATE TABLE review_file;
SHOW CREATE TABLE review_like;
SHOW CREATE TABLE review_report;
SHOW CREATE TABLE favorite;
SHOW CREATE TABLE tags;

SELECT DISTINCT allowed_pet_size
FROM pet_facility
WHERE allowed_pet_size LIKE '%주말%'
   OR allowed_pet_size LIKE '%kg%'
   OR allowed_pet_size LIKE '%공휴일%';

-- 캘린더 추가합니다.
ALTER TABLE `review`
    ADD INDEX `idx_member_date` (`member_email`, `inserted_at`);
# ---------------------------------------------------------------------------------
# UPDATE review r
#     JOIN pet_facility pf ON TRIM(r.facility_name) = TRIM(pf.name)
# SET r.facility_id = pf.id;

# 이건 너무 극단적인 마지막 수단.
# ALTER TABLE review
#     DROP COLUMN facility_name;

# 사용을 안하게 해버리기.
# ALTER TABLE review
#     MODIFY COLUMN facility_name VARCHAR(255) NULL;
# ---------------------------------------------------------------------------------
# ---------------------------------------------------------------------------------

TRUNCATE TABLE support;

DELETE
FROM prj04.board
WHERE id = 17;

CREATE TABLE payment (
                         id           BIGINT AUTO_INCREMENT PRIMARY KEY,
                         order_id     VARCHAR(100)  NOT NULL,
                         payment_key  VARCHAR(100)  NOT NULL,
                         amount       INT           NOT NULL,
                         status       VARCHAR(20)   NOT NULL,
                         method       VARCHAR(30)   NOT NULL,
                         board_id     INT           NOT NULL,
                         receipt_url  VARCHAR(500)  NULL,
                         raw_json     LONGTEXT      NULL,

    -- 고유/조회 인덱스
                         UNIQUE KEY uk_payment_order_id (order_id),
                         KEY idx_payment_payment_key (payment_key),
                         KEY idx_payment_board_id (board_id),

    -- (선택) board 테이블과 FK 연결
                         CONSTRAINT fk_payment_board
                             FOREIGN KEY (board_id) REFERENCES board(id)
                                 ON UPDATE RESTRICT
                                 ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


ALTER TABLE `member`
    ADD COLUMN `email_verified`    TINYINT(1)  NOT NULL DEFAULT 0 AFTER `role`,
    ADD COLUMN `status`            VARCHAR(20) NOT NULL DEFAULT 'UNVERIFIED' AFTER `email_verified`,
    ADD COLUMN `email_verified_at` DATETIME     NULL AFTER `status`;

CREATE TABLE IF NOT EXISTS `email_verification_token` (
                                                          `id`           BIGINT      NOT NULL AUTO_INCREMENT,
                                                          `member_id`    BIGINT      NOT NULL,
                                                          `token_hash`   CHAR(64)    NOT NULL,     /* SHA-256 hex */
                                                          `purpose`      VARCHAR(20) NOT NULL,     /* 'SIGNUP' 등 */
                                                          `expires_at`   DATETIME    NOT NULL,
                                                          `used_at`      DATETIME    NULL,
                                                          `created_at`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                                          `created_ip`   VARCHAR(64)  NULL,
                                                          `created_agent`VARCHAR(255) NULL,
                                                          PRIMARY KEY (`id`),
                                                          KEY `idx_evt_token_hash` (`token_hash`),
                                                          KEY `idx_evt_member_purpose` (`member_id`, `purpose`),
                                                          CONSTRAINT `fk_evt_member`
                                                              FOREIGN KEY (`member_id`) REFERENCES `member` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE payment DROP FOREIGN KEY fk_payment_board;

-- 2) CASCADE로 재생성
ALTER TABLE payment
    ADD CONSTRAINT fk_payment_board
        FOREIGN KEY (board_id) REFERENCES board(id)
            ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS reviews (
                                      id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                                      board_id        INT            NOT NULL,    -- 대상 거래글
                                      reviewer_id     BIGINT         NOT NULL,    -- 리뷰 작성한 사람(회원)
                                      reviewee_id     BIGINT         NOT NULL,    -- 리뷰 대상(회원, 보통 판매자/구매자)

                                      rating          TINYINT UNSIGNED NOT NULL,  -- 1~5 범위 (백엔드 수동 검증)
                                      content         TEXT            NULL,       -- 코멘트(선택)

    -- 첨부 이미지가 필요하면 JSON 문자열로 저장 (프런트에서 배열 형태로 전달)
    -- MariaDB의 JSON 타입 호환을 위해 LONGTEXT + 주석 권장
                                      images_json     LONGTEXT        NULL COMMENT 'JSON array of image URLs or keys',

    -- 스냅샷 필드(선택): 탈퇴/닉변 대비하여 당시 별명 저장 (UI 표시용)
                                      reviewer_nick   VARCHAR(50)     NULL,
                                      reviewee_nick   VARCHAR(50)     NULL,

                                      is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
                                      deleted_at      DATETIME        NULL,

                                      inserted_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                      updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- FK
                                      CONSTRAINT fk_review_board
                                          FOREIGN KEY (board_id) REFERENCES board(id)
                                              ON DELETE CASCADE,               -- 거래글 삭제 시 해당 리뷰도 함께 삭제(정책에 맞춰 조정 가능)

                                      CONSTRAINT fk_review_reviewer
                                          FOREIGN KEY (reviewer_id) REFERENCES member(id)
                                              ON DELETE RESTRICT ON UPDATE RESTRICT,

                                      CONSTRAINT fk_review_reviewee
                                          FOREIGN KEY (reviewee_id) REFERENCES member(id)
                                              ON DELETE RESTRICT ON UPDATE RESTRICT,

    -- 동일 거래글에서 같은 사람이 같은 상대에게 중복 리뷰 금지
                                      UNIQUE KEY uk_review_once (board_id, reviewer_id, reviewee_id),

    -- 조회용 인덱스(프로필/목록 최적화)
                                      KEY idx_review_reviewee (reviewee_id, inserted_at),
                                      KEY idx_review_reviewer (reviewer_id, inserted_at),
                                      KEY idx_review_board    (board_id, inserted_at)
)
    ENGINE=InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE = utf8mb4_unicode_ci;

-- board_report 테이블 (신고)
CREATE TABLE board_report (
                              id            BIGINT AUTO_INCREMENT PRIMARY KEY,
                              board_id      INT            NOT NULL,
                              reporter_id   BIGINT         NOT NULL,
                              reason        VARCHAR(50)    NOT NULL,      -- 사유 코드(문자열)
                              detail        TEXT           NULL,          -- 상세설명(선택)
                              status        VARCHAR(20)    NOT NULL DEFAULT 'OPEN',  -- 상태(OPEN/REVIEWED/REJECTED/etc) 문자열로 관리
                              admin_memo    TEXT           NULL,          -- 관리자 메모
                              inserted_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
                              updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                              CONSTRAINT uq_board_report_unique UNIQUE (board_id, reporter_id), -- 같은 유저가 같은 글 중복신고 방지

                              INDEX idx_board_report_board (board_id),
                              INDEX idx_board_report_reporter (reporter_id),
                              INDEX idx_board_report_status (status),

                              CONSTRAINT fk_board_report_board
                                  FOREIGN KEY (board_id) REFERENCES board(id)
                                      ON DELETE CASCADE ON UPDATE RESTRICT,

                              CONSTRAINT fk_board_report_member
                                  FOREIGN KEY (reporter_id) REFERENCES member(id)
                                      ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
