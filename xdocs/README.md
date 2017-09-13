# PAT Token Sale Smart Contract #

Continuous Sale Auction for PAT Tokens.  Copyright © 2017 by ABDK Consulting.

**Author:** Mikhail Vladimirov <mikhail.vladimirov@gmail.com>

## How to Deploy ##

In order to deploy PAT Token Sale Smart Contract you need the following software
to be properly installed on your system:

1. Geth 1.6.5+ (https://geth.ethereum.org/)

Also, you need Ethereum node running on your system and synchronized with the
network.  If you do not have one, you may run it via one of the following
commands depending on whether you want to connect to PRODNET or TESTNET:

    geth
    geth --testnet

If you are running Ethereum node for the first time, you may also add "--fast"
flag to speed up initial synchronization:

    geth --fast
    geth --testnet --fast

Also you need at least one account in your node.  If you do not have any
accounts, you may create one using the following commands:

    geth attach
    > personal.newAccount ();
    > exit

It will ask you to choose passphrase and enter it twice, and it will output an
address of your new created account.

You will also need some ether on your primary account.

In order to deploy PAT Token Sale Smart Contract do the following:

1. Go to the directory containing deployment script, i.e. file named
   `PATTokenSaleDeploy.js`.
2. Attach to your local Ethereum node: `geth attach`
3. Set sale start time in format of UINX timestamp like this:
   `var saleStartTime = 1502525419;` (you may use this site to convert date and
   time into UNIX timestamp: http://www.unixtimestamp.com)
4. Set address of presale invitation signer like this:
   `var invitationSigner = "0xfe92a3cf1843b5ec7ccf27b2ae753fac1289fa9d";`
5. Set address of PAT token smart contract like this:
   `var token = "0x3d21504c2cd40264f6a931dd2c5f38674010ebf6";`
6. Set address of PAT token central bank (i.e. address to transfer tokens from)
   like this: `var centralBank = "0x5e1bc7f3e39e7d386369edf983296e33021c8348";`
7. Unlock your primary account:
   `personal.unlockAccount (web3.eth.accounts [0]);` (you will be
   asked for your passphrase here)
8. Run deployment script: `loadScript ("PATTokenSaleDeploy.js");`
9. If everything will go fine, after several seconds you will see message like
   the following: `Deployed at ... (tx: ...)`,
   which means that your contract was deployed (message shows address of the
   contract and hash of the transaction the contract was deployed by)
