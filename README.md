<p align="center"><a href="https://gammaswap.com" target="_blank" rel="noopener noreferrer"><img width="100" src="https://gammaswap.com/assets/images/image02.png" alt="Gammaswap logo"></a></p>

<p align="center">
  <a href="https://github.com/gammaswap/governance/actions/workflows/pr.yml"><img src="https://github.com/gammaswap/governance/actions/workflows/pr.yml/badge.svg?branch=main" alt="Compile/Test">
</p>


On chain governance smart contracts for GammaSwap protocol

This implementation is using governance smart contracts from [OpenZeppelin](https://docs.openzeppelin.com/contracts/4.x/governance),
which are based on Compound Finance's governance model, which has become the industry standard.

### How does it work?

GS Token holders submit proposals through GammaSwapGovernor. Proposals can only be submitted by wallets holding PROPOSAL_THRESHOLD % of GS token supply

VOTING_DELAY blocks must pass before proposal becomes active for voting

GS Token holders then vote on proposals through GammaSwapGovernor. GS token holders have the option to delegate their votes to a different wallet.

The voting period ends after VOTING_PERIOD blocks have passed.

Proposal becomes eligible for execution if at least QUORUM_PERCENTAGE % of token supply has voted.

After voting period ends GovernanceTimeLock executes proposal after MIN_DELAY seconds have passed.

Setting of all parameters (PROPOSAL_THRESHOLD, VOTING_DELAY, VOTING_PERIOD, QUORUM_PERCENTAGE) can be found in helper-hardhat-config.ts

```bash
./helper-hardhat-config.ts
```

### How to deploy
Deployment of smart contracts is handled with [@wighawaag/hardhat-deploy](https://github.com/wighawag/hardhat-deploy)

If you don't set the --tags option it will runn all deployment scripts

To deploy production smart contracts (GS, GovernanceTimeLock, GammaSwapGovernor) and run set up script, run the following

```bash
npx hardhat --network [networkName] deploy --tags prod
```

To deploy all smart contracts (GS, GovernanceTimeLock, GammaSwapGovernor, TestContract) and run set up script, run the following

```bash
npx hardhat --network [networkName] deploy --tags all
```

### Deploy scripts

Below are the deployment scripts used to release the governance token, governor contract, and timelock contract which will serve to execute decentralized onchain governance

#### 01-deploy-governor-token.ts

Deploys GS smart contract which will serve as GammaSwap's governance token

```bash
npx hardhat --network [networkName] deploy --tags gs
```

#### 02-deploy-time-lock.ts

Deploys GovernanceTimeLock smart contract which will execute proposals submitted by the DAO. GovernanceTimeLock is deployed with the deployer
address having admin role over the GovernanceTimeLock contract.

```bash
npx hardhat --network [networkName] deploy --tags timelock
```

#### 03-deploy-governor-contract.ts

Deploys GammaSwapGovernor smart contract which will create proposals and allow GS token holders to vote on such proposals, as well
as count votes and queue them to be ready for execution by the GovernanceTimeLock contract.

```bash
npx hardhat --network [networkName] deploy --tags governor
```

#### 04-setup-governance-contract.ts

Sets up governance contracts ready for DAO. Which means all proposals will only be made by GammaSwapGovernor and 
the execution of those proposals can only be made by GovernanceTimeLock. That is, it calls timeLock as the deployer (admin role)
to grant the governance contract (GammaSwapGovernor) proposer role, it gives address zero executor role, which means anyone
can now call the GovernanceTimeLock contract to execute approved proposals, and it revokes the deployer's address admin role
on the GovernanceTimeLock contract, which means the deployer nor anyone else has control over the GovernanceTimeLock contract. 

```bash
npx hardhat --network [networkName] deploy --tags setup
```

### How to run a local node

To run a local node, run the following

```bash
npx hardhat node --tags none
```

