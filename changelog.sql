ALTER TABLE `config` ADD `note` VARCHAR(255) NULL DEFAULT NULL AFTER `val`;

ALTER TABLE `positions` ADD `open_price_without_fee` DECIMAL(10,4) NULL DEFAULT NULL AFTER `open_price`, ADD `open_fee` DECIMAL(8,4) NOT NULL DEFAULT '0' AFTER `open_price_without_fee`;

ALTER TABLE `positions` ADD `close_price_without_fee` DECIMAL(10,4) NULL DEFAULT NULL AFTER `close_price`, ADD `close_fee` DECIMAL(8,4) NOT NULL DEFAULT '0' AFTER `close_price_without_fee`;

