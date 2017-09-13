/*
 * Test for Abstract Continuous Sale Smart Contract.
 * Copyright © 2017 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */

tests.push ({
  name: "AbstractContinuousSale",
  steps: [
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
    { name: "Alice deploys four Wallet contracts: Bob, Carol, Dave and Elly",
      body: function (test) {
        test.walletContract =
          loadContract ("Wallet");
        var walletCode =
          loadContractCode ("Wallet");

        personal.unlockAccount (test.alice, "");
        test.tx1 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas:3000000}).
          transactionHash;
        test.tx2 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas:3000000}).
          transactionHash;
        test.tx3 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas:3000000}).
          transactionHash;
        test.tx4 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas:3000000}).
          transactionHash;
      }},
    { name: "Make sure contracts were deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx1) &&
          web3.eth.getTransactionReceipt (test.tx2) &&
          web3.eth.getTransactionReceipt (test.tx3) &&
          web3.eth.getTransactionReceipt (test.tx4);
      },
      body: function (test) {
        miner.stop ();

        test.bob = getDeployedContract (
          "Bob",
          test.walletContract,
          test.tx1);
        test.carol = getDeployedContract (
          "Carol",
          test.walletContract,
          test.tx2);
        test.dave = getDeployedContract (
          "Dave",
          test.walletContract,
          test.tx3);
        test.elly = getDeployedContract (
          "Elly,",
          test.walletContract,
          test.tx4);
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
    { name: "Make sure contracts were deployed",
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
      }},
    { name: "Bob tries to place an order with zero price which is not allowed",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.placeOrder.getData (0),
          0,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx);

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderPlacement",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderPlacement,
          test.tx);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));
      }},
    { name: "Bob tries to place an order with zero amount which is not allowed",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.placeOrder.getData (13),
          0,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx);

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderPlacement",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderPlacement,
          test.tx);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));
      }},
    { name: "Bob tries to place an order with non-integer amount which is not allowed",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.placeOrder.getData (13),
          38,
          { from: test.alice, value: 38, gas: 1000000 });
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx);

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderPlacement",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderPlacement,
          test.tx);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));
      }},
    { name: "Bob places an order",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (13, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (13, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.placeOrder.getData (13),
          39,
          { from: test.alice, value: 39, gas: 1000000 });
      }},
    { name: "Make sure transaction succeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderPlacement",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderPlacement,
          test.tx,
          { creator: test.bob.address, amount: 3, price: 13 });

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 3, order [1]);
        assertBNEquals ("order.price", 13, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          3,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (13, 15)",
          3,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (13, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15));
      }},
    { name: "Bob tries to place an order but there is already order placed by him",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 3, order [1]);
        assertBNEquals ("order.price", 13, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          3,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (13, 15)",
          3,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (13, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.placeOrder.getData (11),
          22,
          { from: test.alice, value: 22, gas: 1000000 });
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx);

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderPlacement",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderPlacement,
          test.tx);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 3, order [1]);
        assertBNEquals ("order.price", 13, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          3,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (13, 15)",
          3,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (13, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15));
      }},
    { name: "Carol places an order",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.carol.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (12, 15)",
          3,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (12, 15));

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.placeOrder.getData (12),
          48,
          { from: test.alice, value: 48, gas: 1000000 });
      }},
    { name: "Make sure transaction succeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.carol.Result",
          test.carol,
          test.carol.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderPlacement",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderPlacement,
          test.tx,
          { creator: test.carol.address, amount: 4, price: 12 });

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.carol.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 4, order [1]);
        assertBNEquals ("order.price", 12, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (12, 15)",
          7,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (12, 15));
      }},
    { name: "Dave places an order",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.dave.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15));

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.placeOrder.getData (14),
          14,
          { from: test.alice, value: 14, gas: 1000000 });
      }},
    { name: "Make sure transaction succeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.dave.Result",
          test.dave,
          test.dave.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderPlacement",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderPlacement,
          test.tx,
          { creator: test.dave.address, amount: 1, price: 14 });

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.dave.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 1, order [1]);
        assertBNEquals ("order.price", 14, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15)",
          1,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15));
      }},
    { name: "Three more tokens assets become available for sale",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 3, order [1]);
        assertBNEquals ("order.price", 13, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.carol.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 4, order [1]);
        assertBNEquals ("order.price", 12, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.dave.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 1, order [1]);
        assertBNEquals ("order.price", 14, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          8,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (12, 15)",
          8,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (12, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (13, 15)",
          4,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (13, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15)",
          1,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (15, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (15, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          0,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          0,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          0,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        personal.unlockAccount (test.alice, "");
        test.tx = test.abstractContinuousSaleWrapper.sellMore (
          3,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 3, order [1]);
        assertBNEquals ("order.price", 13, order [2]);
        assertBNEquals ("order.filledAmount", 2, order [3]);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.carol.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 4, order [1]);
        assertBNEquals ("order.price", 12, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.dave.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 1, order [1]);
        assertBNEquals ("order.price", 14, order [2]);
        assertBNEquals ("order.filledAmount", 1, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          5,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (12, 15)",
          5,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (12, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (13, 15)",
          1,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (13, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (14, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (15, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (15, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));
      }},
    { name: "Elly tries to terminate order but there is no orders placed by her",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.elly.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          5,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        personal.unlockAccount (test.alice, "");
        test.tx = test.elly.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.terminateOrder.getData (),
          0,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded but not orders were terminated",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.elly.Result",
          test.elly,
          test.elly.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderTermination",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderTermination,
          test.tx);

        assertEvents (
          "test.abstractContinuousSaleWrapper.Send",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Send,
          test.tx);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.elly.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          5,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));
      }},
    { name: "Alice tells Bob to refuse payments",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.setAcceptsPayments (
          false,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Alice tells Carol to refuse payments",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.setAcceptsPayments (
          false,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Alice tells Dave to refuse payments",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.setAcceptsPayments (
          false,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Alice tells smart contract to not send assets",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.abstractContinuousSaleWrapper.setSendAssetsEnabled (
          false,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Bob terminates order but both assets and ether transfers were unsuccessfull",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 3, order [1]);
        assertBNEquals ("order.price", 13, order [2]);
        assertBNEquals ("order.filledAmount", 2, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          5,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.getPendingRefund ()",
          0,
          test.abstractContinuousSaleWrapper.getPendingRefund ());

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.terminateOrder.getData (),
          0,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded, order was terminated but wasn't removed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderTermination",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderTermination,
          test.tx,
          { creator: test.bob.address });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Send",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Send,
          test.tx);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 3, order [1]);
        assertBNEquals ("order.price", 13, order [2]);
        assertBNEquals ("order.filledAmount", 2, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          4,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.getPendingRefund ()",
          13,
          test.abstractContinuousSaleWrapper.getPendingRefund ());
      }},
    { name: "Carol terminates order but both assets and ether transfers were unsuccessfull",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.carol.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 4, order [1]);
        assertBNEquals ("order.price", 12, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          4,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.getPendingRefund ()",
          13,
          test.abstractContinuousSaleWrapper.getPendingRefund ());

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.terminateOrder.getData (),
          0,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded, order was terminated but wasn't removed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.carol.Result",
          test.carol,
          test.carol.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderTermination",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderTermination,
          test.tx,
          { creator: test.carol.address });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Send",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Send,
          test.tx);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.carol.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 4, order [1]);
        assertBNEquals ("order.price", 12, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.getPendingRefund ()",
          61,
          test.abstractContinuousSaleWrapper.getPendingRefund ());
      }},
    { name: "Alice tells Carol to accept payments",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.setAcceptsPayments (
          true,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Carol terminates order but assets transfers were unsuccessfull",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.carol.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 4, order [1]);
        assertBNEquals ("order.price", 12, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.getPendingRefund ()",
          61,
          test.abstractContinuousSaleWrapper.getPendingRefund ());

        assertBNEquals (
          "web3.eth.getBalance (test.carol.address)",
          0,
          web3.eth.getBalance (test.carol.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.terminateOrder.getData (),
          0,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.carol.Result",
          test.carol,
          test.carol.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderTermination",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderTermination,
          test.tx);

        assertEvents (
          "test.abstractContinuousSaleWrapper.Send",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Send,
          test.tx);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.carol.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.getPendingRefund ()",
          13,
          test.abstractContinuousSaleWrapper.getPendingRefund ());

        assertBNEquals (
          "web3.eth.getBalance (test.carol.address)",
          48,
          web3.eth.getBalance (test.carol.address));
      }},
    { name: "Dave terminates order but both assets and ether transfers were unsuccessfull",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.dave.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 1, order [1]);
        assertBNEquals ("order.price", 14, order [2]);
        assertBNEquals ("order.filledAmount", 1, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.getPendingRefund ()",
          13,
          test.abstractContinuousSaleWrapper.getPendingRefund ());

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.terminateOrder.getData (),
          0,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded, order was terminated but wasn't removed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.dave.Result",
          test.dave,
          test.dave.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderTermination",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderTermination,
          test.tx,
          { creator: test.dave.address });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Send",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Send,
          test.tx);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.dave.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 1, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 1, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.getPendingRefund ()",
          13,
          test.abstractContinuousSaleWrapper.getPendingRefund ());
      }},
    { name: "Bob terminates order again but both assets and ether transfers were again unsuccessfull",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 3, order [1]);
        assertBNEquals ("order.price", 13, order [2]);
        assertBNEquals ("order.filledAmount", 2, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.getPendingRefund ()",
          13,
          test.abstractContinuousSaleWrapper.getPendingRefund ());

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.terminateOrder.getData (),
          0,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded, order was terminated but wasn't removed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderTermination",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderTermination,
          test.tx);

        assertEvents (
          "test.abstractContinuousSaleWrapper.Send",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Send,
          test.tx);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 3, order [1]);
        assertBNEquals ("order.price", 13, order [2]);
        assertBNEquals ("order.filledAmount", 2, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.getPendingRefund ()",
          13,
          test.abstractContinuousSaleWrapper.getPendingRefund ());
      }},
    { name: "Alice tells Bob to accept payments",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.setAcceptsPayments (
          true,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Bob terminates order but assets transfer was unsuccessful",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 3, order [1]);
        assertBNEquals ("order.price", 13, order [2]);
        assertBNEquals ("order.filledAmount", 2, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "web3.eth.getBalance (test.abstractContinuousSaleWrapper.address)",
          53,
          web3.eth.getBalance (test.abstractContinuousSaleWrapper.address));

        assertBNEquals (
          "web3.eth.getBalance (test.bob.address)",
          60,
          web3.eth.getBalance (test.bob.address));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.getPendingRefund ()",
          13,
          test.abstractContinuousSaleWrapper.getPendingRefund ());

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.terminateOrder.getData (),
          0,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded, order was terminated but wasn't removed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderTermination",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderTermination,
          test.tx);

        assertEvents (
          "test.abstractContinuousSaleWrapper.Send",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Send,
          test.tx);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 2, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 2, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.getPendingRefund ()",
          0,
          test.abstractContinuousSaleWrapper.getPendingRefund ());

        assertBNEquals (
          "web3.eth.getBalance (test.abstractContinuousSaleWrapper.address)",
          40,
          web3.eth.getBalance (test.abstractContinuousSaleWrapper.address));

        assertBNEquals (
          "web3.eth.getBalance (test.bob.address)",
          73,
          web3.eth.getBalance (test.bob.address));
      }},
    { name: "Bob terminates order again but assets transfer was unsuccessful",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 2, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 2, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "web3.eth.getBalance (test.abstractContinuousSaleWrapper.address)",
          40,
          web3.eth.getBalance (test.abstractContinuousSaleWrapper.address));

        assertBNEquals (
          "web3.eth.getBalance (test.bob.address)",
          73,
          web3.eth.getBalance (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.terminateOrder.getData (),
          0,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded, order was terminated but wasn't removed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderTermination",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderTermination,
          test.tx);

        assertEvents (
          "test.abstractContinuousSaleWrapper.Send",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Send,
          test.tx);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 2, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 2, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "web3.eth.getBalance (test.abstractContinuousSaleWrapper.address)",
          40,
          web3.eth.getBalance (test.abstractContinuousSaleWrapper.address));

        assertBNEquals (
          "web3.eth.getBalance (test.bob.address)",
          73,
          web3.eth.getBalance (test.bob.address));
      }},
    { name: "Alice tells Bob to refuse payments",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.setAcceptsPayments (
          false,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Alice tells smart contract to allow sending assets",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.abstractContinuousSaleWrapper.setSendAssetsEnabled (
          true,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Dave terminates order but ether transfers were unsuccessfull",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.dave.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 1, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 1, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.getPendingRefund ()",
          0,
          test.abstractContinuousSaleWrapper.getPendingRefund ());

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.terminateOrder.getData (),
          0,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.dave.Result",
          test.dave,
          test.dave.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderTermination",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderTermination,
          test.tx);

        assertEvents (
          "test.abstractContinuousSaleWrapper.Send",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Send,
          test.tx,
          { _to: test.dave.address, _value: 1 });

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.dave.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.getPendingRefund ()",
          0,
          test.abstractContinuousSaleWrapper.getPendingRefund ());
      }},
    { name: "Bob tries to place an order but there is already order placed by him",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 2, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 2, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.placeOrder.getData (11),
          22,
          { from: test.alice, value: 22, gas: 1000000 });
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx);

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderPlacement",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderPlacement,
          test.tx);

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 2, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 2, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));
      }},
    { name: "Bob terminates order",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 2, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 2, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "web3.eth.getBalance (test.abstractContinuousSaleWrapper.address)",
          40,
          web3.eth.getBalance (test.abstractContinuousSaleWrapper.address));

        assertBNEquals (
          "web3.eth.getBalance (test.bob.address)",
          95,
          web3.eth.getBalance (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.terminateOrder.getData (),
          0,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded, order was terminated but wasn't removed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderTermination",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderTermination,
          test.tx);

        assertEvents (
          "test.abstractContinuousSaleWrapper.Send",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Send,
          test.tx,
          { _to: test.bob.address, _value: 2 });

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.bob.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "web3.eth.getBalance (test.abstractContinuousSaleWrapper.address)",
          40,
          web3.eth.getBalance (test.abstractContinuousSaleWrapper.address));

        assertBNEquals (
          "web3.eth.getBalance (test.bob.address)",
          95,
          web3.eth.getBalance (test.bob.address));
      }},
    { name: "Ten more tokens assets become available for sale",
      body: function (test) {
        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          3,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        personal.unlockAccount (test.alice, "");
        test.tx = test.abstractContinuousSaleWrapper.sellMore (
          10,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          13,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          3,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          40,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));
      }},
    { name: "Elly places an order",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.elly.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (10, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (10, 15));

        personal.unlockAccount (test.alice, "");
        test.tx = test.elly.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.placeOrder.getData (10),
          130,
          { from: test.alice, value: 130, gas: 1000000 });
      }},
    { name: "Make sure transaction succeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.elly.Result",
          test.elly,
          test.elly.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderPlacement",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderPlacement,
          test.tx,
          { creator: test.elly.address, amount: 13, price: 10 });

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.elly.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 13, order [1]);
        assertBNEquals ("order.price", 10, order [2]);
        assertBNEquals ("order.filledAmount", 10, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (10, 15)",
          3,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (10, 15));
      }},
    { name: "Elly terminates order",
      body: function (test) {
        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.elly.address, 15);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 13, order [1]);
        assertBNEquals ("order.price", 10, order [2]);
        assertBNEquals ("order.filledAmount", 10, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          13,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          13,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          140,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "web3.eth.getBalance (test.abstractContinuousSaleWrapper.address)",
          170,
          web3.eth.getBalance (test.abstractContinuousSaleWrapper.address));

        assertBNEquals (
          "web3.eth.getBalance (test.elly.address)",
          0,
          web3.eth.getBalance (test.elly.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.elly.execute (
          test.abstractContinuousSaleWrapper.address,
          test.abstractContinuousSaleWrapper.terminateOrder.getData (),
          0,
          { from: test.alice, value: 0, gas: 1000000 });
      }},
    { name: "Make sure transaction succeeded, order was terminated but wasn't removed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.elly.Result",
          test.elly,
          test.elly.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Result",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.abstractContinuousSaleWrapper.OrderTermination",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.OrderTermination,
          test.tx,
          { creator: test.elly.address });

        assertEvents (
          "test.abstractContinuousSaleWrapper.Send",
          test.abstractContinuousSaleWrapper,
          test.abstractContinuousSaleWrapper.Send,
          test.tx,
          { _to: test.elly.address, _value: 10 });

        var order = test.abstractContinuousSaleWrapper.orderStatus (
          test.elly.address, 15);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15)",
          0,
          test.abstractContinuousSaleWrapper.totalAmountForPrice (0, 15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.amountToSellBy (15)",
          13,
          test.abstractContinuousSaleWrapper.amountToSellBy (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.totalSold (15)",
          13,
          test.abstractContinuousSaleWrapper.totalSold (15));

        assertBNEquals (
          "test.abstractContinuousSaleWrapper.outstandingRevenue (15)",
          140,
          test.abstractContinuousSaleWrapper.outstandingRevenue (15));

        assertBNEquals (
          "web3.eth.getBalance (test.abstractContinuousSaleWrapper.address)",
          140,
          web3.eth.getBalance (test.abstractContinuousSaleWrapper.address));

        assertBNEquals (
          "web3.eth.getBalance (test.elly.address)",
          30,
          web3.eth.getBalance (test.elly.address));
      }}
  ]});
