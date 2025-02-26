# AQAChallenge_WalletAPI
  This repository contains the Cypress automation framework for testing responses for Wallet REST API.
## Prerequisites
    Before running the tests, ensure you have the following installed:
    '•'	Node.js (v22.13.0)
    '•'	npm (v10.9.2)
## Setup and Installation
    '1.'	Clone the repository:
       '''git clone https://github.com/PallaviGutta/AQAChallenge_Automation_WalletAPI.git'''
    2. Install dependencies:
        ```npm init npm install cypress --save-dev```
    `3.` Update fixture file user.json with valid credentials.
## Assumptions
    `1.` API server is up and running.
    `2.` Third party services are up and running.
    `3.` Third party response data is mocked such that the transactions for the currency USD is delayed and approved, EUR is denied
## Running Tests in local
    `•`	Open the terminal
    `•`	Run the cypress test from command Prompt using command below 
       ```npx cypress run --spec cypress\e2e\APITesting\WalletAPI.cy.js```
## Test Cases
    The following test cases are implemented:
    `•`	User Authentication
    `•`	User Authentication failure
    `•`	Response from wallet when no transactions to display
    `•`	Response from wallet when multiple transactions with same currency goes to same pocket
    `•`	Response from wallet when multiple transactions with different currency clips
    `•`	First Transaction processing response 
    `•`	Balance verification when multiple transactions with same currency
    `•`	Transaction status and outcome for immediate response
    `•`	Transaction status and outcome for Delayed response before and after timeout
