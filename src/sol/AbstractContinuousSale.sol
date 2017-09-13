/*
 * Abstract Continuous Sale Smart Contract.
 * Copyright © 2017 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */
pragma solidity ^0.4.11;

import "./SafeMath.sol";

/**
 * Abstract base class for Ethereum smart contracts that implement continuous
 * sale auction for some assets.
 */
contract AbstractContinuousSale is SafeMath {
  /**
   * Place buy-side order at given price.  Value sent within transaction should
   * be factor of given price and order amount is calculated as msg.value/price.
   *
   * @param _price order price
   * @return true on success, false on error
   */
  function placeOrder (uint256 _price) payable returns (bool success) {
    if (msg.sender == 0) revert ();
    if (msg.value == 0) revert ();
    if (_price == 0) revert ();

    uint256 amount = msg.value / _price;
    if (msg.value != safeMul (amount, _price)) revert ();

    Order storage newOrder = orders [msg.sender];
    if (newOrder.amount != 0) revert ();

    executeSale ();

    newOrder.amount = amount;
    newOrder.price = _price;
    newOrder.totalRemainingAmount = amount;
    newOrder.totalRemainingValue = msg.value;
    newOrder.height = 1;

    if (rootOrder == 0) rootOrder = msg.sender;
    else {
      address node = rootOrder;
      while (true) {
        Order storage order = orders [node];
        if (order.price >= _price) {
          address left = order.left;
          if (left == 0) {
            order.left = msg.sender;
            break;
          } else node = left;
        } else {
          address right = order.right;
          if (right == 0) {
            order.right = msg.sender;
            break;
          } else node = right;
        }
      }
      newOrder.parent = node;
      updateAndRebalance (node, amount, msg.value);
    }

    OrderPlacement (msg.sender, amount, _price);

    return true;
  }

  /**
   * Terminate order previously placed by msg.sender.
   *
   * @return true on success, false on error
   */
  function terminateOrder () returns (bool success) {
    if (msg.sender == 0) return false;
    Order storage order = orders [msg.sender];
    uint256 amount = order.amount;
    if (amount == 0) return false; // No such order

    executeSale ();

    bool wasInTree = isInTree (msg.sender);
    uint256 filledAmount;
    if (wasInTree) {// Our order is still in tree
      removeNode (msg.sender, order);
      filledAmount = order.filledAmount;
      OrderTermination (msg.sender, filledAmount);
    } else if (order.height > 0) {// Our order is not yet terminated
      order.filledAmount = amount;
      filledAmount = amount;
      OrderTermination (msg.sender, filledAmount);
    } else { // Order already terminated
      filledAmount = order.filledAmount;
    }

    order.parent = 0;
    order.left = 0;
    order.right = 0;
    order.totalRemainingAmount = 0;
    order.totalRemainingValue = 0;
    order.height = 0;

    success = true;

    if (filledAmount > 0) { // Somewhat filled
      if (sendAssets (msg.sender, filledAmount)) {
        amount = safeSub (amount, filledAmount);
        order.amount = amount;
        filledAmount = 0;
        order.filledAmount = 0;
      } else success = false;
    }

    if (filledAmount < amount) { // Not fully filled
      uint256 refund = safeMul (order.price, safeSub (amount, filledAmount));
      if (msg.sender.send (refund)) {
        order.amount = filledAmount;
        order.price = 0;
        if (!wasInTree)
          pendingRefund = safeSub (pendingRefund, refund);
      } else {
        success = false;
        if (wasInTree)
          pendingRefund = safeAdd (pendingRefund, refund);
      }
    } else order.price = 0;
  }

  /**
   * Get outstanding sale revenue.
   *
   * @param _currentTime current time
   * @return outstanding sale revenue
   */
  function outstandingRevenue (uint256 _currentTime)
    constant returns (uint256 result) {
    address node = rootOrder;
    if (node == 0) result = this.balance; // No orders
    else {
      Order storage nodeOrder = orders [node];
      uint256 toSell = safeSub (amountToSellBy (_currentTime), soldAmount);
      if (nodeOrder.totalRemainingAmount <= toSell)
        result = this.balance; // All orders are actually filled
      else {
        result = safeSub (this.balance, nodeOrder.totalRemainingValue);
        if (toSell > 0) {
          while (true) {
            address right = nodeOrder.right;
            if (right != 0) {
              Order storage rightOrder = orders [right];
              uint256 rightTotalRemainingAmount = rightOrder.totalRemainingAmount;
              if (rightTotalRemainingAmount <= toSell) {
                // Right subtree is actually filled
                result = safeAdd (result, rightOrder.totalRemainingValue);
                toSell = safeSub (toSell, rightTotalRemainingAmount);
              } else {
                node = right;
                nodeOrder = rightOrder;
                continue;
              }
            }
    
            uint256 remainingAmount = safeSub (
              nodeOrder.amount, nodeOrder.filledAmount);
            if (remainingAmount <= toSell) {
              // Order is actually filled
              result = safeAdd (
                result, safeMul (nodeOrder.price, remainingAmount));
              toSell = safeSub (toSell, remainingAmount);
            } else {
              // Order is partially filled
              result = safeAdd (result, safeMul (nodeOrder.price, toSell));
              break;
            }
    
            node = nodeOrder.left;
            nodeOrder = orders [node];
          }
        }
      }
    }

    result = safeSub (result, pendingRefund);
  }

  /**
   * Get status of order.
   *
   * @param _orderCreator address of the created of the order to get status for
   * @param _currentTime current time
   * @return order status
   */
  function orderStatus (address _orderCreator, uint256 _currentTime)
  constant returns (
    bool active, uint256 amount, uint256 price, uint256 filledAmount) {
    if (_orderCreator == 0) {
      active = false;
      return;
    }
    Order storage order = orders [_orderCreator];
    if (order.amount == 0) { // No such order
      active = false;
      return;
    }
    if (isInTree (_orderCreator)) {
      uint256 toSell = safeSub (amountToSellBy (_currentTime), soldAmount);

      if (toSell > 0) {
        uint256 rightAmount = 0;
        address right = order.right;
        if (right != 0)
          rightAmount = safeAdd (
            rightAmount, orders [right].totalRemainingAmount);
        address node = _orderCreator;
        Order storage nodeOrder = order;
        bool leftChild = false;
        while (true) {
          if (leftChild) {
            rightAmount = safeAdd (
              rightAmount, safeSub (nodeOrder.amount, nodeOrder.filledAmount));
            right = nodeOrder.right;
            if (right != 0)
              rightAmount = safeAdd (
                rightAmount, orders [right].totalRemainingAmount);
          }
          address parent = nodeOrder.parent;
          if (parent == 0) break;
          nodeOrder = orders [parent];
          leftChild = nodeOrder.left == node;
          node = parent;
        }
        if (rightAmount >= toSell) toSell = 0;
        else toSell = safeSub (toSell, rightAmount);
      }

      active = true;
      amount = order.amount;
      price = order.price;
      filledAmount = order.filledAmount;
      if (safeSub (amount, filledAmount) > toSell)
        filledAmount = safeAdd (filledAmount, toSell);
      else filledAmount = amount;
      return;
    } else if (order.height == 0) { // Order already terminated
      active = false;
      amount = order.amount;
      price = order.price;
      filledAmount = order.filledAmount;
      return;
    } else { // Order is not yet terminated, but is fully filled
      active = true;
      amount = order.amount;
      price = order.price;
      filledAmount = amount; // Ignore order.filledAmount
      return;
    }
  }

  /**
   * Get total remaining amount of all active orders with price greater or
   * equal to given price.
   *
   * @param _price price to return total remaining amount of all active orders
   *        with price greater or equal to
   * @param _currentTime current time
   * @return total remaining amount of all active orders with price greater or
   *         equal to given price
   */
  function totalAmountForPrice (uint256 _price, uint256 _currentTime)
    constant returns (uint256 result) {
    result = 0;
    address node = rootOrder;
    while (node != 0) {
      Order storage nodeOrder = orders [node];
      if (_price <= nodeOrder.price) {
        address right = nodeOrder.right;
        if (right != 0)
          result = safeAdd (result, orders [right].totalRemainingAmount);
        result = safeAdd (
          result, safeSub (nodeOrder.amount, nodeOrder.filledAmount));
        node = nodeOrder.left;
      } else node = nodeOrder.right;
    }

    uint256 toSell = safeSub (amountToSellBy (_currentTime), soldAmount);
    if (result <= toSell) return 0;
    else result = safeSub (result, toSell);
  }

  /**
   * Get total amount of assets sold so far.
   *
   * @param _currentTime current time
   * @return total amount of assets sold so far
   */
  function totalSold (uint256 _currentTime)
    constant returns (uint256 result) {
    result = soldAmount;
    uint256 toSell = safeSub (amountToSellBy (_currentTime), result);
    if (toSell > 0 && rootOrder != 0) {
      uint256 totalRemainingAmount = orders [rootOrder].totalRemainingAmount;
      if (toSell <= totalRemainingAmount)
        result = safeAdd (result, toSell);
      else
        result = safeAdd (result, totalRemainingAmount);
    }
  }

  /**
   * Calculate maximum amount of assets to be sold by given time.
   *
   * @param _time time to calculate maximum amount of assets to be sole by
   * @return maximum amount of assets to be sold by given time
   */
  function amountToSellBy (uint256 _time)
    public constant returns (uint256 amount);

  /**
   * Send given amount of assets to the owner of given address.
   *
   * @param _to address to send assets to the owner of
   * @param _amount amount of assets to send
   * @return true on success, false on error
   */
  function sendAssets (address _to, uint256 _amount)
    internal returns (bool success);

  /**
   * Remove given node from order tree.
   *
   * @param _node node to be removed
   */
  function removeNode (address _node, Order storage _nodeOrder) private {
    if (_node == 0) throw;

    address right = _nodeOrder.right;
    address left = _nodeOrder.left;
    if (right == 0) { // No right subtree
      replaceNode (_node, left);
      updateAfterExecute (_nodeOrder.parent);
    } else if (left == 0) { // No left subtree
      replaceNode (_node, right);
      updateAfterExecute (_nodeOrder.parent);
    } else { // Both subtrees present
      // Lets find next node
      Order storage nextOrder = orders [right];
      address p = right;
      while (true) {
        address l = nextOrder.left;
        if (l == 0) break;
        else {
          p = l;
          nextOrder = orders [l];
        }
      }
      address nextOrderParent = nextOrder.parent;
      replaceNode (p, nextOrder.right);
      replaceNode (_node, p);
      left = _nodeOrder.left;
      if (left != 0)
        orders [left].parent = p;
      right = _nodeOrder.right;
      if (right != 0)
        orders [right].parent = p;
      nextOrder.left = left;
      nextOrder.right = right;
      if (nextOrderParent == _node)
        updateAfterExecute (p);
      else
        updateAfterExecute (nextOrderParent);
    }
  }

  /**
   * Checks whether given node is currently in order tree.
   *
   * @param _node node to check
   * @return true is given node is in order tree, false otherwise
   */
  function isInTree (address _node) private constant returns (bool result) {
    if (_node == 0) return false;
    if (rootOrder == 0) return false; // There is no orders
    if (_node == rootOrder) return true;

    Order storage nodeOrder = orders [_node];
    while (true) {
      address parent = nodeOrder.parent;
      if (parent == 0) return false;
      nodeOrder = orders [parent];
      if (nodeOrder.left != _node && nodeOrder.right != _node) return false;
      if (parent == rootOrder) return true;
      _node = parent;
    }
  }

  /**
   * Replace node A with node B.
   *
   *    |     =>  |
   *    A  B      B  A
   *
   * @param _a node A
   * @param _b node B (may be zero)
   */
  function replaceNode (address _a, address _b) private {
    Order storage orderA = orders [_a];
    address parent = orderA.parent;
    if (parent == 0) rootOrder = _b;
    else {
      Order storage parentOrder = orders [parent];
      if (parentOrder.left == _a) parentOrder.left = _b;
      else if (parentOrder.right == _a) parentOrder.right = _b;
      else throw;
    }
    if (_b != 0) orders [_b].parent = parent;
  }

  /**
   * Execute orders that could be executed.
   */
  function executeSale () private {
    address node = rootOrder;
    if (node == 0) return; // No orders
    else {
      uint256 toSell = safeSub (amountToSellBy (now), soldAmount);
      if (toSell == 0) return; // Nothing to sell
      Order storage nodeOrder = orders [node];
      uint256 totalRemainingAmount = nodeOrder.totalRemainingAmount;
      if (totalRemainingAmount <= toSell) {
        // Execute all orders
        soldAmount = safeAdd (soldAmount, totalRemainingAmount);
        rootOrder = 0;
        return;
      } else {
        while (true) {
          address left = nodeOrder.left;
          if (left != 0) {
            Order storage leftOrder = orders [left];
            uint256 leftTotalRemainingAmount = leftOrder.totalRemainingAmount;
            uint256 nonLeftTotalRemainingAmount =
              safeSub (totalRemainingAmount, leftTotalRemainingAmount);
            if (nonLeftTotalRemainingAmount < toSell) {
              toSell = safeSub (toSell, nonLeftTotalRemainingAmount);
              soldAmount = safeAdd (soldAmount, nonLeftTotalRemainingAmount);
              address right1 = nodeOrder.right;
              if (right1 != 0) nodeOrder.right = 0;
              nodeOrder.filledAmount = nodeOrder.amount;
              node = left;
              nodeOrder = leftOrder;
              totalRemainingAmount = leftTotalRemainingAmount;
              continue;
            }
          }

          address right2 = nodeOrder.right;
          if (right2 != 0) {
            Order storage rightOrder = orders [right2];
            uint256 rightTotalRemainingAmount = rightOrder.totalRemainingAmount;
            if (rightTotalRemainingAmount >= toSell) {
              node = right2;
              nodeOrder = rightOrder;
              totalRemainingAmount = rightTotalRemainingAmount;
              continue;
            } else {
              toSell = safeSub (toSell, rightTotalRemainingAmount);
              soldAmount = safeAdd (soldAmount, rightTotalRemainingAmount);
              nodeOrder.right = 0;
            }
          }

          nodeOrder.filledAmount = safeAdd (nodeOrder.filledAmount, toSell);
          soldAmount = safeAdd (soldAmount, toSell);
          break;
        }
        updateAfterExecute (node);
      }
    }
  }

  /**
   * Update aggregates on given node and all its ancestors.
   *
   * @param _node node to update along with its ancestors
   */
  function updateAfterExecute (address _node) private {
    while (_node != 0) {
      Order storage nodeOrder = orders [_node];

      uint256 height;
      uint256 totalRemainingAmount =
        safeSub (nodeOrder.amount, nodeOrder.filledAmount);
      uint256 totalRemainingValue = totalRemainingAmount * nodeOrder.price;

      address left = nodeOrder.left;
      if (left != 0) {
        Order storage leftOrder = orders [left];
        height = safeAdd (leftOrder.height, 1);
        totalRemainingAmount =
          safeAdd (totalRemainingAmount, leftOrder.totalRemainingAmount);
        totalRemainingValue =
          safeAdd (totalRemainingValue, leftOrder.totalRemainingValue);
      } else height = 1;

      address right = nodeOrder.right;
      if (right != 0) {
        Order storage rightOrder = orders [right];
        height = max (height, safeAdd (rightOrder.height, 1));
        totalRemainingAmount =
          safeAdd (totalRemainingAmount, rightOrder.totalRemainingAmount);
        totalRemainingValue =
          safeAdd (totalRemainingValue, rightOrder.totalRemainingValue);
      }

      nodeOrder.height = height;
      nodeOrder.totalRemainingAmount = totalRemainingAmount;
      nodeOrder.totalRemainingValue = totalRemainingValue;

      _node = nodeOrder.parent;
    }
  }

  /**
   * Update aggregated values in given tree node and all its ancestors and
   * rebalance tree if necessary.
   *
   * @param _node node to be updated along with its ancestors
   * @param _extraAmount amount to add to this node and all its ancestors
   * @param _extraValue value to add to this node and all its ancestors
   */
  function updateAndRebalance (
    address _node, uint256 _extraAmount, uint256 _extraValue)
    private {
    if (_node == 0) throw;
      Order storage nodeOrder = orders [_node];

    while (true) {
      address left = nodeOrder.left;
      address right = nodeOrder.right;

      nodeOrder.height = safeAdd (
        max (getHeight (left), getHeight (right)), 1);
      nodeOrder.totalRemainingAmount = safeAdd (
        nodeOrder.totalRemainingAmount, _extraAmount);
      nodeOrder.totalRemainingValue = safeAdd (
        nodeOrder.totalRemainingValue, _extraValue);

      address parent = nodeOrder.parent;
      address rebalanced = rebalance (_node);

      if (parent != 0) {
        nodeOrder = orders [parent];
        if (_node != rebalanced) {
          if (_node == nodeOrder.left)
            nodeOrder.left = rebalanced;
          else if (_node == nodeOrder.right)
            nodeOrder.right = rebalanced;
        }
        _node = parent;
      } else {
        if (_node != rebalanced) rootOrder = rebalanced;
        break;
      }
    }
  }

  /**
   * Rebalance given tree node if necessary.
   *
   * @param _node tree node to rebalance
   * @return rebalanced tree node
   */
  function rebalance (address _node) private returns (address rebalanced) {
    if (_node == 0) throw;

    Order storage nodeOrder = orders [_node];

    address left = nodeOrder.left;
    address right = nodeOrder.right;
    if (left == 0) {
      if (right == 0) return _node;
      else {
        Order storage rightOrder1 = orders [right];
        uint256 rightHeight1 = rightOrder1.height;
        if (rightHeight1 > 1)
          return chooseRotate (
            true,
            _node, nodeOrder,
            right, rightOrder1,
            0);
        else return _node;
      }
    } else {
      Order storage leftOrder = orders [left];
      uint256 leftHeight = leftOrder.height;
      if (right == 0) {
        if (leftHeight > 1)
          return chooseRotate (
            false,
            _node, nodeOrder,
            left, leftOrder,
            0);
        else return _node;
      }
      else {
        Order storage rightOrder2 = orders [right];
        uint256 rightHeight2 = rightOrder2.height;
        if (safeAdd (leftHeight, 1) < rightHeight2)
          return chooseRotate (
            true,
            _node, nodeOrder,
            right, rightOrder2,
            leftHeight);
        else if (leftHeight > safeAdd (rightHeight2, 1))
          return chooseRotate (
            false,
            _node, nodeOrder,
            left, leftOrder,
            rightHeight2);
        else return _node;
      }
    }
  }

  /**
   * Choose appropriate rotation type, either ordinary or big rotation.
   *
   * Left
   *
   *   A
   *  / \
   * 1   B
   *
   * Right
   *
   *   A
   *  / \
   * B   1
   *
   * @param _left true to choose left rotation type, false to choose right
   *        rotation type
   * @param _a node A
   * @param _orderA order A
   * @param _b node B
   * @param _orderB order B
   * @param _height1 height of subtree 1
   * @return rotated node
   */
  function chooseRotate (
    bool _left,
    address _a, Order storage _orderA,
    address _b, Order storage _orderB,
    uint256 _height1) private returns (address rotated) {
    address c = _left ? _orderB.left : _orderB.right;
    if (c == 0) {
      rotate (
        _left,
        _a, _orderA,
        _b, _orderB,
        0, _orderA, // Order C parameter is not used anyway
        _height1);

      return _b;
    } else {
      Order storage orderC = orders [c];
      if (_height1 < orderC.height) {
        bigRotate (
          _left,
          _a, _orderA,
          _b, _orderB,
          c, orderC,
          _height1);
  
        return c;
      } else {
        rotate (
          _left,
          _a, _orderA,
          _b, _orderB,
          c, orderC,
          _height1);

        return _b;
      }
    }
  }

  /**
   * Rotate tree either left or right:
   *
   *       Left
   *   A           B
   *  / \         / \
   * 1   B  ==>  A   2
   *    / \     / \
   *   C   2   1   C
   *
   *         Right
   *     A           B
   *    / \         / \
   *   B   1  ==>  2   A
   *  / \             / \
   * 2   C           C   1
   *
   * @param _left true to rotate left, false to rotate right
   * @param _a node A
   * @param _orderA order A
   * @param _b node B
   * @param _orderB order B
   * @param _c node C (may be zero)
   * @param _orderC order C (undefined is _c is zero)
   * @param _height1 height of subtree 1
   */
  function rotate (
    bool _left,
    address _a, Order storage _orderA,
    address _b, Order storage _orderB,
    address _c, Order storage _orderC,
    uint256 _height1) private {
    // Adjust parents
    _orderB.parent = _orderA.parent;
    _orderA.parent = _b;
    if (_c != 0)
      _orderC.parent = _a;

    // Adjust links
    if (_left) {
      _orderA.right = _c;
      _orderB.left = _a;
    } else {
      _orderA.left = _c;
      _orderB.right = _a;
    }

    // Adjust aggregates
    uint256 _totalRemainingAmountA = _orderA.totalRemainingAmount;
    uint256 _totalRemainingValueA = _orderA.totalRemainingValue;

    _orderA.totalRemainingAmount = safeAdd (
      safeSub (_totalRemainingAmountA, _orderB.totalRemainingAmount),
      _c == 0 ? 0 : _orderC.totalRemainingAmount);
    _orderA.totalRemainingValue = safeAdd (
      safeSub (_totalRemainingValueA, _orderB.totalRemainingValue),
      _c == 0 ? 0 : _orderC.totalRemainingValue);
    _orderB.totalRemainingAmount = _totalRemainingAmountA;
    _orderB.totalRemainingValue = _totalRemainingValueA;

    // Adjust heights
    _orderA.height = safeAdd (_height1, 1);
  }

  /**
   * Perform big tree rotation either left or right.
   * 
   *          Left
   *   A
   *  / \             C
   * 1   B          /   \
   *    / \  ==>   A     B
   *   C   4      / \   / \
   *  / \        1   2 3   4
   * 2   3
   * 
   *          Right
   *     A
   *    / \           C
   *   B   1        /   \
   *  / \    ==>   B     A
   * 4   C        / \   / \
   *    / \      4   3 2   1
   *   3   2
   *
   * @param _left true to rotate left, false to rotate right
   * @param _a node A
   * @param _orderA order A
   * @param _b node B
   * @param _orderB order B
   * @param _c node C
   * @param _orderC order C
   * @param _height1 height of subtree 1
   */
  function bigRotate (
    bool _left,
    address _a, Order storage _orderA,
    address _b, Order storage _orderB,
    address _c, Order storage _orderC,
    uint256 _height1) private {
    address subtree2 = _left ? _orderC.left : _orderC.right;
    Order storage subtree2Order;
    if (subtree2 != 0) subtree2Order = orders [subtree2];

    address subtree3 = _left ? _orderC.right : _orderC.left;
    Order storage subtree3Order;
    if (subtree3 != 0) subtree3Order = orders [subtree3];

    address subtree4 = _left ? _orderB.right: _orderB.left;

    // Adjust parents
    _orderC.parent = _orderA.parent;
    _orderA.parent = _c;
    _orderB.parent = _c;
    if (subtree2 != 0) subtree2Order.parent = _a;
    if (subtree3 != 0) subtree3Order.parent = _b;

    // Adjust links
    if (_left) {
      _orderC.left = _a;
      _orderC.right = _b;
      _orderA.right = subtree2;
      _orderB.left = subtree3;
    } else {
      _orderC.right = _a;
      _orderC.left = _b;
      _orderA.left = subtree2;
      _orderB.right = subtree3;
    }

    adjustAggregates (
      _orderA, _orderB, _orderC,
      subtree2 == 0 ? 0 : subtree2Order.totalRemainingAmount,
      subtree2 == 0 ? 0 : subtree2Order.totalRemainingValue,
      subtree3 == 0 ? 0 : subtree3Order.totalRemainingAmount,
      subtree3 == 0 ? 0 : subtree3Order.totalRemainingValue);

    adjustHeights (
      _orderA, _orderB, _orderC,
      _height1,
      subtree2 == 0 ? 0 : subtree2Order.height,
      subtree3 == 0 ? 0 : subtree3Order.height,
      subtree4 == 0 ? 0 : orders [subtree4].height);
  }

  /**
   * Adjust aggregates for orders A, B and C.after big rotation.
   *
   *   A
   *  / \             C
   * 1   B          /   \
   *    / \  ==>   A     B
   *   C   4      / \   / \
   *  / \        1   2 3   4
   * 2   3
   * 
   *          or
   *
   *     A
   *    / \           C
   *   B   1        /   \
   *  / \    ==>   B     A
   * 4   C        / \   / \
   *    / \      4   3 2   1
   *   3   2
   *
   * @param _orderA order A
   * @param _orderB order B
   * @param _orderC order C
   * @param _totalRemainingAmount2 total remaining amount of subtree 2
   * @param _totalRemainingValue2 total remaining value of subtree 2
   * @param _totalRemainingAmount3 total remaining amount of subtree 3
   * @param _totalRemainingValue3 total remaining value of subtree 3
   */
  function adjustAggregates (
    Order storage _orderA, Order storage _orderB, Order storage _orderC,
    uint256 _totalRemainingAmount2, uint256 _totalRemainingValue2,
    uint256 _totalRemainingAmount3, uint256 _totalRemainingValue3)
    private {
    uint256 _totalRemainingAmountA = _orderA.totalRemainingAmount;
    uint256 _totalRemainingValueA = _orderA.totalRemainingValue;
    _orderA.totalRemainingAmount = safeAdd (
      safeSub (_orderA.totalRemainingAmount, _orderB.totalRemainingAmount),
      _totalRemainingAmount2);
    _orderA.totalRemainingValue = safeAdd (
      safeSub (_orderA.totalRemainingValue, _orderB.totalRemainingValue),
      _totalRemainingValue2);
    _orderB.totalRemainingAmount = safeAdd (
      safeSub (_orderB.totalRemainingAmount, _orderC.totalRemainingAmount),
      _totalRemainingAmount3);
    _orderB.totalRemainingValue = safeAdd (
      safeSub (_orderB.totalRemainingValue, _orderC.totalRemainingValue),
      _totalRemainingValue3);
    _orderC.totalRemainingAmount = _totalRemainingAmountA;
    _orderC.totalRemainingValue = _totalRemainingValueA;
  }

  /**
   * Adjust heights or orders A, B and C after big rotation.
   *
   *       C              C
   *     /   \    or    /   \
   *   A       B      B       A
   *  / \     / \    / \     / \
   * 1   2   3   4  4   3   2   1
   *
   * @param _orderA order A to adjust height of
   * @param _orderB order B to adjust height of
   * @param _orderC order C to adjust height of
   * @param _height1 height of subtree 1
   * @param _height2 height of subtree 2
   * @param _height3 height of subtree 3
   * @param _height4 height of subtree 4
   */
  function adjustHeights (
    Order storage _orderA, Order storage _orderB, Order storage _orderC,
    uint256 _height1, uint256 _height2, uint256 _height3, uint256 _height4)
  private {
    _orderC.height = safeAdd (
      max (
        (_orderA.height = safeAdd (max (_height1, _height2), 1)),
        (_orderB.height = safeAdd (max (_height3, _height4), 1))),
      1);
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
   * Get height of tree node.
   *
   * @param _node tree node to get height of
   * @return height of the given tree node
   * 
   */
  function getHeight (address _node) private constant returns (uint256 height) {
    return _node == 0 ? 0 : orders [_node].height;
  }

  /**
   * Reference to a root order or zero is there are no orders.
   */
  address rootOrder;

  /**
   * Mapping from address of order creator to current order from this creator.
   */
  mapping (address => Order) orders;

  /**
   * Amount of assets sold so far.
   */
  uint256 soldAmount;

  /**
   * Pending refund (in Wei) for inactive orders.
   */
  uint256 pendingRefund = 0;

  /**
   * Encapsulates information about buy-side order.
   */
  struct Order {
    /**
     * Amount of assets to buy.
     */
    uint256 amount;

    /**
     * Price per asset unit (in Wei).
     */
    uint256 price;

    /**
     * Amount of assets already bought.
     */
    uint256 filledAmount;

    /**
     * Reference to parent order.
     */
    address parent;

    /**
     * Reference to left subtree.
     */
    address left;

    /**
     * Reference to right subtree.
     */
    address right;

    /**
     * Total remaining amount in a subtree whose root is this order.
     */
    uint256 totalRemainingAmount;

    /**
     * Total remaining value in a subtree whose root is this order.
     */
    uint256 totalRemainingValue;

    /**
     * Height of the subtree whose root is this order.
     */
    uint256 height;
  }

  /**
   * Logged when new order was placed.
   *
   * @param creator address of the creator of the new order
   * @param amount amount of the new order
   * @param price price of the new order
   */
  event OrderPlacement (
    address indexed creator, uint256 amount, uint256 price);

  /**
   * Logged when order was terminated.
   *
   * @param creator address of the creator of terminated order
   * @param filledAmount filled amount of the order
   */
  event OrderTermination (
    address indexed creator, uint256 filledAmount);
}
