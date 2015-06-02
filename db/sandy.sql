-- phpMyAdmin SQL Dump
-- version 4.3.11
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jun 03, 2015 at 12:09 AM
-- Server version: 5.5.43-0ubuntu0.14.04.1
-- PHP Version: 5.5.9-1ubuntu4.9

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `sandy`
--

-- --------------------------------------------------------

--
-- Table structure for table `config`
--

CREATE TABLE IF NOT EXISTS `config` (
  `var` varchar(50) NOT NULL,
  `val` varchar(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `config`
--

INSERT INTO `config` (`var`, `val`) VALUES
('current_capital', '20000'),
('exchange_closing', '16:00'),
('exchange_opening', '9:30'),
('free_pieces', '20'),
('max_capital', '20000'),
('max_pieces', '20'),
('unused_capital', '20000');

-- --------------------------------------------------------

--
-- Table structure for table `equity_history`
--

CREATE TABLE IF NOT EXISTS `equity_history` (
  `id` int(11) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `import_id` int(11) NOT NULL,
  `capital` decimal(15,4) NOT NULL,
  `unused_capital` decimal(15,4) NOT NULL,
  `free_pieces` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `exchange_schedule`
--

CREATE TABLE IF NOT EXISTS `exchange_schedule` (
  `id` int(10) unsigned NOT NULL,
  `import_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date` date NOT NULL,
  `open` time DEFAULT NULL,
  `close` time DEFAULT NULL,
  `note` varchar(255) NOT NULL DEFAULT '',
  `stock` varchar(11) NOT NULL,
  `invalidated` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8;

--
-- Dumping data for table `exchange_schedule`
--

INSERT INTO `exchange_schedule` (`id`, `import_date`, `date`, `open`, `close`, `note`, `stock`, `invalidated`) VALUES
(1, '2015-05-31 09:47:51', '2015-01-01', NULL, NULL, 'New Years Day (Observed)', 'NASDAQ', '2015-05-31 09:48:24'),
(2, '2015-05-31 09:47:51', '2015-01-19', NULL, NULL, 'Martin Luther King, Jr. Day', 'NASDAQ', '2015-05-31 09:48:24'),
(3, '2015-05-31 09:47:51', '2015-02-16', NULL, NULL, 'President&apos;s Day', 'NASDAQ', '2015-05-31 09:48:24'),
(4, '2015-05-31 09:47:51', '2015-04-03', NULL, NULL, 'Good Friday', 'NASDAQ', '2015-05-31 09:48:24'),
(5, '2015-05-31 09:47:51', '2015-05-25', NULL, NULL, 'Memorial Day', 'NASDAQ', '2015-05-31 09:48:24'),
(6, '2015-05-31 09:47:51', '2015-07-03', NULL, NULL, 'Independence Day', 'NASDAQ', '2015-05-31 09:48:24'),
(7, '2015-05-31 09:47:51', '2015-09-07', NULL, NULL, 'Labor Day', 'NASDAQ', '2015-05-31 09:48:24'),
(8, '2015-05-31 09:47:51', '2015-11-26', NULL, '13:00:00', 'Thanksgiving Day', 'NASDAQ', '2015-05-31 09:48:24'),
(9, '2015-05-31 09:47:51', '2015-11-27', NULL, '13:00:00', 'Early Market Close', 'NASDAQ', '2015-05-31 09:48:24'),
(10, '2015-05-31 09:47:51', '2015-12-24', NULL, NULL, 'Christmas Eve', 'NASDAQ', '2015-05-31 09:48:24'),
(11, '2015-05-31 09:47:51', '2015-12-25', NULL, NULL, 'Christmas Day', 'NASDAQ', '2015-05-31 09:48:24'),
(12, '2015-05-31 09:48:27', '2015-01-01', NULL, NULL, 'New Years Day (Observed)', 'NASDAQ', NULL),
(13, '2015-05-31 09:48:27', '2015-01-19', NULL, NULL, 'Martin Luther King, Jr. Day', 'NASDAQ', NULL),
(14, '2015-05-31 09:48:27', '2015-02-16', NULL, NULL, 'President&apos;s Day', 'NASDAQ', NULL),
(15, '2015-05-31 09:48:27', '2015-04-03', NULL, NULL, 'Good Friday', 'NASDAQ', NULL),
(16, '2015-05-31 09:48:27', '2015-05-25', NULL, NULL, 'Memorial Day', 'NASDAQ', NULL),
(17, '2015-05-31 09:48:27', '2015-07-03', NULL, NULL, 'Independence Day', 'NASDAQ', NULL),
(18, '2015-05-31 09:48:27', '2015-09-07', NULL, NULL, 'Labor Day', 'NASDAQ', NULL),
(19, '2015-05-31 09:48:27', '2015-11-26', NULL, '13:00:00', 'Thanksgiving Day', 'NASDAQ', NULL),
(20, '2015-05-31 09:48:27', '2015-11-27', NULL, '13:00:00', 'Early Market Close', 'NASDAQ', NULL),
(21, '2015-05-31 09:48:27', '2015-12-24', NULL, NULL, 'Christmas Eve', 'NASDAQ', NULL),
(22, '2015-05-31 09:48:27', '2015-12-25', NULL, NULL, 'Christmas Day', 'NASDAQ', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `ib_api`
--

CREATE TABLE IF NOT EXISTS `ib_api` (
  `id` int(10) unsigned NOT NULL,
  `request` varchar(255) DEFAULT NULL,
  `data` varchar(255) DEFAULT '{}',
  `response` varchar(255) DEFAULT NULL,
  `request_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `response_date` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `import_batch`
--

CREATE TABLE IF NOT EXISTS `import_batch` (
  `import_id` int(11) NOT NULL,
  `import_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `trigger` varchar(255) DEFAULT NULL,
  `result` int(11) NOT NULL,
  `rows_imported` int(10) unsigned DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `indicators`
--

CREATE TABLE IF NOT EXISTS `indicators` (
  `id` int(10) unsigned NOT NULL,
  `ticker` varchar(45) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sma5` varchar(45) NOT NULL,
  `sma100` decimal(15,2) DEFAULT NULL,
  `sma200` varchar(45) DEFAULT NULL,
  `rsi14` decimal(15,4) NOT NULL,
  `import_id` int(10) unsigned NOT NULL,
  `price` float(15,4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE IF NOT EXISTS `notification` (
  `id` int(10) unsigned NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` varchar(45) DEFAULT NULL,
  `text` varchar(255) DEFAULT NULL,
  `notified` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `positions`
--

CREATE TABLE IF NOT EXISTS `positions` (
  `id` int(10) unsigned NOT NULL,
  `ticker` varchar(30) NOT NULL,
  `pieces` smallint(11) unsigned NOT NULL,
  `amount` int(11) NOT NULL,
  `open_price` decimal(15,4) NOT NULL,
  `open_date` timestamp NULL DEFAULT NULL,
  `close_price` decimal(15,4) DEFAULT NULL,
  `close_date` timestamp NULL DEFAULT NULL,
  `note` varchar(255) NOT NULL DEFAULT '',
  `buy_import_id` int(10) unsigned NOT NULL,
  `sell_import_id` int(10) unsigned NOT NULL,
  `requested_open_price` decimal(15,4) DEFAULT NULL,
  `requested_open_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `requested_close_price` decimal(15,4) DEFAULT NULL,
  `requested_close_date` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `stock_actual`
--

CREATE TABLE IF NOT EXISTS `stock_actual` (
  `id` int(10) unsigned NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `symbol` varchar(15) NOT NULL,
  `price` decimal(15,5) NOT NULL,
  `import_id` int(10) unsigned NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `stock_history`
--

CREATE TABLE IF NOT EXISTS `stock_history` (
  `id` int(10) unsigned NOT NULL,
  `symbol` varchar(45) NOT NULL,
  `date` date NOT NULL,
  `import_id` int(10) unsigned NOT NULL,
  `open` decimal(10,4) NOT NULL,
  `high` decimal(10,4) NOT NULL,
  `low` decimal(10,4) NOT NULL,
  `close` decimal(10,4) NOT NULL,
  `adjClose` decimal(15,4) NOT NULL,
  `volume` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE IF NOT EXISTS `user` (
  `id` int(10) unsigned NOT NULL,
  `name` varchar(45) NOT NULL,
  `password` varchar(45) NOT NULL,
  `salt` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `watchlist`
--

CREATE TABLE IF NOT EXISTS `watchlist` (
  `id` int(10) unsigned NOT NULL,
  `ticker` varchar(45) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `note` varchar(255) DEFAULT ''
) ENGINE=InnoDB AUTO_INCREMENT=603 DEFAULT CHARSET=utf8;

--
-- Dumping data for table `watchlist`
--

INSERT INTO `watchlist` (`id`, `ticker`, `name`, `active`, `note`) VALUES
(3, 'ABT', 'Abbott Laboratories', 1, ''),
(4, 'ACN', 'Accenture plc', 1, ''),
(5, 'AIG', 'American International Group Inc.', 1, 'Vyradit kvuli spatne performance?'),
(6, 'ALL', 'Allstate Corp.', 1, ''),
(7, 'AMGN', 'Amgen Inc.', 1, ''),
(8, 'AMZN', 'Amazon.com', 1, ''),
(9, 'APA', 'Apache Corp.', 1, ''),
(10, 'APC', 'Anadarko Petroleum Corporation', 1, ''),
(11, 'AXP', 'American Express Inc.', 1, ''),
(12, 'BA', 'Boeing Co.', 1, ''),
(13, 'BAC', 'Bank of America Corp', 1, ''),
(14, 'BAX', 'Baxter International Inc', 1, ''),
(15, 'BIIB', 'Biogen Idec', 1, ''),
(16, 'BK', 'Bank of New York', 1, ''),
(17, 'BMY', 'Bristol-Myers Squibb', 1, ''),
(18, 'BRK-B', 'Berkshire Hathaway', 1, ''),
(19, 'C', 'Citigroup Inc', 1, ''),
(20, 'CAT', 'Caterpillar Inc', 1, ''),
(21, 'CL', 'Colgate-Palmolive Co.', 1, ''),
(22, 'CMCSA', 'Comcast Corporation', 1, ''),
(23, 'COF', 'Capital One Financial Corp.', 1, ''),
(24, 'COP', 'ConocoPhillips', 1, ''),
(25, 'COST', 'Costco', 1, ''),
(26, 'CSCO', 'Cisco Systems', 1, ''),
(27, 'CVS', 'CVS Caremark', 1, ''),
(28, 'CVX', 'Chevron', 1, ''),
(29, 'DD', 'DuPont', 1, ''),
(30, 'DIS', 'The Walt Disney Company', 1, ''),
(31, 'DOW', 'Dow Chemical', 1, ''),
(32, 'DVN', 'Devon Energy', 1, ''),
(33, 'EBAY', 'eBay Inc.', 1, ''),
(34, 'EMC', 'EMC Corporation', 1, ''),
(35, 'EMR', 'Emerson Electric Co.', 1, ''),
(36, 'EXC', 'Exelon', 1, ''),
(37, 'F', 'Ford Motor', 1, ''),
(38, 'FB', 'Facebook', 1, ''),
(39, 'FCX', 'Freeport-McMoran', 1, ''),
(40, 'FDX', 'FedEx', 1, ''),
(41, 'FOXA', 'Twenty-First Century Fox, Inc', 1, ''),
(42, 'GD', 'General Dynamics', 1, ''),
(43, 'GE', 'General Electric Co.', 1, ''),
(44, 'GILD', 'Gilead Sciences', 1, ''),
(45, 'GM', 'General Motors', 1, ''),
(46, 'GOOG', 'Google Inc.', 1, ''),
(47, 'GS', 'Goldman Sachs', 1, ''),
(48, 'HAL', 'Halliburton', 1, ''),
(49, 'HD', 'Home Depot', 1, ''),
(50, 'HON', 'Honeywell', 1, ''),
(51, 'HPQ', 'Hewlett Packard Co', 1, ''),
(52, 'IBM', 'International Business Machines', 1, ''),
(53, 'JNJ', 'Johnson & Johnson Inc', 1, ''),
(54, 'JPM', 'JP Morgan Chase & Co', 1, ''),
(55, 'KO', 'The Coca-Cola Company', 1, ''),
(56, 'LLY', 'Eli Lilly and Company', 1, ''),
(57, 'LMT', 'Lockheed-Martin', 1, ''),
(58, 'LOW', 'Lowe''s', 1, ''),
(59, 'MA', 'Mastercard Inc', 1, ''),
(60, 'INTC', 'Intel Corporation', 1, ''),
(61, 'MCD', 'McDonald''s Corp', 1, ''),
(62, 'MDLZ', 'Mondelēz International', 1, ''),
(63, 'MDT', 'Medtronic Inc.', 1, ''),
(64, 'MET', 'Metlife Inc.', 1, ''),
(65, 'MMM', '3M Company', 1, ''),
(66, 'MO', 'Altria Group', 1, ''),
(67, 'MON', 'Monsanto', 1, ''),
(68, 'MRK', 'Merck & Co.', 1, ''),
(69, 'MS', 'Morgan Stanley', 1, ''),
(70, 'MSFT', 'Microsoft', 1, ''),
(71, 'NKE', 'Nike', 1, ''),
(72, 'NOV', 'National Oilwell Varco', 1, ''),
(73, 'NSC', 'Norfolk Southern Corp', 1, ''),
(74, 'ORCL', 'Oracle Corporation', 1, ''),
(75, 'OXY', 'Occidental Petroleum Corp.', 1, ''),
(76, 'PEP', 'Pepsico Inc.', 1, ''),
(77, 'PFE', 'Pfizer Inc', 1, ''),
(78, 'PG', 'Procter & Gamble Co', 1, ''),
(79, 'PM', 'Phillip Morris International', 1, ''),
(80, 'QCOM', 'Qualcomm Inc.', 1, ''),
(81, 'RTN', 'Raytheon Co (NEW)', 1, ''),
(82, 'SBUX', 'Starbucks Corporation', 1, ''),
(83, 'SLB', 'Schlumberger', 1, ''),
(84, 'SO', 'Southern Company', 1, ''),
(85, 'SPG', 'Simon Property Group, Inc.', 1, ''),
(86, 'T', 'AT&T Inc', 1, ''),
(87, 'TGT', 'Target Corp.', 1, ''),
(88, 'TWX', 'Time Warner Inc.', 1, ''),
(89, 'TXN', 'Texas Instruments', 1, ''),
(90, 'UNH', 'UnitedHealth Group Inc.', 1, ''),
(91, 'UNP', 'Union Pacific Corp.', 1, ''),
(92, 'UPS', 'United Parcel Service Inc', 1, ''),
(93, 'USB', 'US Bancorp', 1, ''),
(94, 'UTX', 'United Technologies Corp', 1, ''),
(95, 'V', 'Visa Inc.', 1, ''),
(96, 'VZ', 'Verizon Communications Inc', 1, ''),
(97, 'WFC', 'Wells Fargo', 1, ''),
(98, 'WMT', 'Wal-Mart', 1, ''),
(99, 'XOM', 'Exxon Mobil Corp', 1, ''),
(100, 'WBA', 'Walgreens Boots Alliance', 1, ''),
(601, 'AAPL', 'Apple Inc.', 1, ''),
(602, 'ABBV', 'AbbVie Inc.', 1, '');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `config`
--
ALTER TABLE `config`
  ADD PRIMARY KEY (`var`);

--
-- Indexes for table `equity_history`
--
ALTER TABLE `equity_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `exchange_schedule`
--
ALTER TABLE `exchange_schedule`
  ADD PRIMARY KEY (`id`), ADD KEY `invalidated` (`invalidated`);

--
-- Indexes for table `ib_api`
--
ALTER TABLE `ib_api`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `import_batch`
--
ALTER TABLE `import_batch`
  ADD PRIMARY KEY (`import_id`);

--
-- Indexes for table `indicators`
--
ALTER TABLE `indicators`
  ADD PRIMARY KEY (`id`), ADD KEY `import_id` (`import_id`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`id`), ADD KEY `date` (`date`);

--
-- Indexes for table `positions`
--
ALTER TABLE `positions`
  ADD PRIMARY KEY (`id`), ADD KEY `import_id` (`buy_import_id`), ADD KEY `sell_import_id` (`sell_import_id`);

--
-- Indexes for table `stock_actual`
--
ALTER TABLE `stock_actual`
  ADD PRIMARY KEY (`id`), ADD KEY `import_id` (`import_id`);

--
-- Indexes for table `stock_history`
--
ALTER TABLE `stock_history`
  ADD PRIMARY KEY (`id`), ADD KEY `import_id` (`import_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `watchlist`
--
ALTER TABLE `watchlist`
  ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `ticker` (`ticker`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `equity_history`
--
ALTER TABLE `equity_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `exchange_schedule`
--
ALTER TABLE `exchange_schedule`
  MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=23;
--
-- AUTO_INCREMENT for table `ib_api`
--
ALTER TABLE `ib_api`
  MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `import_batch`
--
ALTER TABLE `import_batch`
  MODIFY `import_id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `indicators`
--
ALTER TABLE `indicators`
  MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `positions`
--
ALTER TABLE `positions`
  MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `stock_actual`
--
ALTER TABLE `stock_actual`
  MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `stock_history`
--
ALTER TABLE `stock_history`
  MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `watchlist`
--
ALTER TABLE `watchlist`
  MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=603;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
