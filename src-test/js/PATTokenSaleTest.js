/*
 * Test for PAT Token Sale Smart Contract.
 * Copyright © 2017 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */

tests.push ({
  name: "PATTokenSale",
  steps: [
    { name: "Ensure there is at least three accounts: Alice, Bob and Carol",
      body: function (test) {
        while (!web3.eth.accounts || web3.eth.accounts.length < 3)
          personal.newAccount ("");

        test.alice = web3.eth.accounts [0];
        test.bob = web3.eth.accounts [1];
        test.carol = web3.eth.accounts [2];
      }},
    { name: "Ensure Alice has at least 5 ETH",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getBalance (test.alice).gte (web3.toWei ("5", "ether"));
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Alice deploys two Wallet contracts: Dave and Elly",
      body: function (test) {
        test.walletContract =
          loadContract ("Wallet");
        var walletCode =
          loadContractCode ("Wallet");

        personal.unlockAccount (test.alice, "");
        test.tx1 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas:1000000}).
          transactionHash;
        test.tx2 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas:1000000}).
          transactionHash;
      }},
    { name: "Make sure contracts were deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx1) &&
          web3.eth.getTransactionReceipt (test.tx2);
      },
      body: function (test) {
        miner.stop ();

        test.dave = getDeployedContract (
          "Dave",
          test.walletContract,
          test.tx1);

        test.elly = getDeployedContract (
          "Elly",
          test.walletContract,
          test.tx2);
      }},
    { name: "Alice deploys SimpleToken smart contract",
      body: function (test) {
        test.simpleTokenContract =
          loadContract ("SimpleToken");
        var simpleTokenContractCode =
          loadContractCode ("SimpleToken");

        personal.unlockAccount (test.alice, "");
        test.tx = test.simpleTokenContract.new (
          {from: test.alice, data: simpleTokenContractCode, gas:1000000}).
          transactionHash;
      }},
    { name: "Make sure contract was deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        test.simpleToken = getDeployedContract (
          "SimpleToken",
          test.simpleTokenContract,
          test.tx);
      }},
    { name: "Alice deploys PATTokenSaleWrapper contract: BeforeSale",
      body: function (test) {
        test.patTokenSaleWrapperContract =
          loadContract ("PATTokenSaleWrapper");
        var patTokenSaleWrapperCode =
          loadContractCode ("PATTokenSaleWrapper");

        var now = Math.floor (Date.now () / 1000);

        personal.unlockAccount (test.alice, "");
        test.tx = test.patTokenSaleWrapperContract.new (
          now + 24 * 60 * 60,
          test.bob,
          test.simpleToken.address,
          test.carol,
          {from: test.alice, data: patTokenSaleWrapperCode, gas:3000000}).
          transactionHash;
      }},
    { name: "Make sure contract was deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        test.beforeSale = getDeployedContract (
          "BeforeSale",
          test.patTokenSaleWrapperContract,
          test.tx);
      }},
    { name: "Alice deploys PATTokenSaleWrapper contract: PreSale",
      body: function (test) {
        test.patTokenSaleWrapperContract =
          loadContract ("PATTokenSaleWrapper");
        var patTokenSaleWrapperCode =
          loadContractCode ("PATTokenSaleWrapper");

        var now = Math.floor (Date.now () / 1000);

        personal.unlockAccount (test.alice, "");
        test.tx = test.patTokenSaleWrapperContract.new (
          now - 24 * 60 * 60,
          test.bob,
          test.simpleToken.address,
          test.carol,
          {from: test.alice, data: patTokenSaleWrapperCode, gas:3000000}).
          transactionHash;
      }},
    { name: "Make sure contract was deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        test.preSale = getDeployedContract (
          "PreSale",
          test.patTokenSaleWrapperContract,
          test.tx);
      }},
    { name: "Alice deploys PATTokenSaleWrapper contract: Sale",
      body: function (test) {
        test.patTokenSaleWrapperContract =
          loadContract ("PATTokenSaleWrapper");
        var patTokenSaleWrapperCode =
          loadContractCode ("PATTokenSaleWrapper");

        var now = Math.floor (Date.now () / 1000);
        test.saleStart = now - 72 * 60 * 60;

        personal.unlockAccount (test.alice, "");
        test.tx = test.patTokenSaleWrapperContract.new (
          now - 72 * 60 * 60,
          test.bob,
          test.simpleToken.address,
          test.carol,
          {from: test.alice, data: patTokenSaleWrapperCode, gas:3000000}).
          transactionHash;
      }},
    { name: "Make sure contract was deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        test.sale = getDeployedContract (
          "Sale",
          test.patTokenSaleWrapperContract,
          test.tx);

        assertBNEquals (
          "test.sale.amountToSellBy (test.saleStart - 1)",
          0,
          test.sale.amountToSellBy (test.saleStart - 1));

        assertBNEquals (
          "test.sale.amountToSellBy (test.saleStart)",
          0,
          test.sale.amountToSellBy (test.saleStart));

        assertBNEquals (
          "test.sale.amountToSellBy (test.saleStart + 2 * 24 * 60 * 60 - 1)",
          0,
          test.sale.amountToSellBy (test.saleStart + 2 * 24 * 60 * 60 - 1));

        assertBNEquals (
          "test.sale.amountToSellBy (test.saleStart + 2 * 24 * 60 * 60)",
          "840000000",
          test.sale.amountToSellBy (test.saleStart + 2 * 24 * 60 * 60));

        assertBNEquals (
          "test.sale.amountToSellBy (test.saleStart + 2 * 24 * 60 * 60 + 1)",
          "840001388",
          test.sale.amountToSellBy (test.saleStart + 2 * 24 * 60 * 60 + 1));

        assertBNEquals (
          "test.sale.amountToSellBy (test.saleStart + 30 * 24 * 60 * 60 - 1)",
          "4199998611",
          test.sale.amountToSellBy (test.saleStart + 30 * 24 * 60 * 60 - 1));

        assertBNEquals (
          "test.sale.amountToSellBy (test.saleStart + 30 * 24 * 60 * 60)",
          "4200000000",
          test.sale.amountToSellBy (test.saleStart + 30 * 24 * 60 * 60));

        assertBNEquals (
          "test.sale.amountToSellBy (test.saleStart + 30 * 24 * 60 * 60 + 1)",
          "4200000162",
          test.sale.amountToSellBy (test.saleStart + 30 * 24 * 60 * 60 + 1));

        assertBNEquals (
          "test.sale.amountToSellBy (test.saleStart + 750 * 24 * 60 * 60 - 1)",
          "14279999837",
          test.sale.amountToSellBy (test.saleStart + 750 * 24 * 60 * 60 - 1));

        assertBNEquals (
          "test.sale.amountToSellBy (test.saleStart + 750 * 24 * 60 * 60)",
          "14280000000",
          test.sale.amountToSellBy (test.saleStart + 750 * 24 * 60 * 60));

        assertBNEquals (
          "test.sale.amountToSellBy (test.saleStart + 750 * 24 * 60 * 60 + 1)",
          "14280000000",
          test.sale.amountToSellBy (test.saleStart + 750 * 24 * 60 * 60 + 1));

        assertBNEquals (
          "test.sale.amountToSellBy (test.saleStart + 750 * 24 * 60 * 60 + 1000000)",
          "14280000000",
          test.sale.amountToSellBy (test.saleStart + 750 * 24 * 60 * 60 + 1000000));
      }},
    { name: "Dave tries to place an order but sale didn't start yet",
      body: function (test) {
        var now = Math.floor (Date.now () / 1000);

        var order = test.beforeSale.orderStatus (test.dave.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.beforeSale.address,
          test.beforeSale.placeOrder.getData (10),
          100,
          {from: test.alice, value: 100, gas:1000000});
      }},
    { name: "Make sure order was not placed",
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
          { _value: false });

        assertEvents (
          "test.beforeSale.Result",
          test.beforeSale,
          test.beforeSale.Result,
          test.tx);

        assertEvents (
          "test.beforeSale.OrderPlacement",
          test.beforeSale,
          test.beforeSale.OrderPlacement,
          test.tx);

        var now = Math.floor (Date.now () / 1000);

        var order = test.beforeSale.orderStatus (test.dave.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);
      }},
    { name: "Dave tries to place an order but it is presale phase now",
      body: function (test) {
        var now = Math.floor (Date.now () / 1000);

        var order = test.beforeSale.orderStatus (test.dave.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.preSale.address,
          test.preSale.placeOrder.getData (10),
          100,
          {from: test.alice, value: 100, gas:1000000});
      }},
    { name: "Make sure order was not placed",
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
          { _value: false });

        assertEvents (
          "test.preSale.Result",
          test.preSale,
          test.preSale.Result,
          test.tx);

        assertEvents (
          "test.preSale.OrderPlacement",
          test.preSale,
          test.preSale.OrderPlacement,
          test.tx);

        var now = Math.floor (Date.now () / 1000);

        var order = test.preSale.orderStatus (test.dave.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);
      }},
    { name: "Dave places and order",
      body: function (test) {
        var now = Math.floor (Date.now () / 1000);

        var order = test.sale.orderStatus (test.dave.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.sale.address,
          test.sale.placeOrder.getData (10),
          100,
          {from: test.alice, value: 100, gas:1000000});
      }},
    { name: "Make sure order was placed",
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
          "test.sale.Result",
          test.sale,
          test.sale.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.sale.OrderPlacement",
          test.sale,
          test.sale.OrderPlacement,
          test.tx,
          { creator: test.dave.address, amount: 10, price: 10 });

        var now = Math.floor (Date.now () / 1000);

        var order = test.sale.orderStatus (test.dave.address, now);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 10, order [1]);
        assertBNEquals ("order.price", 10, order [2]);
        assertBNEquals ("order.filledAmount", 10, order [3]);
      }},
    { name: "Elly tries to place presale order but sale didn't start yet",
      body: function (test) {
        var now = Math.floor (Date.now () / 1000);

        var order = test.beforeSale.orderStatus (test.elly.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        personal.unlockAccount (test.alice, "");
        personal.unlockAccount (test.bob, "");
        test.tx = test.elly.execute (
          test.beforeSale.address,
          test.beforeSale.placePresaleOrder.getData (
            10, web3.eth.sign (test.bob, test.elly.address)),
          100,
          {from: test.alice, value: 100, gas:1000000});
      }},
    { name: "Make sure order was not placed",
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
          { _value: false });

        assertEvents (
          "test.beforeSale.Result",
          test.beforeSale,
          test.beforeSale.Result,
          test.tx);

        assertEvents (
          "test.beforeSale.OrderPlacement",
          test.beforeSale,
          test.beforeSale.OrderPlacement,
          test.tx);

        var now = Math.floor (Date.now () / 1000);

        var order = test.beforeSale.orderStatus (test.elly.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);
      }},
    { name: "Elly tries to place presale order but it is presale phase now and invitation is invalid",
      body: function (test) {
        var now = Math.floor (Date.now () / 1000);

        var order = test.preSale.orderStatus (test.elly.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        personal.unlockAccount (test.alice, "");
        personal.unlockAccount (test.bob, "");
        test.tx = test.elly.execute (
          test.preSale.address,
          test.preSale.placePresaleOrder.getData (
            10, web3.eth.sign (
              test.alice, test.elly.address)),
          100,
          {from: test.alice, value: 100, gas:1000000});
      }},
    { name: "Make sure order was not placed",
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
          { _value: false });

        assertEvents (
          "test.preSale.Result",
          test.preSale,
          test.preSale.Result,
          test.tx);

        assertEvents (
          "test.preSale.OrderPlacement",
          test.preSale,
          test.preSale.OrderPlacement,
          test.tx);

        var now = Math.floor (Date.now () / 1000);

        var order = test.preSale.orderStatus (test.elly.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);
      }},
    { name: "Elly places presale order during pre-sale phase",
      body: function (test) {
        var now = Math.floor (Date.now () / 1000);

        var order = test.preSale.orderStatus (test.elly.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        personal.unlockAccount (test.alice, "");
        personal.unlockAccount (test.bob, "");
        test.tx = test.elly.execute (
          test.preSale.address,
          test.preSale.placePresaleOrder.getData (
            10, web3.eth.sign (
              test.bob, test.elly.address)),
          100,
          {from: test.alice, value: 100, gas:1000000});
      }},
    { name: "Make sure order was placed",
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
          "test.preSale.Result",
          test.preSale,
          test.preSale.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.preSale.OrderPlacement",
          test.preSale,
          test.preSale.OrderPlacement,
          test.tx,
          { creator: test.elly.address, amount: 10, price: 10 });

        var now = Math.floor (Date.now () / 1000);

        var order = test.preSale.orderStatus (test.elly.address, now);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 10, order [1]);
        assertBNEquals ("order.price", 10, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);
      }},
    { name: "Elly tries to place presale order but invitation is invalid",
      body: function (test) {
        var now = Math.floor (Date.now () / 1000);

        var order = test.sale.orderStatus (test.elly.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        personal.unlockAccount (test.alice, "");
        personal.unlockAccount (test.bob, "");
        test.tx = test.elly.execute (
          test.sale.address,
          test.sale.placePresaleOrder.getData (
            10, web3.eth.sign (
              test.alice, test.elly.address)),
          100,
          {from: test.alice, value: 100, gas:1000000});
      }},
    { name: "Make sure order was not placed",
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
          { _value: false });

        assertEvents (
          "test.sale.Result",
          test.sale,
          test.sale.Result,
          test.tx);

        assertEvents (
          "test.sale.OrderPlacement",
          test.sale,
          test.sale.OrderPlacement,
          test.tx);

        var now = Math.floor (Date.now () / 1000);

        var order = test.sale.orderStatus (test.elly.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);
      }},
    { name: "Elly places presale order",
      body: function (test) {
        var now = Math.floor (Date.now () / 1000);

        var order = test.sale.orderStatus (test.elly.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);

        personal.unlockAccount (test.alice, "");
        personal.unlockAccount (test.bob, "");
        test.tx = test.elly.execute (
          test.sale.address,
          test.sale.placePresaleOrder.getData (
            10, web3.eth.sign (
              test.bob, test.elly.address)),
          100,
          {from: test.alice, value: 100, gas:1000000});
      }},
    { name: "Make sure order was placed",
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
          "test.sale.Result",
          test.sale,
          test.sale.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.sale.OrderPlacement",
          test.sale,
          test.sale.OrderPlacement,
          test.tx,
          { creator: test.elly.address, amount: 10, price: 10 });

        var now = Math.floor (Date.now () / 1000);

        var order = test.sale.orderStatus (test.elly.address, now);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 10, order [1]);
        assertBNEquals ("order.price", 10, order [2]);
        assertBNEquals ("order.filledAmount", 10, order [3]);
      }},
    { name: "Dave terminates order but tokens transfers are disabled",
      body: function (test) {
        var now = Math.floor (Date.now () / 1000);

        var order = test.sale.orderStatus (test.dave.address, now);
        assertEquals ("order.active", true, order [0]);
        assertBNEquals ("order.amount", 10, order [1]);
        assertBNEquals ("order.price", 10, order [2]);
        assertBNEquals ("order.filledAmount", 10, order [3]);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.sale.address,
          test.sale.terminateOrder.getData (),
          0,
          {from: test.alice, value: 0, gas:1000000});
      }},
    { name: "Make sure order was terminated but token transfer failed",
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
          "test.sale.OrderTermination",
          test.sale,
          test.sale.OrderTermination,
          test.tx,
          { creator: test.dave.address, filledAmount: 10 });

        assertEvents (
          "test.simpleToken.Transfer",
          test.simpleToken,
          test.simpleToken.Transfer,
          test.tx);

        var now = Math.floor (Date.now () / 1000);

        var order = test.sale.orderStatus (test.dave.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 10, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 10, order [3]);
      }},
    { name: "Alice enables token transfers",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.simpleToken.setTransfersEnabled (
          true,
          {from: test.alice, value: 0, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Dave terminates order",
      body: function (test) {
        var now = Math.floor (Date.now () / 1000);

        var order = test.sale.orderStatus (test.dave.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 10, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 10, order [3]);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.sale.address,
          test.sale.terminateOrder.getData (),
          0,
          {from: test.alice, value: 0, gas:1000000});
      }},
    { name: "Make sure tokens were transferred this time",
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
          "test.sale.OrderTermination",
          test.sale,
          test.sale.OrderTermination,
          test.tx);

        assertEvents (
          "test.simpleToken.Transfer",
          test.simpleToken,
          test.simpleToken.Transfer,
          test.tx,
          { _from: test.carol, _to: test.dave.address, _value: 10 });

        var now = Math.floor (Date.now () / 1000);

        var order = test.sale.orderStatus (test.dave.address, now);
        assertEquals ("order.active", false, order [0]);
        assertBNEquals ("order.amount", 0, order [1]);
        assertBNEquals ("order.price", 0, order [2]);
        assertBNEquals ("order.filledAmount", 0, order [3]);
      }},
    { name: "Dave tries to make Elly to be the owner of smart contract, but he is not the owner himself",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.sale.address,
          test.sale.setOwner.getData (test.elly.address),
          0,
          {from: test.alice, value: 0, gas:1000000});
      }},
    { name: "Make sure transaction failed",
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
          { _value: false });
      }},
    { name: "Alice makes Dave to be the owner of smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.sale.setOwner (
          test.dave.address,
          {from: test.alice, value: 0, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Dave makes Elly to be the owner of smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.sale.address,
          test.sale.setOwner.getData (test.elly.address),
          0,
          {from: test.alice, value: 0, gas:1000000});
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
      }},
    { name: "Dave tries to collect revenue but he is not the owner of smart contract",
      body: function (test) {
        var now = Math.floor (Date.now () / 1000);

        assertBNEquals (
          "test.sale.outstandingRevenue (now)",
          200,
          test.sale.outstandingRevenue(now));

        assertBNEquals (
          "web3.eth.getBalance (test.dave.address)",
          200,
          web3.eth.getBalance (test.dave.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.sale.address,
          test.sale.collectRevenue.getData (),
          0,
          {from: test.alice, value: 0, gas:1000000});
      }},
    { name: "Make sure transaction failed",
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
          { _value: false });

        assertEvents (
          "test.sale.Result",
          test.sale,
          test.sale.Result,
          test.tx);

        var now = Math.floor (Date.now () / 1000);

        assertBNEquals (
          "test.sale.outstandingRevenue (now)",
          200,
          test.sale.outstandingRevenue(now));

        assertBNEquals (
          "web3.eth.getBalance (test.dave.address)",
          200,
          web3.eth.getBalance (test.dave.address));
      }},
    { name: "Alice tells Elly to refuse payments",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.elly.setAcceptsPayments (
          false,
          {from: test.alice, value: 0, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Elly tries to collect revenue but she does not accept payments",
      body: function (test) {
        var now = Math.floor (Date.now () / 1000);

        assertBNEquals (
          "test.sale.outstandingRevenue (now)",
          200,
          test.sale.outstandingRevenue(now));

        assertBNEquals (
          "web3.eth.getBalance (test.elly.address)",
          300,
          web3.eth.getBalance (test.elly.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.elly.execute (
          test.sale.address,
          test.sale.collectRevenue.getData (),
          0,
          {from: test.alice, value: 0, gas:1000000});
      }},
    { name: "Make sure transaction succeeded but not",
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
          "test.sale.Result",
          test.sale,
          test.sale.Result,
          test.tx,
          { _value: false });

        var now = Math.floor (Date.now () / 1000);

        assertBNEquals (
          "test.sale.outstandingRevenue (now)",
          200,
          test.sale.outstandingRevenue(now));

        assertBNEquals (
          "web3.eth.getBalance (test.elly.address)",
          300,
          web3.eth.getBalance (test.elly.address));
      }},
    { name: "Alice tells Elly to accept payments",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.elly.setAcceptsPayments (
          true,
          {from: test.alice, value: 0, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Elly collects revenue",
      body: function (test) {
        var now = Math.floor (Date.now () / 1000);

        assertBNEquals (
          "test.sale.outstandingRevenue (now)",
          200,
          test.sale.outstandingRevenue(now));

        assertBNEquals (
          "web3.eth.getBalance (test.elly.address)",
          300,
          web3.eth.getBalance (test.elly.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.elly.execute (
          test.sale.address,
          test.sale.collectRevenue.getData (),
          0,
          {from: test.alice, value: 0, gas:1000000});
      }},
    { name: "Make sure transaction succeeded but not",
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
          "test.sale.Result",
          test.sale,
          test.sale.Result,
          test.tx,
          { _value: true });

        var now = Math.floor (Date.now () / 1000);

        assertBNEquals (
          "test.sale.outstandingRevenue (now)",
          0,
          test.sale.outstandingRevenue(now));

        assertBNEquals (
          "web3.eth.getBalance (test.elly.address)",
          500,
          web3.eth.getBalance (test.elly.address));
      }}
  ]});
