/*
 * Monkey Test for Abstract Continuous Sale Smart Contract.
 * Copyright © 2017 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */

var WALLETS_COUNT = 20;
var STEPS_COUNT = 200;

var steps = [
  { name: "Ensure there is at least one account: Alice",
    body: function (test) {
      while (!web3.eth.accounts || web3.eth.accounts.length < 1)
        personal.newAccount ("");

      test.alice = web3.eth.accounts [0];
    }},
  { name: "Ensure Alice has at least 5 ETH",
    precondition: function (test) {
      miner.start ();
      return web3.eth.getBalance (test.alice).gte (web3.toWei ("5", "ether"));
    },
    body: function (test) {
      miner.stop ();
    }},
  { name: "Alice deploys " + WALLETS_COUNT + " Wallet contracts",
    body: function (test) {
      test.walletContract = loadContract ("Wallet");
      test.walletCode = loadContractCode ("Wallet");

      personal.unlockAccount (test.alice, "");
      test.tx = [];
      test.wallet = [];
    }},
  { name: "Make sure contracts were deployed",
    precondition: function (test) {
      for (var i = 0; i < test.tx.length; i++)
        if (!web3.eth.getTransactionReceipt (test.tx [i]))
          return false;

      miner.stop ();

      for (var i = 0; i < test.tx.length; i++)
        test.wallet.push (
          getDeployedContract (
            "Wallet #" + i, test.walletContract, test.tx [i]));

      if (test.wallet.length == WALLETS_COUNT)
        return true;
      else {
        console.log (test.wallet.length + " wallets deployed");
        test.tx = [];
        for (var i = 0; i < 10; i++)
          test.tx [i] = test.walletContract.new (
            {from: test.alice, data: test.walletCode, gas: 1000000 }).
            transactionHash;
        miner.start ();
      }
    },
    body: function (test) {
      assertEquals ("test.wallet.length", WALLETS_COUNT, test.wallet.length);
    }},
  { name: "Alice deploys AbstractContinuousSaleWrapper contract",
    body: function (test) {
      test.abstractContinuousSaleWrapperContract =
        loadContract ("AbstractContinuousSaleWrapper");
      var abstractContinuousSaleWrapperCode =
        loadContractCode ("AbstractContinuousSaleWrapper");

      personal.unlockAccount (test.alice, "");
      test.tx = test.abstractContinuousSaleWrapperContract.new (
        {from: test.alice, data: abstractContinuousSaleWrapperCode, gas:3000000}).
        transactionHash;
    }},
  { name: "Make sure contract was deployed",
    precondition: function (test) {
      miner.start ();
      return web3.eth.getTransactionReceipt (test.tx);
    },
    body: function (test) {
      miner.stop ();

      test.abstractContinuousSaleWrapper = getDeployedContract (
        "AbstractContinuousSaleWrapper",
        test.abstractContinuousSaleWrapperContract,
        test.tx);

      assert (
        "test.abstractContinuousSaleWrapper.checkOrderTree ()",
        test.abstractContinuousSaleWrapper.checkOrderTree ());

      for (var i = 0; i < WALLETS_COUNT; i++)
        test.walletAcceptsPayments [i] = true;
    }}
  ];

for (var i = 0; i < STEPS_COUNT; i++) {
  steps.push ({
    name: "Step #" + i,
    body: function (test) {
      if (Math.random () < 0.05) {
        var amount = Math.floor (
          Math.random () *
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 0) * 1.2);
        console.log ("Another " + amount + " assets become available for sale");
        test.tx = test.abstractContinuousSaleWrapper.sellMore (
          amount,
          { from: test.alice, gas: 1000000 });
        for (var j = test.orders.length - 1; j >= 0 && amount > 0; j--) {
          if (test.orders [j].active) {
            var delta = Math.min (
              amount, test.orders [j].amount - test.orders [j].filledAmount);
            test.orders [j].filledAmount += delta;
            amount -= delta;
            test.sold += delta;
            test.revenue += delta * test.orders [j].price;
          }
        }
        test.toSell += amount;
      } else {
        var wallet = Math.floor (Math.random () * WALLETS_COUNT);
        if (Math.random () < 0.1) {
          console.log ("Wallet #" + wallet + " refuses payments");
          personal.unlockAccount (test.alice, "");
          test.tx = test.wallet [wallet].setAcceptsPayments (
            false,
            { from: test.alice, gas: 1000000 });
          test.walletAcceptsPayments [wallet] = false;
        } else if (Math.random () < 0.1) {
          console.log ("Wallet #" + wallet + " accepts payments");
          personal.unlockAccount (test.alice, "");
          test.tx = test.wallet [wallet].setAcceptsPayments (
            true,
            { from: test.alice, gas: 1000000 });
          test.walletAcceptsPayments [wallet] = true;
        } else if (Math.random () < 0.5) {
          console.log ("Wallet #" + wallet + " terminates order");
          personal.unlockAccount (test.alice, "");
          test.tx = test.wallet [wallet].execute (
            test.abstractContinuousSaleWrapper.address,
            test.abstractContinuousSaleWrapper.terminateOrder.getData (),
            0,
            { from: test.alice, gas: 1000000 });
          for (var j = 0; j < test.orders.length; j++) {
            if (test.orders [j].wallet == wallet) {
              if (test.orders [j].amount == test.orders [j].filledAmount ||
                test.walletAcceptsPayments [wallet]) {
                test.orders.splice (j, 1);
              } else {
                test.orders [j].amount -= test.orders [j].filledAmount;
                test.orders [j].filledAmount = 0;
                test.orders [j].active = false;
              }
              break;
            }
          }
        } else {
          var amount = Math.floor (Math.random () * 10) + 1;
          var price = Math.floor (Math.random () * 30) + 1;
          console.log (
            "Wallet #" + wallet + " places order: " + amount + "@" + price);
          personal.unlockAccount (test.alice, "");
          test.tx = test.wallet [wallet].execute (
            test.abstractContinuousSaleWrapper.address,
            test.abstractContinuousSaleWrapper.placeOrder.getData (price),
            price * amount,
            { from: test.alice, value: price * amount, gas: 1000000 });
          var duplicate = false;
          for (var j = 0; j < test.orders.length; j++) {
            if (test.orders [j].wallet == wallet) {
              console.log ("Duplicate!");
              duplicate = true;
            }
          }
          if (!duplicate) {
            var index = test.orders.length - 1;
            while (index >= 0 && test.orders [index].price >= price) index--;
            var delta = Math.min (amount, test.toSell);
            test.orders.splice (
              index + 1, 0,
              { wallet: wallet, amount: amount, price: price,
                filledAmount: delta, active: true});
            test.toSell -= delta;
            test.sold += delta;
            test.revenue += delta * price;
          }
        }
      }
    }});
  steps.push ({
    name: "Check #" + i,
    precondition: function (test) {
      miner.start ();
      return web3.eth.getTransactionReceipt (test.tx);
    },
    body: function (test) {
      miner.stop ();

      assert (
        "test.abstractContinuousSaleWrapper.checkOrderTree ()",
        test.abstractContinuousSaleWrapper.checkOrderTree ());

      assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (0)",
          test.sold,
          test.abstractContinuousSaleWrapper.totalSold (0));

      assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (0)",
          test.revenue,
          test.abstractContinuousSaleWrapper.outstandingRevenue (0));

      var totalRemainingAmount = 0;
      for (var j = test.orders.length - 1; j >= 0; j--) {
        if (j == test.orders.length - 1 || test.orders [j].price != test.orders [j + 1].price)
          assertBNEquals (
            "test.abstractContinuousSaleWrapper.totalAmountForPrice (" + 
              (test.orders [j].price + 1) + ", 0)",
            totalRemainingAmount,
            test.abstractContinuousSaleWrapper.totalAmountForPrice (
              test.orders [j].price + 1, 0));

        if (test.orders [j].active) {
          totalRemainingAmount +=
            test.orders [j].amount - test.orders [j].filledAmount;
        }

        if (j == 0 || test.orders [j].price != test.orders [j - 1].price)
          assertBNEquals (
            "test.abstractContinuousSaleWrapper.totalAmountForPrice (" +
              test.orders [j].price + ", 0)",
            totalRemainingAmount,
            test.abstractContinuousSaleWrapper.totalAmountForPrice (
              test.orders [j].price, 0));
      }

      for (var j = 0; j < WALLETS_COUNT; j++) {
        var order = null;
        for (var k = 0; k < test.orders.length; k++) {
          if (test.orders [k].wallet == j) {
            order = test.orders [k];
            break;
          }
        }

        var orderStatus = test.abstractContinuousSaleWrapper.orderStatus (
          test.wallet [j].address, 0);

        if (order == null) {
          assertEquals ("orderState [0]", false, orderStatus [0]);
        } else {
          assertEquals ("orderState [0]", order.active, orderStatus [0]);
          assertBNEquals ("orderState [1]", order.amount, orderStatus [1]);
          assertBNEquals ("orderState [2]", order.price, orderStatus [2]);
          assertBNEquals ("orderState [3]", order.filledAmount, orderStatus [3]);
        }
      }
    }});
}

tests.push ({
  name: "AbstractContinuousSaleMonkey",
  steps: steps,
  orders: [],
  walletAcceptsPayments: [],
  toSell: 0,
  sold: 0,
  revenue: 0});
