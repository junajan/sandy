-- phpMyAdmin SQL Dump
-- version 4.6.0
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: May 10, 2017 at 08:59 PM
-- Server version: 5.7.11
-- PHP Version: 7.1.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Database: `sandy`
--

-- --------------------------------------------------------

--
-- Table structure for table `equity_history_real`
--

CREATE TABLE `equity_history_real` (
  `id` int(11) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `capital` decimal(15,4) NOT NULL,
  `unused_capital` decimal(15,4) NOT NULL,
  `free_pieces` int(11) NOT NULL,
  `original_capital` decimal(15,4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `equity_history_real`
--
ALTER TABLE `equity_history_real`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `equity_history_real`
--
ALTER TABLE `equity_history_real`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;