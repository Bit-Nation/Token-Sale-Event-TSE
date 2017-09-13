/*
 * Wrapper for PAT Token Sale Smart Contract.
 * Copyright © 2017 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */
pragma solidity ^0.4.11;

import "./../../src/sol/PATTokenSale.sol";

/**
 * Wrapper for PAT Token Sale smart contract..
 */
contract PATTokenSaleWrapper is PATTokenSale {
  /**
   * Create PAT Token Sale Wrapper smart contract with given sale start time,
   * invitation signer address, token contract and central bank address.
   *
   * @param _saleStartTime sale start time
   * @param _invitationSigner address of invitation signer
   * @param _token ERC20 smart contract managing tokens to be sold
   * @param _centralBank central bank address to transfer tokens from
   */
  function PATTokenSaleWrapper (
    uint256 _saleStartTime, address _invitationSigner,
    Token _token, address _centralBank)
    PATTokenSale (_saleStartTime, _invitationSigner, _token, _centralBank) {
    // Do nothing
  }

  /**
   * Place buy-side order at given price.  Value sent within transaction should
   * be factor of given price and order amount is calculated as msg.value/price.
   *
   * @param _price order price
   * @return true on success, false on error
   */
  function placeOrder (uint256 _price) payable returns (bool success) {
    Result (success = PATTokenSale.placeOrder (_price));
  }

  /**
   * Place buy-side presale order at given price.  Value sent within transaction
   * should be factor of given price and order amount is calculated as
   * msg.value/price.
   *
   * @param _price order price
   * @param _invitation presale invitation
   * @return true on success, false on error
   */
  function placePresaleOrder (uint256 _price, bytes _invitation)
    payable returns (bool success) {
    Result (success = PATTokenSale.placePresaleOrder (_price, _invitation));
  }

  /**
   * Collect sale revenue and send it to the owner of smart contract.
   *
   * @return true on success, false on fail
   */
  function collectRevenue () returns (bool success) {
    Result (success = PATTokenSale.collectRevenue ());
  }

  /**
   * Used to log result of operation.
   *
   * @param _value result of operation
   */
  event Result (bool _value);
}
