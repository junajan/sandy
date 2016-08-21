-- phpMyAdmin SQL Dump
-- version 4.6.0
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Aug 20, 2016 at 07:14 PM
-- Server version: 5.7.11
-- PHP Version: 5.5.36

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sandyintro`
--

-- --------------------------------------------------------

--
-- Table structure for table `api_log`
--

CREATE TABLE `api_log` (
  `id` int(10) UNSIGNED NOT NULL,
  `ticker` varchar(50) NOT NULL,
  `order_id` int(11) NOT NULL,
  `date_add` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` varchar(30) NOT NULL,
  `amount` int(11) NOT NULL,
  `price` decimal(15,4) NOT NULL,
  `price_type` varchar(20) NOT NULL,
  `log` mediumtext
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `config`
--

CREATE TABLE `config` (
  `var` varchar(50) NOT NULL,
  `val` varchar(255) NOT NULL DEFAULT '',
  `note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `config`
--

INSERT INTO `config` (`var`, `val`, `note`) VALUES
('current_capital', '20762.050199999994', NULL),
('exchange_closing', '22:00', NULL),
('exchange_opening', '9:30', NULL),
('fee_order_buy', '1', 'Add fee divided by stock amount to buy price'),
('fee_order_sell', '1', 'Add fee divided by stock amount to sell price'),
('free_pieces', '20', NULL),
('max_capital', '20000', NULL),
('max_pieces', '20', NULL),
('unused_capital', '20762.02000000001', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `equity_history`
--

CREATE TABLE `equity_history` (
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

CREATE TABLE `exchange_schedule` (
  `id` int(10) UNSIGNED NOT NULL,
  `import_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date` date NOT NULL,
  `open` time DEFAULT NULL,
  `close` time DEFAULT NULL,
  `note` varchar(255) NOT NULL DEFAULT '',
  `stock` varchar(11) NOT NULL,
  `invalidated` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `gmr_log`
--

CREATE TABLE `gmr_log` (
  `id` int(10) UNSIGNED NOT NULL,
  `date_add` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `log` varchar(255) NOT NULL DEFAULT '{}'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `import_batch`
--

CREATE TABLE `import_batch` (
  `import_id` int(11) NOT NULL,
  `import_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `trigger` varchar(255) DEFAULT NULL,
  `result` int(11) DEFAULT NULL,
  `rows_imported` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `indicators`
--

CREATE TABLE `indicators` (
  `id` int(10) UNSIGNED NOT NULL,
  `ticker` varchar(45) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sma5` varchar(45) NOT NULL,
  `sma100` decimal(15,2) DEFAULT NULL,
  `sma200` varchar(45) DEFAULT NULL,
  `rsi14` decimal(15,4) NOT NULL,
  `import_id` int(10) UNSIGNED NOT NULL,
  `price` float(15,4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `id` int(10) UNSIGNED NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` varchar(45) DEFAULT NULL,
  `text` varchar(255) DEFAULT NULL,
  `notified` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `positions`
--

CREATE TABLE `positions` (
  `id` int(10) UNSIGNED NOT NULL,
  `ticker` varchar(30) NOT NULL,
  `pieces` smallint(11) UNSIGNED NOT NULL,
  `amount` int(11) NOT NULL,
  `open_price` decimal(15,4) NOT NULL,
  `open_price_without_fee` decimal(10,4) DEFAULT NULL,
  `open_fee` decimal(8,4) NOT NULL DEFAULT '0.0000',
  `open_date` timestamp NULL DEFAULT NULL,
  `close_price` decimal(15,4) DEFAULT NULL,
  `close_price_without_fee` decimal(10,4) DEFAULT NULL,
  `close_fee` decimal(8,4) NOT NULL DEFAULT '0.0000',
  `close_date` timestamp NULL DEFAULT NULL,
  `note` varchar(255) NOT NULL DEFAULT '',
  `buy_import_id` int(10) UNSIGNED DEFAULT NULL,
  `sell_import_id` int(10) UNSIGNED DEFAULT NULL,
  `requested_open_price` decimal(15,4) DEFAULT NULL,
  `requested_open_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `requested_close_price` decimal(15,4) DEFAULT NULL,
  `requested_close_date` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `stock_actual`
--

CREATE TABLE `stock_actual` (
  `id` int(10) UNSIGNED NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `symbol` varchar(15) NOT NULL,
  `price` decimal(15,5) NOT NULL,
  `import_id` int(10) UNSIGNED DEFAULT NULL,
  `origin` varchar(50) NOT NULL,
  `yahoo_price` decimal(15,4) NOT NULL,
  `data` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `stock_history`
--

CREATE TABLE `stock_history` (
  `id` int(10) UNSIGNED NOT NULL,
  `symbol` varchar(45) NOT NULL,
  `date` date NOT NULL,
  `import_id` int(10) UNSIGNED NOT NULL,
  `open` decimal(10,4) NOT NULL,
  `high` decimal(10,4) NOT NULL,
  `low` decimal(10,4) NOT NULL,
  `close` decimal(10,4) NOT NULL,
  `adjClose` decimal(15,4) NOT NULL,
  `volume` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `stock_history_full`
--

CREATE TABLE `stock_history_full` (
  `id` int(10) UNSIGNED NOT NULL,
  `symbol` varchar(45) NOT NULL,
  `date` datetime NOT NULL,
  `import_id` int(10) UNSIGNED NOT NULL,
  `open` decimal(10,4) NOT NULL,
  `high` decimal(10,4) NOT NULL,
  `low` decimal(10,4) NOT NULL,
  `close` decimal(10,4) NOT NULL,
  `adjClose` decimal(15,4) NOT NULL,
  `volume` bigint(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `watchlist`
--

CREATE TABLE `watchlist` (
  `id` int(10) UNSIGNED NOT NULL,
  `ticker` varchar(45) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `note` varchar(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

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
(58, 'LOW', 'Lowe\'s', 1, ''),
(59, 'MA', 'Mastercard Inc', 1, ''),
(60, 'INTC', 'Intel Corporation', 1, ''),
(61, 'MCD', 'McDonald\'s Corp', 1, ''),
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
(77, 'PFE', 'Pfizer Inc', 0, ''),
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
-- Indexes for table `api_log`
--
ALTER TABLE `api_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `date_add` (`date_add`),
  ADD KEY `order_id` (`order_id`);

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
  ADD PRIMARY KEY (`id`),
  ADD KEY `invalidated` (`invalidated`);

--
-- Indexes for table `gmr_log`
--
ALTER TABLE `gmr_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `date_add` (`date_add`);

--
-- Indexes for table `import_batch`
--
ALTER TABLE `import_batch`
  ADD PRIMARY KEY (`import_id`);

--
-- Indexes for table `indicators`
--
ALTER TABLE `indicators`
  ADD PRIMARY KEY (`id`),
  ADD KEY `import_id` (`import_id`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `date` (`date`);

--
-- Indexes for table `positions`
--
ALTER TABLE `positions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `import_id` (`buy_import_id`),
  ADD KEY `sell_import_id` (`sell_import_id`),
  ADD KEY `close_date` (`close_date`);

--
-- Indexes for table `stock_actual`
--
ALTER TABLE `stock_actual`
  ADD PRIMARY KEY (`id`),
  ADD KEY `import_id` (`import_id`);

--
-- Indexes for table `stock_history`
--
ALTER TABLE `stock_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `import_id` (`import_id`);

--
-- Indexes for table `stock_history_full`
--
ALTER TABLE `stock_history_full`
  ADD PRIMARY KEY (`id`),
  ADD KEY `import_id` (`import_id`),
  ADD KEY `symbol` (`symbol`,`date`);

--
-- Indexes for table `watchlist`
--
ALTER TABLE `watchlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ticker` (`ticker`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `api_log`
--
ALTER TABLE `api_log`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `equity_history`
--
ALTER TABLE `equity_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `exchange_schedule`
--
ALTER TABLE `exchange_schedule`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `gmr_log`
--
ALTER TABLE `gmr_log`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `import_batch`
--
ALTER TABLE `import_batch`
  MODIFY `import_id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `indicators`
--
ALTER TABLE `indicators`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `positions`
--
ALTER TABLE `positions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `stock_actual`
--
ALTER TABLE `stock_actual`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `stock_history`
--
ALTER TABLE `stock_history`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `stock_history_full`
--
ALTER TABLE `stock_history_full`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `watchlist`
--
ALTER TABLE `watchlist`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=603;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
