/*
 * PAT Token Sale Smart Contract.  Copyright © 2017 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */
pragma solidity ^0.4.11;

import "./Token.sol";
import "./AbstractContinuousSale.sol";

/**
 * Continuous Sale Action for selling PAT tokens.
 */
contract PATTokenSale is AbstractContinuousSale {
  /**
   * Create PAT Token Sale smart contract with given sale start time, invitation
   * signer address, token contract and central bank address.
   *
   * @param _saleStartTime sale start time
   * @param _invitationSigner address of invitation signer
   * @param _token ERC20 smart contract managing tokens to be sold
   * @param _centralBank central bank address to transfer tokens from
   */
  function PATTokenSale (
    uint256 _saleStartTime, address _invitationSigner,
    Token _token, address _centralBank) {
    if (_invitationSigner == 0) revert ();
    owner = msg.sender;
    saleStartTime = _saleStartTime;
    invitationSigner = _invitationSigner;
    token = _token;
    centralBank = _centralBank;
  }

  /**
   * Place buy-side order at given price.  Value sent within transaction should
   * be factor of given price and order amount is calculated as msg.value/price.
   *
   * @param _price order price
   * @return true on success, false on error
   */
  function placeOrder (uint256 _price) payable returns (bool success) {
    if (now < safeAdd (saleStartTime, 48 hours)) revert ();
    else return AbstractContinuousSale.placeOrder (_price);
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
    if (now < saleStartTime) revert ();
    else if (_invitation.length != 65) revert ();
    else {
      bytes32 r;
      bytes32 s;
      uint8 v;
      assembly {
        r := mload(add(_invitation, 32))
        s := mload(add(_invitation, 64))
        v := and(mload(add(_invitation, 65)), 255)
      }
      if (v < 27) v += 27;
      bytes memory prefix = "\x19Ethereum Signed Message:\n20";
      if (ecrecover(sha3 (prefix, msg.sender), v, r, s) != invitationSigner) revert ();
      else return AbstractContinuousSale.placeOrder (_price);
    }
  }

  /**
   * Calculate maximum amount of assets to be sold by given time.
   *
   * @param _time time to calculate maximum amount of assets to be sole by
   * @return maximum amount of assets to be sold by given time
   */
  function amountToSellBy (uint256 _time)
    constant returns (uint256 amount) {
    if (_time < saleStartTime) return 0; // nothing to sell before sale start
    _time = safeSub (_time, saleStartTime);
    if (_time < 2 days) return 0; // Nothing to sell in first two days
    _time = safeSub (_time, 2 days);
    if (_time < 28 days)
      return safeAdd (840e6, safeMul (_time, 3360e6) / 28 days);
    _time = safeSub (_time, 28 days);
    if (_time < 720 days)
      return safeAdd (4200e6, safeMul (_time, 10080e6) / 720 days);
    return 14280e6;
  }

  /**
   * Send given amount of assets to the owner of given address.
   *
   * @param _to address to send assets to the owner of
   * @param _amount amount of assets to send
   * @return true on success, false on error
   */
  function sendAssets (address _to, uint256 _amount)
    internal returns (bool success) {
    return token.transferFrom (centralBank, _to, _amount);
  }

  /**
   * Collect sale revenue and send it to the owner of smart contract.
   *
   * @return true on success, false on fail
   */
  function collectRevenue () returns (bool success) {
    if (msg.sender != owner) revert ();

    uint256 revenue = outstandingRevenue (now);
    if (revenue > 0)
      return msg.sender.send (revenue);
    else return true;
  }

  /**
   * Set new owner for this smart contract.
   *
   * @param _newOwner address of the new owner
   */
  function setOwner (address _newOwner) {
    if (msg.sender != owner) revert ();

    owner = _newOwner;
  }

  /**
   * Address of the owner of smart contract.
   */
  address private owner;

  /**
   * Sale start time.
   */
  uint256 private saleStartTime;

  /**
   * Address of invitation signer.
   */
  address private invitationSigner;

  /**
   * ERC20 token smart contract managing tokens to be sold.
   */
  Token private token;

  /**
   * Address of central bank to transfer tokens from.
   */
  address private centralBank;
}
