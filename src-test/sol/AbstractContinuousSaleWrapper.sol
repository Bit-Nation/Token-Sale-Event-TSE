/*
 * Wrapper for Abstract Continuous Sale Smart Contract.
 * Copyright © 2016–2017 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */
pragma solidity ^0.4.11;

import "./../../src/sol/AbstractContinuousSale.sol";

/**
 * Wrapper for Abstract Continuous Sale smart contract..
 */
contract AbstractContinuousSaleWrapper is AbstractContinuousSale {
  /**
   * Place buy-side order at given price.  Value sent within transaction should
   * be factor of given price and order amount is calculated as msg.value/price.
   *
   * @param _price order price
   * @return true on success, false on error
   */
  function placeOrder (uint256 _price) payable returns (bool success) {
    Result (success = AbstractContinuousSale.placeOrder (_price));
  }

  /**
   * Terminate order previously placed by msg.sender.
   *
   * @return true on success, false on error
   */
  function terminateOrder () returns (bool success) {
    Result (success = AbstractContinuousSale.terminateOrder ());
  }

  /**
   * Calculate maximum amount of assets to be sold by given time.
   *
   * @param _time time to calculate maximum amount of assets to be sole by
   * @return maximum amount of assets to be sold by given time
   */
  function amountToSellBy (uint256 _time)
    public constant returns (uint256 amount) {
    if (msg.sender == 0 && _time != 15) throw;
    return toSell;
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
    if (sendAssetsEnabled) {
      Send (_to, _amount);
      return true;
    } else return false;
  }

  /**
   * Increase amount of assets available for sale.
   *
   * @param _amount value to add to the amount of assets available for sale
   */
  function sellMore (uint256 _amount) {
    toSell = safeAdd (toSell, _amount);
  }

  /**
   * Set whether sending assets is enabled.
   *
   * @param _sendAssetsEnabled true to enable sending assets, false otherwise
   */
  function setSendAssetsEnabled (bool _sendAssetsEnabled) {
    sendAssetsEnabled = _sendAssetsEnabled;
  }

  /**
   * Check consistency of order tree.
   *
   * @return true if order tree is consistent, false otherwise.
   */
  function checkOrderTree () constant returns (uint256 result) {
    return checkOrderTree (
      rootOrder, 0, 0,
      0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);
  }

  /**
   * Get total remaining amount of all orders.
   *
   * @return total remaining amount of all orders
   */
  function totalRemainingAmount () constant returns (uint result) {
    return rootOrder == 0 ? 0 : orders [rootOrder].totalRemainingAmount;
  }

  /**
   * Get total remaining value of all orders.
   *
   * @return total remaining value of all orders
   */
  function totalRemainingValue () constant returns (uint result) {
    return rootOrder == 0 ? 0 : orders [rootOrder].totalRemainingValue;
  }

  /**
   * Get pending refund value.
   */
  function getPendingRefund () constant returns (uint result) {
    return pendingRefund;
  }

  /**
   * Check consistency of order subtree whose root is given node.
   *
   * @param _node root node of subtree to check
   * @return true if order tree is consistent, false otherwise.
   */
  function checkOrderTree (address _node, address _parent,
    uint256 _minPrice, uint256 _maxPrice)
    private constant returns (uint256 result) {
    if (_node == 0) return 0; // Empty subtree is always consistent
    else {
      Order storage order = orders [_node];

      if (order.amount == 0) return 1;
      if (order.price == 0) return 2;
      if (order.filledAmount > order.amount) return 3;

      if (order.parent != _parent) return 4;

      uint256 totalRemainingAmount = order.amount - order.filledAmount;
      uint256 totalRemainingValue = totalRemainingAmount * order.price;
      uint256 height = 1;

      if (order.left != 0) {
        uint256 l = checkOrderTree (order.left, _node, _minPrice, order.price);
        if (l != 0) return l * 100;

        Order storage leftOrder = orders [order.left];
        totalRemainingAmount += leftOrder.totalRemainingAmount;
        totalRemainingValue += leftOrder.totalRemainingValue;
        height = max (height, leftOrder.height + 1);
      }

      if (order.right != 0) {
        uint256 r = checkOrderTree (order.right, _node, order.price, _maxPrice);
        if (r != 0) return r * 100 + 1;

        Order storage rightOrder = orders [order.right];
        totalRemainingAmount += rightOrder.totalRemainingAmount;
        totalRemainingValue += rightOrder.totalRemainingValue;
        height = max (height, rightOrder.height + 1);
      }

      if (order.totalRemainingAmount != totalRemainingAmount) return 7;
      if (order.totalRemainingValue != totalRemainingValue) return 8;
      if (order.height != height) return 9;

      if (order.price < _minPrice) return 10;
      if (order.price > _maxPrice) return 11;

      return 0;
    }
  }

  /**
   * Calculate maximum of two values.
   *
   * @param _x first value
   * @param _y second value
   * @return maximum of two values
   */
  function max (uint256 _x, uint256 _y)
    private constant returns (uint256 result) {
    return _x > _y ? _x : _y;
  }

  /**
   * Amount of assets to sell by now.
   */
  uint256 toSell;

  /**
   * True if sending assets is enabled, false otherwise.
   */
  bool sendAssetsEnabled = true;

  /**
   * Used to log result of operation.
   *
   * @param _value result of operation
   */
  event Result (bool _value);

  /**
   * Logged when assets are sent to the user.
   *
   * @param _to address of the user assets were sent to
   * @param _value amount of assets sent
   */
  event Send (address indexed _to, uint256 _value);
}
