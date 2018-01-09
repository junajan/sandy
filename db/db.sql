-- phpMyAdmin SQL Dump
-- version 4.6.0
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Dec 23, 2017 at 05:08 PM
-- Server version: 5.7.11
-- PHP Version: 7.1.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sandy`
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
('current_capital', '20000', NULL),
('exchange_closing', '22:00', NULL),
('exchange_opening', '9:30', NULL),
('fee_order_buy', '0', 'Add fee divided by stock amount to buy price'),
('fee_order_sell', '0', 'Add fee divided by stock amount to sell price'),
('free_pieces', '16', NULL),
('max_capital', '20000', NULL),
('max_pieces', '20', NULL),
('unused_capital', '16277.910000000002', NULL);

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

--
-- Dumping data for table `exchange_schedule`
--

INSERT INTO `exchange_schedule` (`id`, `import_date`, `date`, `open`, `close`, `note`, `stock`, `invalidated`) VALUES
(274, '2016-05-30 16:49:53', '2016-01-01', NULL, NULL, 'New Years Day (Observed)', 'NASDAQ', '2016-12-21 18:39:49'),
(275, '2016-05-30 16:49:53', '2016-01-18', NULL, NULL, 'Martin Luther King, Jr. Day', 'NASDAQ', '2016-12-21 18:39:49'),
(276, '2016-05-30 16:49:53', '2016-02-15', NULL, NULL, 'President&apos;s Day', 'NASDAQ', '2016-12-21 18:39:49'),
(277, '2016-05-30 16:49:53', '2016-03-25', NULL, NULL, 'Good Friday', 'NASDAQ', '2016-12-21 18:39:49'),
(278, '2016-05-30 16:49:53', '2016-05-30', NULL, NULL, 'Memorial Day', 'NASDAQ', '2016-12-21 18:39:49'),
(279, '2016-05-30 16:49:53', '2016-07-04', NULL, NULL, 'Independence Day (Observed)', 'NASDAQ', '2016-12-21 18:39:49'),
(280, '2016-05-30 16:49:53', '2016-09-05', NULL, NULL, 'Labor Day', 'NASDAQ', '2016-12-21 18:39:49'),
(281, '2016-05-30 16:49:53', '2016-11-24', NULL, NULL, 'Thanksgiving Day', 'NASDAQ', '2016-12-21 18:39:49'),
(282, '2016-05-30 16:49:53', '2016-11-25', NULL, '13:00:00', 'Early Market Close', 'NASDAQ', '2016-12-21 18:39:49'),
(283, '2016-05-30 16:49:53', '2016-12-26', NULL, NULL, 'Christmas Day (Observed)', 'NASDAQ', '2016-12-21 18:39:49'),
(284, '2016-06-13 16:36:26', '2016-01-01', NULL, NULL, 'New Years Day (Observed)', 'NASDAQ', '2016-12-21 18:39:49'),
(285, '2016-06-13 16:36:26', '2016-01-18', NULL, NULL, 'Martin Luther King, Jr. Day', 'NASDAQ', '2016-12-21 18:39:49'),
(286, '2016-06-13 16:36:26', '2016-02-15', NULL, NULL, 'President&apos;s Day', 'NASDAQ', '2016-12-21 18:39:49'),
(287, '2016-06-13 16:36:26', '2016-03-25', NULL, NULL, 'Good Friday', 'NASDAQ', '2016-12-21 18:39:49'),
(288, '2016-06-13 16:36:26', '2016-05-30', NULL, NULL, 'Memorial Day', 'NASDAQ', '2016-12-21 18:39:49'),
(289, '2016-06-13 16:36:26', '2016-07-04', NULL, NULL, 'Independence Day (Observed)', 'NASDAQ', '2016-12-21 18:39:49'),
(290, '2016-06-13 16:36:26', '2016-09-05', NULL, NULL, 'Labor Day', 'NASDAQ', '2016-12-21 18:39:49'),
(291, '2016-06-13 16:36:26', '2016-11-24', NULL, NULL, 'Thanksgiving Day', 'NASDAQ', '2016-12-21 18:39:49'),
(292, '2016-06-13 16:36:26', '2016-11-25', NULL, '13:00:00', 'Early Market Close', 'NASDAQ', '2016-12-21 18:39:49'),
(293, '2016-06-13 16:36:26', '2016-12-26', NULL, NULL, 'Christmas Day (Observed)', 'NASDAQ', '2016-12-21 18:39:49'),
(294, '2016-08-11 17:35:29', '2016-01-01', NULL, NULL, 'New Years Day (Observed)', 'NASDAQ', '2016-12-21 18:39:49'),
(295, '2016-08-11 17:35:29', '2016-01-18', NULL, NULL, 'Martin Luther King, Jr. Day', 'NASDAQ', '2016-12-21 18:39:49'),
(296, '2016-08-11 17:35:29', '2016-02-15', NULL, NULL, 'President&apos;s Day', 'NASDAQ', '2016-12-21 18:39:49'),
(297, '2016-08-11 17:35:29', '2016-03-25', NULL, NULL, 'Good Friday', 'NASDAQ', '2016-12-21 18:39:49'),
(298, '2016-08-11 17:35:29', '2016-05-30', NULL, NULL, 'Memorial Day', 'NASDAQ', '2016-12-21 18:39:49'),
(299, '2016-08-11 17:35:29', '2016-07-04', NULL, NULL, 'Independence Day (Observed)', 'NASDAQ', '2016-12-21 18:39:49'),
(300, '2016-08-11 17:35:29', '2016-09-05', NULL, NULL, 'Labor Day', 'NASDAQ', '2016-12-21 18:39:49'),
(301, '2016-08-11 17:35:29', '2016-11-24', NULL, NULL, 'Thanksgiving Day', 'NASDAQ', '2016-12-21 18:39:49'),
(302, '2016-08-11 17:35:29', '2016-11-25', NULL, '13:00:00', 'Early Market Close', 'NASDAQ', '2016-12-21 18:39:49'),
(303, '2016-08-11 17:35:29', '2016-12-26', NULL, NULL, 'Christmas Day (Observed)', 'NASDAQ', '2016-12-21 18:39:49'),
(304, '2016-12-21 18:39:52', '2016-01-01', NULL, NULL, 'New Years Day (Observed)', 'NASDAQ', NULL),
(305, '2016-12-21 18:39:52', '2016-01-18', NULL, NULL, 'Martin Luther King, Jr. Day', 'NASDAQ', NULL),
(306, '2016-12-21 18:39:52', '2016-02-15', NULL, NULL, 'President&apos;s Day', 'NASDAQ', NULL),
(307, '2016-12-21 18:39:52', '2016-03-25', NULL, NULL, 'Good Friday', 'NASDAQ', NULL),
(308, '2016-12-21 18:39:52', '2016-05-30', NULL, NULL, 'Memorial Day', 'NASDAQ', NULL),
(309, '2016-12-21 18:39:52', '2016-07-04', NULL, NULL, 'Independence Day (Observed)', 'NASDAQ', NULL),
(310, '2016-12-21 18:39:52', '2016-09-05', NULL, NULL, 'Labor Day', 'NASDAQ', NULL),
(311, '2016-12-21 18:39:52', '2016-11-24', NULL, NULL, 'Thanksgiving Day', 'NASDAQ', NULL),
(312, '2016-12-21 18:39:52', '2016-11-25', NULL, '13:00:00', 'Early Market Close', 'NASDAQ', NULL),
(313, '2016-12-21 18:39:52', '2016-12-26', NULL, NULL, 'Christmas Day (Observed)', 'NASDAQ', NULL);

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
-- Table structure for table `transfers`
--

CREATE TABLE `transfers` (
  `id` int(10) UNSIGNED NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `amount` decimal(15,2) NOT NULL
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
  `note` varchar(255) DEFAULT '',
  `exchange` varchar(30) DEFAULT NULL,
  `sector` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `watchlist`
--

INSERT INTO `watchlist` (`id`, `ticker`, `name`, `active`, `note`, `exchange`, `sector`) VALUES
(3, 'ABT', 'Abbott Laboratories', 1, '', 'NYSE', 'Health Care'),
(4, 'ACN', 'Accenture plc', 1, '', 'NYSE', 'Information Technology'),
(5, 'AIG', 'American International Group Inc.', 1, 'Vyradit kvuli spatne performance?', 'NYSE', 'Financials'),
(6, 'ALL', 'Allstate Corp.', 1, '', 'NYSE', 'Financials'),
(7, 'AMGN', 'Amgen Inc.', 1, '', 'NASDAQ', 'Health Care'),
(8, 'AMZN', 'Amazon.com', 1, '', 'NASDAQ', 'Consumer Discretionary'),
(11, 'AXP', 'American Express Inc.', 1, '', 'NYSE', 'Financials'),
(12, 'BA', 'Boeing Co.', 1, '', 'NYSE', 'Industrials'),
(13, 'BAC', 'Bank of America Corp', 1, '', 'NYSE', 'Financials'),
(15, 'BIIB', 'Biogen Idec', 1, '', 'NASDAQ', 'Health Care'),
(16, 'BK', 'Bank of New York', 1, '', 'NYSE', 'Financials'),
(17, 'BMY', 'Bristol-Myers Squibb', 1, '', 'NYSE', 'Health Care'),
(18, 'BRK-B', 'Berkshire Hathaway', 1, '', NULL, NULL),
(19, 'C', 'Citigroup Inc', 1, '', 'NYSE', 'Financials'),
(20, 'CAT', 'Caterpillar Inc', 1, '', 'NYSE', 'Industrials'),
(21, 'CL', 'Colgate-Palmolive Co.', 1, '', 'NYSE', 'Consumer Staples'),
(22, 'CMCSA', 'Comcast Corporation', 1, '', 'NASDAQ', 'Consumer Discretionary'),
(23, 'COF', 'Capital One Financial Corp.', 1, '', 'NYSE', 'Financials'),
(24, 'COP', 'ConocoPhillips', 1, '', 'NYSE', 'Energy'),
(25, 'COST', 'Costco', 1, '', 'NASDAQ', 'Consumer Staples'),
(26, 'CSCO', 'Cisco Systems', 1, '', 'NASDAQ', 'Information Technology'),
(27, 'CVS', 'CVS Caremark', 1, '', 'NYSE', 'Consumer Staples'),
(28, 'CVX', 'Chevron', 1, '', 'NYSE', 'Energy'),
(30, 'DIS', 'The Walt Disney Company', 1, '', 'NYSE', 'Consumer Discretionary'),
(33, 'EBAY', 'eBay Inc.', 1, '', NULL, NULL),
(35, 'EMR', 'Emerson Electric Co.', 1, '', 'NYSE', 'Industrials'),
(36, 'EXC', 'Exelon', 1, '', 'NYSE', 'Utilities'),
(37, 'F', 'Ford Motor', 1, '', 'NYSE', 'Consumer Discretionary'),
(38, 'FB', 'Facebook', 1, '', 'NASDAQ', 'Information Technology'),
(40, 'FDX', 'FedEx', 1, '', 'NYSE', 'Industrials'),
(41, 'FOXA', 'Twenty-First Century Fox, Inc', 1, '', 'NASDAQ', 'Consumer Discretionary'),
(42, 'GD', 'General Dynamics', 1, '', 'NYSE', 'Industrials'),
(43, 'GE', 'General Electric Co.', 1, '', 'NYSE', 'Industrials'),
(44, 'GILD', 'Gilead Sciences', 1, '', 'NASDAQ', 'Health Care'),
(45, 'GM', 'General Motors', 1, '', 'NYSE', 'Consumer Discretionary'),
(46, 'GOOG', 'Google Inc.', 1, '', 'NASDAQ', 'Information Technology'),
(47, 'GS', 'Goldman Sachs', 1, '', 'NYSE', 'Financials'),
(48, 'HAL', 'Halliburton', 1, '', 'NYSE', 'Energy'),
(49, 'HD', 'Home Depot', 1, '', 'NYSE', 'Consumer Discretionary'),
(50, 'HON', 'Honeywell', 1, '', 'NYSE', 'Industrials'),
(51, 'HPQ', 'Hewlett Packard Co', 1, '', NULL, 'Information Technology'),
(52, 'IBM', 'International Business Machines', 1, '', 'NYSE', 'Information Technology'),
(53, 'JNJ', 'Johnson & Johnson Inc', 1, '', 'NYSE', 'Health Care'),
(54, 'JPM', 'JP Morgan Chase & Co', 1, '', 'NYSE', 'Financials'),
(55, 'KO', 'The Coca-Cola Company', 1, '', 'NYSE', 'Consumer Staples'),
(56, 'LLY', 'Eli Lilly and Company', 1, '', 'NYSE', 'Health Care'),
(57, 'LMT', 'Lockheed-Martin', 1, '', 'NYSE', 'Industrials'),
(58, 'LOW', 'Lowe\'s', 1, '', 'NYSE', 'Consumer Discretionary'),
(59, 'MA', 'Mastercard Inc', 1, '', 'NYSE', 'Information Technology'),
(60, 'INTC', 'Intel Corporation', 1, '', 'NASDAQ', 'Information Technology'),
(61, 'MCD', 'McDonald\'s Corp', 1, '', 'NYSE', 'Consumer Discretionary'),
(62, 'MDLZ', 'Mondelēz International', 1, '', 'NASDAQ', 'Consumer Staples'),
(63, 'MDT', 'Medtronic Inc.', 1, '', 'NYSE', 'Health Care'),
(64, 'MET', 'Metlife Inc.', 1, '', 'NYSE', 'Financials'),
(65, 'MMM', '3M Company', 1, '', 'NYSE', 'Industrials'),
(66, 'MO', 'Altria Group', 1, '', 'NYSE', 'Consumer Staples'),
(67, 'MON', 'Monsanto', 1, '', 'NYSE', 'Materials'),
(68, 'MRK', 'Merck & Co.', 1, '', 'NYSE', 'Health Care'),
(69, 'MS', 'Morgan Stanley', 1, '', 'NYSE', 'Financials'),
(70, 'MSFT', 'Microsoft', 1, '', 'NASDAQ', 'Information Technology'),
(71, 'NKE', 'Nike', 1, '', 'NYSE', 'Consumer Discretionary'),
(74, 'ORCL', 'Oracle Corporation', 1, '', 'NYSE', 'Information Technology'),
(75, 'OXY', 'Occidental Petroleum Corp.', 1, '', 'NYSE', 'Energy'),
(76, 'PEP', 'Pepsico Inc.', 1, '', 'NYSE', 'Consumer Staples'),
(77, 'PFE', 'Pfizer Inc', 1, '', 'NYSE', 'Health Care'),
(78, 'PG', 'Procter & Gamble Co', 1, '', 'NYSE', 'Consumer Staples'),
(79, 'PM', 'Phillip Morris International', 1, '', 'NYSE', 'Consumer Staples'),
(80, 'QCOM', 'Qualcomm Inc.', 1, '', 'NASDAQ', 'Information Technology'),
(81, 'RTN', 'Raytheon Co (NEW)', 1, '', 'NYSE', 'Industrials'),
(82, 'SBUX', 'Starbucks Corporation', 1, '', 'NASDAQ', 'Consumer Discretionary'),
(83, 'SLB', 'Schlumberger', 1, '', 'NYSE', 'Energy'),
(84, 'SO', 'Southern Company', 1, '', 'NYSE', 'Utilities'),
(85, 'SPG', 'Simon Property Group, Inc.', 1, '', 'NYSE', 'Real Estate'),
(86, 'T', 'AT&T Inc', 1, '', 'NYSE', 'Telecommunications'),
(87, 'TGT', 'Target Corp.', 1, '', 'NYSE', 'Consumer Discretionary'),
(88, 'TWX', 'Time Warner Inc.', 1, '', 'NYSE', 'Consumer Discretionary'),
(89, 'TXN', 'Texas Instruments', 1, '', 'NASDAQ', 'Information Technology'),
(90, 'UNH', 'UnitedHealth Group Inc.', 1, '', 'NYSE', 'Health Care'),
(91, 'UNP', 'Union Pacific Corp.', 1, '', 'NYSE', 'Industrials'),
(92, 'UPS', 'United Parcel Service Inc', 1, '', 'NYSE', 'Industrials'),
(93, 'USB', 'US Bancorp', 1, '', 'NYSE', 'Financials'),
(94, 'UTX', 'United Technologies Corp', 1, '', 'NYSE', 'Industrials'),
(95, 'V', 'Visa Inc.', 1, '', 'NYSE', 'Information Technology'),
(96, 'VZ', 'Verizon Communications Inc', 1, '', 'NYSE', 'Telecommunications'),
(97, 'WFC', 'Wells Fargo', 1, '', 'NYSE', 'Financials'),
(98, 'WMT', 'Wal-Mart', 1, '', 'NYSE', 'Consumer Staples'),
(99, 'XOM', 'Exxon Mobil Corp', 1, '', 'NYSE', 'Energy'),
(100, 'WBA', 'Walgreens Boots Alliance', 1, '', 'NASDAQ', 'Consumer Staples'),
(601, 'AAPL', 'Apple Inc.', 1, '', 'NASDAQ', 'Information Technology'),
(602, 'ABBV', 'AbbVie Inc.', 1, '', 'NYSE', 'Health Care'),
(603, 'TSLA', 'Tesla Motors, Inc.', 1, '', NULL, NULL),
(604, 'AGN', 'ALLERGAN', 1, '', 'NYSE', 'Health Care'),
(605, 'PYPL', 'PAYPAL HOLDINGS INC', 1, '', 'NASDAQ', 'Information Technology'),
(606, 'PCLN', 'PRICELINE GROUP INC/THE', 1, '', 'NASDAQ', 'Consumer Discretionary'),
(607, 'NEE', 'NEXTERA ENERGY INC', 1, '', 'NYSE', 'Utilities'),
(608, 'KMI', 'KINDER MORGAN INC', 1, '', 'NYSE', 'Energy'),
(609, 'KHC', 'KRAFT HEINZ', 1, '', 'NASDAQ', 'Consumer Staples'),
(610, 'DUK', 'DUKE ENERGY CORP', 1, '', 'NYSE', 'Utilities'),
(611, 'DHR', 'DANAHER CORP', 1, '', 'NYSE', 'Health Care'),
(612, 'CELG', 'CELGENE CORP', 1, '', 'NASDAQ', 'Health Care'),
(613, 'BLK', 'BLACKROCK INC.', 1, '', 'NYSE', 'Financials');

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
-- Indexes for table `transfers`
--
ALTER TABLE `transfers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `date` (`date`);

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
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=493;
--
-- AUTO_INCREMENT for table `equity_history`
--
ALTER TABLE `equity_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5819;
--
-- AUTO_INCREMENT for table `exchange_schedule`
--
ALTER TABLE `exchange_schedule`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=314;
--
-- AUTO_INCREMENT for table `import_batch`
--
ALTER TABLE `import_batch`
  MODIFY `import_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=575790;
--
-- AUTO_INCREMENT for table `indicators`
--
ALTER TABLE `indicators`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=563469;
--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `positions`
--
ALTER TABLE `positions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4377;
--
-- AUTO_INCREMENT for table `stock_actual`
--
ALTER TABLE `stock_actual`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14255;
--
-- AUTO_INCREMENT for table `stock_history`
--
ALTER TABLE `stock_history`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=564787;
--
-- AUTO_INCREMENT for table `stock_history_full`
--
ALTER TABLE `stock_history_full`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=839047;
--
-- AUTO_INCREMENT for table `transfers`
--
ALTER TABLE `transfers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `watchlist`
--
ALTER TABLE `watchlist`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=614;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
