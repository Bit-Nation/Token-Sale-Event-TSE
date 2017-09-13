# PAT Token Sale Smart Contract: Functional Requirements

This document summarizes functional requirements for PAT Token Sale Smart
Contract.

## 1. Introduction

PAT Token Sale Smart Contract is an [Ethereum](https://ethereum.org/) smart contract that implements continuous sale auction for selling [PAT Tokens](https://github.com/Bit-Nation/Pangea-Arbitration-Token-and-ICO-Material).
PAT tokens become available for sale according to the schedule hardcoded in the smart contract.
Users may place their bids (a.k.a. buy-side orders), and once more PAT tokens become available for sale, they are used to fill the best existing order, i.e. the order with highest price or, in case there are several such orders, the one that was placed first.
User may terminate his order at any time.
When placing an order, user has to deposit full value of the order to the smart contract.
When order is terminated all settlements are made, i.e. if order was filled at least partially, PAT tokens are sent to the user, and if order was not completely filled, remaining funds are returned to the user.
In the first 48 hours of the sale, only users with personal invitations are allowed to place orders.
The following sections contain more details about the functionality of PAT Token Sale Smart Contract.

## 2. Sale Schedule

PAT Tokens are become available according to the following schedule:

Number of Tokens | Percentage of All Tokens | Time when tokens become available
---------------: | -----------------------: | --------------------------------------------------------------------------------
840,000,000      | 2%                       | instantly, 2 days after sale start
3,360,000,000    | 8%                       | gradually, during days 3 to 30 of sale
10,080,000,000   | 24%                      | gradually, during days 31 to 750 of sale

So, total number of tokens to be sold is 14,280,000,000.

## 3. Use Cases

This section describes use cases of PAT Token Sale Smart Contract.
The use cases are grouped into functional blocks.

### 3.1. Order Management Function Block

This section describes use cases related to managing bids, i.e. buy-side orders.

#### 3.1.1. Order:Place

**Actors:** _User_, _Smart Contract_

**Goal:** _User_ wants to place an order

##### Main Flow:

1. _User_ calls method on _Smart Contract_ providing the following information as method parameters: price per token; along with call _User_ sends certain amount of ether
2. There is no existing orders placed by _User_
3. Price is greater than zero
4. Amount of ether sent along with the call is greater than zero
5. Number of Wei sent along with the call is factor of price
6. At least 48 hours passed after sale start
7. _Smart Contract_ calculates order amount by dividing number of Wei sent along with the call by price
8. _Smart Contract_ uses tokens currently available for sale (if any) to (maybe partially) fill new order
9. _Smart Contract_ stores order in order book
10. _Smart Contract_ logs an event with the following information: address of _User_, order amount, order price
11. _Smart Contract_ return success indicator to _User_

##### Exceptional Flow 1:

1. Same as in Main Flow
2. There is an existing order placed by _User_
3. _Smart Contract_ reverts the transaction

##### Exceptional Flow 2:

1. Same as in Main Flow
2. Same as in Main Flow
3. Price is zero
4. _Smart Contract_ reverts the transaction

##### Exceptional Flow 3:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Amount of ether sent along with the call is zero
5. _Smart Contract_ reverts the transaction

##### Exceptional Flow 4:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Number of Wei sent along with the call is not factor of price
6. _Smart Contract_ reverts the transaction

##### Exceptional Flow 5:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Same as in Main Flow
6. 48 hours not yet passed after sale start
7. _Smart Contract_ reverts the transaction

#### 3.1.2. Order:PlacePresale

**Actors:** _User_, _Smart Contract_

**Goal:** _User_ wants to place an order before 48 hours passed since sale start

##### Main Flow:

1. _User_ calls method on _Smart Contract_ providing the following information as method parameters: price per token, invitation; along with call _User_ sends certain amount of ether
2. There is no existing orders placed by _User_
3. Price is greater than zero
4. Amount of ether sent along with the call is greater than zero
5. Number of Wei sent along with the call is factor of price
6. Sale already started
7. Provided invitation is valid for _User_
8. _Smart Contract_ calculates order amount by dividing number of Wei sent along with the call by price
9. _Smart Contract_ uses tokens currently available for sale (if any) to (maybe partially) fill new order
10. _Smart Contract_ stores order in order book
11. _Smart Contract_ logs an event with the following information: address of _User_, order amount, order price
12. _Smart Contract_ return success indicator to _User_

##### Exceptional Flow 1:

1. Same as in Main Flow
2. There is an existing order placed by _User_
3. _Smart Contract_ reverts the transaction

##### Exceptional Flow 2:

1. Same as in Main Flow
2. Same as in Main Flow
3. Price is zero
4. _Smart Contract_ reverts the transaction

##### Exceptional Flow 3:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Amount of ether sent along with the call is zero
5. _Smart Contract_ reverts the transaction

##### Exceptional Flow 4:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Number of Wei sent along with the call is not factor of price
6. _Smart Contract_ reverts the transaction

##### Exceptional Flow 5:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Same as in Main Flow
6. Sale isn't started yet
7. _Smart Contract_ reverts the transaction

##### Exceptional Flow 6:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Same as in Main Flow
6. Same as in Main Flow
7. Provided invitation is not valid for _User_
8. _Smart Contract_ reverts the transaction

#### 3.1.3. Order:Terminate

**Actors:** _User_, _Smart Contract_

**Goal:** _User_ wants to terminate his order

##### Main Flow:

1. _User_ calls method on _Smart Contract_
2. There is existing order placed by _User_
3. _Smart Contract_ removes order from order book if it was there
4. If order was in order book, _Smart Contract_ logs an event with the following information: address of _User_, filled amount of order
5. Order is filled partially
6. _Smart Contract_ sends tokens, bought by this order, to _User_
7. Token transfer succeeded
8. _Smart Contract_ sends remaining ether of this order to _User_
9. Ether transfer succeeded
10. _Smart Contract_ deletes order
11. _Smart Contract_ returns success indicator to _User_

##### Exceptional Flow 1:

1. Same as in Main Flow
2. There is no existing order placed by _User_
3. _Smart Contract_ returns error indicator to _User_

##### Exceptional Flow 2:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Order is not filled
6. _Smart Contract_ sends remaining ether of this order to _User_
7. Ether transfer succeeded
8. _Smart Contract_ deletes order
9. _Smart Contract_ returns success indicator to _User_

##### Exceptional Flow 3:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Same as in Exceptional Flow 2
6. Same as in Exceptional Flow 2
7. Ether transfer fails
8. _Smart Contract_ returns error indicator to _User_

##### Exceptional Flow 4:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Order is fully filled
6. _Smart Contract_ sends tokens, bought by this order, to _User_
7. Token transfer succeeded
8. _Smart Contract_ deletes order
9. _Smart Contract_ returns success indicator to _User_

##### Exceptional Flow 5:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Same as in Exceptional Flow 4
6. Same as in Exceptional Flow 4
7. Token transfer fails
8. _Smart Contract_ returns error indicator to _User_

##### Exceptional Flow 6:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Same as in Main Flow
6. Same as in Main Flow
7. Token transfer fails
8. Same as in Main Flow
9. Same as in Main Flow
10. _Smart Contract_ returns error indicator to _User_

##### Exceptional Flow 7:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Same as in Main Flow
6. Same as in Main Flow
7. Same as in Exceptional Flow 6
8. Same as in Main Flow
9. Ether transfer fails
10. _Smart Contract_ returns error indicator to _User_

##### Exceptional Flow 8:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Same as in Main Flow
6. Same as in Main Flow
7. Same as in Main Flow
8. Same as in Main Flow
9. Ether transfer fails
10. _Smart Contract_ returns error indicator to _User_

#### 3.1.4. Order:Status

**Actors:** _User_, _Smart Contract_

**Goal:** _User_ wants to know status of order placed by the owner of certain address

##### Main Flow:

1. _User_ calls constant method on _Smart Contract_ providing the following information as method parameters: address of order creator, current time
2. Order book does contain an order placed by the owner of given address
3. _Smart Contract_ return the following information to _User_: an indicator that order is in order book, amount, price and filled amount of the order

##### Exceptional Flow 1:

1. Same as in Main Flow
2. Order created by the owner of given address exists but is not in the order book and both token and ether transfers failed when the order was terminated
3. _Smart Contract_ return the following information to _User_: an indicator that order is not in order book, amount, price and filled amount of the order

##### Exception Flow 2:

1. Same as in Main Flow
2. Order created by the owner of given address exists but is not in the order book and token transfer failed when the order was terminated
3. _Smart Contract_ return the following information to _User_: an indicator that order is not in order book, filled amount of the order

##### Exception Flow 3:

1. Same as in Main Flow
2. Order created by the owner of given address exists but is not in the order book and ether transfer failed when the order was terminated
3. _Smart Contract_ return the following information to _User_: an indicator that order is not in order book, price and remaining amount of the order

#### 3.1.5. Order:AmountForPrice

**Actors:** _User_, _Smart Contract_

**Goal:** _User_ wants to know total remaining amount of all orders in order book whose price is greater than or equal to certain price

##### Main Flow:

1. _User_ calls constant method on _Smart Contract_ providing the following information as method parameters: price and current time
2. _Smart Contract_ return the following information to _User_: total remaining amount of all orders in order book whose price is greater than or equal to given price

#### 3.1.6. Order:TotalSold

**Actors:** _User_, _Smart Contract_

**Goal:** _User_ wants to know how many PAT tokens were sold so far

##### Main Flow:

1. _User_ calls constant method on _Smart Contract_ providing the following information as method parameters: current time
2. _Smart Contract_ returns the following information to _User_: number of PAT tokens sold so far

#### 3.1.7. Order:AmountToSellBy

**Actors:** _User_, _Smart Contract_

**Goal:** _User_ wants to know how many PAT tokens at most could be sold by certain time

##### Main Flow:

1. _User_ calls constant method on _Smart Contract_ providing the following information as method parameters: time to get maximum number of tokens to be sold by
2. _Smart Contract_ returns the following information to _User_: maximum number of tokens to be sold by given time

### 3.2. Revenue Management Functional Block

This section describes use cases related to managing revenue obtained from sale of PAT tokens.

#### 3.2.1. Revenue:Outstanding

**Actors:** _User_, _Smart Contract_

**Goal:** _User_ wants to know how much revenue might be withdrawn

##### Main Flow:

1. _User_ calls constant method on _Smart Contract_ providing the following information as method parameters: current time
2. _Smart Contract_ returns the following information to _User_: amount of revenue that might be withdrawn

#### 3.2.2. Revenue:Collect

**Actors:** _User_, _Smart Contract_

**Goal:** _User_ wants to collect revenue

##### Main Flow

1. _User_ calls method on _Smart Contract_
2. _User_ is the owner of _Smart Contract_
3. There is some revenue available for withdrawal
4. _Smart Contract_ sends revenue available for withdrawal to _User_
5. Revenue transferred successfully
6. _Smart Contract_ returns success indicator to _User_

##### Exceptional Flow 1:

1. Same as in Main Flow
2. _User_ is not the owner of _Smart Contract_
3. _Smart Contract_ reverts the transaction

##### Exceptional Flow 2:

1. Same as in Main Flow
2. Same as in Main Flow
3. There is no revenue available for withdrawal
4. _Smart Contract_ returns success indicator to _User_

##### Exceptional Flow 3:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Revenue transfer failed
6. _Smart Contract_ returns error indicator to _User_

### 3.3. Administration Functional Block

This section describes use cases related to smart contract deployment and administration.

#### 3.3.1. Administration:Deploy

**Actors:** _User_, _Smart Contract_

**Goal:** _User_ wants to deploy _Smart Contract_

##### Main Flow:

1. _User_ deploys _Smart Contract_ passing the following information as parameters of the constructor of _Smart Contract_: sale start time, address of invitation signer, address of PAT token smart contract, and address of PAT token central bank
2. Address of invitation sender is not zero
3. _Smart Contract_ remembers parameters passed to the constructor and makes _User_ to be the owner of _Smart Contract_

##### Exceptional Flow 1:

1. Same as in Main Flow
2. Address of invitation sender is zero
3. _Smart Contract_ reverts the transaction

#### 3.3.2. Administration:SetOwner

**Actors:** _User_, _Smart Contract_

**Goal:** _User_ wants to set new owner for _Smart Contract_

##### Main Flow:

1. _User_ calls method on _Smart Contract_ providing the following information as method parameters: address of new owner of _Smart Contract_
2. _User_ is the owner of _Smart Contract_
3. _Smart Contract_ remembers provided address as an address of the owenr of _Smart Contract_

##### Exceptional Flow 1:

1. Same as in Main Flow
2. _User_ is not the owner of _Smart Contract_
3. _Smart Contract_ cancels the transaction
