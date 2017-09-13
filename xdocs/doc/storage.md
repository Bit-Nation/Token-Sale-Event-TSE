# PAT Token Sale Smart Contract: Storage

This file describes storage structure of PAT Token Sale smart contract.

## 1. rootOrder

### Signature

    address rootOrder;

### Description

Address of creator of the root order of order book or zero if order book is empty.

### Used in Use Cases

* Order:Place
* Order:PlacePresale
* Order:Terminate
* Order:Status
* Order:AmountForPrice
* Order:TotalSold
* Revenue:Outstanding
* Revenue:Collect

### Modified in Use Cases

* Order:Place
* Order:PlacePresale
* Order:Terminate

## 2. orders

### Signature

    mapping (address => Order) orders;
    struct Order {
      uint256 amount;
      uint256 price;
      uint256 filledAmount;
      address parent;
      address left;
      address right;
      uint256 totalRemainingAmount;
      uint256 totalRemainingValue;
      uint256 height;
    }

### Description

Maps addresses of order creators to their orders.
For each order the following information is stored:
* amount: unsettled order amount
* price: order price or zero if ether for the order was already settled
* filledAmount: filled amount or zero if tokens for the order were already settled
* parent: address of creator of parent order or zero if there is no parent order or this order is not in order book
* left: address of creator of left order or zero if there is no left order or this order is not in order book
* right: address of creator of right order or zero if there is no right order or this order is not in order book
* totalRemainingAmount: total remaining amount of a subtree whose root is this order, or zero if his order is not in order book
* totalRemainingValue: total remaining value of a subtree whose root is this order, or zero if his order is not in order book
* height: height of a subtree whose root is this order, or zero if his order is not in order book

### Used in Use Cases

* Order:Place
* Order:PlacePresale
* Order:Terminate
* Order:Status
* Order:AmountForPrice
* Order:TotalSold
* Revenue:Outstanding
* Revenue:Collect

### Modified in Use Cases

* Order:Place
* Order:PlacePresale
* Order:Terminate

## 3. soldAmount

### Signature

    uint256 soldAmount;

### Description

Number of tokens sold so far.

### Used in Use Cases

* Order:Place
* Order:PlacePresale
* Order:Terminate
* Order:Status
* Order:AmountForPrice
* Order:TotalSold
* Revenue:Outstanding
* Revenue:Collect

### Modified in Use Cases

* Order:Place
* Order:PlacePresale
* Order:Terminate

## 4. pendingRefund

### Signature

    uint256 pendingRefund = 0;

### Description

Total unsettled value of all orders that were removed from order book but was not settled yet.

### Used in Use Cases:

* Order:Terminate
* Revenue:Outstanding
* Revenue:Collect

### Modified in Use Cases

* Order:Terminate

## 5. owner

### Signature

    address private owner;

### Description

Address of the owner of smart contract.

### Used in Use Cases

* Revenue:Collect
* Adminitration:SetOwner

### Modified in Use Cases

* Administration:Deploy
* Adminitration:SetOwner

## 6. saleStartTime

### Signature

    uint256 private saleStartTime;

### Description

Sale start time

### Used in Use Cases

* Order:Place
* Order:PlacePresale
* Order:Terminate
* Order:Status
* Order:AmountForPrice
* Order:TotalSold
* Order:AmountToSellBy
* Revenue:Outstanding
* Revenue:Collect

### Modified in Use Cases

* Administration:Deploy

## 7. invitationSigner

### Signature

    address private invitationSigner;

### Description

Address of invitation signer.

### User in Use Cases

* Order:PlacePresale

### Modified in Use Cases

* Administration:Deploy

## 8. token

### Signature

    Token private token;

### Description

ERC20 smart contract that manages tokens to be sold.

### Used in Use Cases

* Order:Terminate

### Modified in Use Cases

* Administration:Deploy

## 9. centralBank

### Signature

  address private centralBank;

### Description

Address of central bank, i.e. address to transfer tokens from.

### Used in Use Cases

* Order:Terminate

### Modified in Use Cases

* Administration:Deploy
