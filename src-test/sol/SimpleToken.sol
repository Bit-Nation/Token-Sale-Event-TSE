/*
 * Simple ERC-20 Token Smart Contract to be used for tests.
 * Copyright © 2017 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */
pragma solidity ^0.4.11;

import "./../../src/sol/Token.sol";

/**
 * Simple ERC-20 Token Smart Contract to be used for tests.
 */
contract SimpleToken is Token {
  /**
   * Get total number of tokens in circulation.
   *
   * @return total number of tokens in circulation
   */
  function totalSupply () constant returns (uint256) {
    throw;
  }

  /**
   * Get number of tokens currently belonging to given owner.
   *
   * @return number of tokens currently belonging to the owner of given address
   */
  function balanceOf (address) constant returns (uint256) {
    throw;
  }

  /**
   * Transfer given number of tokens from message sender to given recipient.
   *
   * @return true if tokens were transferred successfully, false otherwise
   */
  function transfer (address, uint256) returns (bool) {
    throw;
  }

  /**
   * Transfer given number of tokens from given owner to given recipient.
   *
   * @param _from address to transfer tokens from the owner of
   * @param _to address to transfer tokens to the owner of
   * @param _value number of tokens to transfer from given owner to given
   *        recipient
   * @return true if tokens were transferred successfully, false otherwise
   */
  function transferFrom (address _from, address _to, uint256 _value)
  returns (bool success) {
    if (transfersEnabled) {
      Transfer (_from, _to, _value);
      return true;
    } else return false;
  }

  /**
   * Allow given spender to transfer given number of tokens from message sender.
   *
   * @return true if token transfer was successfully approved, false otherwise
   */
  function approve (address, uint256) returns (bool) {
    throw;
  }

  /**
   * Tell how many tokens given spender is currently allowed to transfer from
   * given owner.
   *
   * @return number of tokens given spender is currently allowed to transfer
   *         from given owner
   */
  function allowance (address, address) constant
  returns (uint256) {
    throw;
  }

  /**
   * Set whether transfers are enabled.
   *
   * @param _transfersEnabled `true` to enable transfers, `false` to disable
   */
  function setTransfersEnabled (bool _transfersEnabled) {
    transfersEnabled = _transfersEnabled;
  }

  /**
   * Whether transfers are enabled.
   */
  bool private transfersEnabled = false;
}
