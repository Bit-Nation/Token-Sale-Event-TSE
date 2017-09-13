# PAT Token Sale Smart Contract: API

This document describes public API of PAT Token Sale Smart Contract.

## 1. Constructors

### 1.1. PATTokenSale(uint256,address,Token,address)

#### Signature

    function PATTokenSale (
      uint256 _saleStartTime,
      address _invitationSigner,
      Token _token,
      address _centralBank)

#### Description

Create new PAT Token Sale smart contract with given sale start time `_saleStartTime` and given invitation signer address `_invitationSigner`.
The contract will sell ERC20 tokens managed by contract `_token` and will transfer tokens to buyers from given central bank address `_centralBank`.
Does not accept ether.

#### Use Cases

* Administration:Deploy

## 2. Methods

### 2.1. placeOrder(uint256)

#### Signature

    function placeOrder (uint256 _price)
    payable returns (bool success)

#### Description

Place order with given price `_price`.
Order amount is calculated by dividing `msg.value` by `_price`.
Order amount should be non-zero integer.
Returns `true` on success, reverts transaction on error.
May be called by anybody.

#### Use Cases

* Order:Place

### 2.2. placePresaleOrder(uint256,bytes)

#### Signature

    function placePresaleOrder (uint256 _price, bytes _invitation)
    payable returns (bool success)

#### Description

Place pre-sale order with given price `_price`.
Order amount is calculated by dividing `msg.value` by `_price`.
Order amount should be non-zero integer.
Invitation `_invitation` should be valid digital signature obtained by signing `msg.sender` address with private key of invitation signer.
Returns `true` on success, reverts transaction on error.
May be called by anybody.

#### Use Cases

* Order:PlacePresale

### 2.3. terminateOrder()

#### Signature

    function terminateOrder ()
    returns (bool success)

#### Description

Terminates order placed by `msg.sender` and performs all necessary settlements.
Returns `true` on success, `false` on error.
May be called by anybody.
Does not accept ether.

#### Use Cases

* Order:Terminate

### 2.4. orderStatus(address,uint256)

#### Signature

    function orderStatus (address _orderCreator, uint256 _currentTime)
    constant returns (
      bool active, uint256 amount, uint256 price, uint256 filledAmount)

#### Description

Get status of the order placed by the owner of address `_orderCreator`.
Returned valued have the following meaning:
* active: `true` if order is in order book, `false` otherwise
* amount: initial amount of order if order is in order book; otherwise: unsettled amount
* price: order price if order is in order book or ether settlement for order failed, zero otherwise
* filledAmount: filled amount of order if order is in order book or tokens settlement for order failed, zero otherwise
May be called by anybody.
Does not accept ether.

#### Use Cases

* Order:Status

### 2.5. totalAmountForPrice(uint256,uint256)

#### Signature

    function totalAmountForPrice (uint256 _price, uint256 _currentTime)
    constant returns (uint256 result)

#### Description

Get total remaining amount of all orders in order book with price that is greater of equal to the given price `_price`.
May be called by anybody.
Does not accept ether.

#### Use Cases

* Order:Order:AmountForPrice

### 2.6. totalSold(uint256)

#### Signature

    function totalSold (uint256 _currentTime)
    constant returns (uint256 result)

#### Description

Get total number of tokens sold so far.
May be called by anybody.
Does not accept ether.

#### Use Cases

* Order:Order:TotalSold

### 2.7. amountToSellBy(uint256)

#### Signature

    function amountToSellBy (uint256 _time)
    public constant returns (uint256 amount)

#### Description

Get maximum number of tokens that could be sold by given time `_time`.
May be called by anybody.
Does not accept ether.

#### Use Cases

* Order:AmountToSellBy

### 2.8. outstandingRevenue(uint256)

#### Signature

    function outstandingRevenue (uint256 _currentTime)
    constant returns (uint256 result)

#### Description

Get outstanding (i.e. not yet withdrawn) sale revenue in Wei.
May be called by anybody.
Does not accept ether.

#### Use Cases

* Revenue:Outstanding

### 2.9. collectRevenue()

#### Signature

    function collectRevenue ()
    returns (bool success)

#### Description

Send outstanding revenue to the owner of smart contract.
May be called only by the owner of smart contract.
Does not accept ether.

#### Use Cases

* Revenue:Collect

### 2.10. setOwner(address)

#### Signature

    function setOwner (address _newOwner)

#### Description

Set new owner of the smart contract to the owner of given adder `_newOwner`.
May be called only by the owner of smart contract.
Does not accept ether.

#### Use Cases

* Administration:SetOwner

## 3. Events

### 3.1. OrderPlacement(address indexed,uint256,uint256)

#### Signature

#### Description

#### Use Cases

* Order:Place
* Order:PlacePresale

### 3.2. OrderTermination(address indexed,uint256)

#### Signature

#### Description

#### Use Cases

* Order:Terminate
