/// <reference types="cypress" />
import { response } from 'express';
import './commands';
import {walletTransactionDetails} from '../../fixtures/walletTransaction.json'
import {transactionDetailsSameCurr} from '../../fixtures/walletDiffAmountSameCurrency.json'
describe('WalletAPI Transactions',()=>{
    //load the fixture
    cy.fixture('user.json').then(function(data){
        this.userdata = data;
    })
    //cy.fixture("walletTransaction").as('walletTranbody');
    //TC001_UserLogin_retrievetoken
    // Authenticating user and retrieving access token
    it('TC001,02:Authenticate user and get access token user Id,wallet ID',()=>{
        cy.loginByAuthApi(this.userdata.username,this.userdata.password)
        cy.window().then((window) => {
            const acces_token = window.localStorage.getItem('authToken');
            const user_id = window.localStorage.getItem('UserID');
            const walletId = window.localStorage.getItem('WalletID');
            cypress.set('authToken',acces_token);
            cypress.set('userId',user_id);
            cypress.set('walletId',wallet_Id);
          });
        
    })
    
    //Verify the wallet for Empty wallet Response
    //TC004_GetWalletInfo_NoTransactions
    it('TC004:Empty Wallet Response',()=>{
        cy.request({
            method: 'GET',
            url: Cypress.config().baseUrl+'/wallet/'+cypress.env('walletId'),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+Cypress.env('authToken')
            }
        }).then((response)=>{
            cy.log(JSON.stringify(response.body))
            expect(response.status).to.eq(200)
            expect(response.body).have.property('walletId',cypress.env('walletId'))
            expect(response.body.currencyclips).to.be.an('array');
            expect(response.body.currencyclips).to.have.length.eq(0) // check the array length is 0
        })
    }) 
    
    //transaction should not be processed if unauthorised pass some random bearer token
    it('TC003:unAuthorized/token expired',()=>{
        cy.request({
            method: 'POST',
            url: Cypress.config().baseUrl+'/wallet/'+cypress.env('walletId')+'/transaction',
            headers: {
                'Content-Type': 'application/json',
                'Authorization':  'Bearer '+Cypress.env('authToken')
            },
            body: {        
                "currency": walletTransactionDetails[0].currency,
                "amount": walletTransactionDetails[0].amount,
                "type": walletTransactionDetails[0].type

            }
        }).then((response)=>{
            expect(response.status).to.eq(401)
            expect(response.statusText).to.have('Unauthorized - Authentication required')
        })
    })

    
    //Process a transaction for a wallet
    //TC007_ProcessTransaction_immediateResponse
    //TC006_GetWalletInfo_AfterFirstTransaction
    it('TC006,07:process First transaction for the wallet',()=>{
        cy.request({
            method: 'POST',
            url: Cypress.config().baseUrl+'/wallet/'+cypress.env('walletId')+'/transaction',
            headers: {
                'Content-Type': 'application/json',
                'Authorization':  'Bearer '+Cypress.env('authToken')
            },
            body: {        
                "currency": walletTransactionDetails[0].currency,
                "amount": walletTransactionDetails[0].amount,
                "type": walletTransactionDetails[0].type

            }
        }).then((response)=>{
            cy.log(JSON.stringify(response.body))
            expect(response.status).eq(200)
            expect(response.body).have.property('transactionId')
            expect(response.body.transactionId).not.to.be.empty;
            expect(response.body).have.property('status','finished')
            expect(response.body).have.property('outcome','approved')
            }).then((response)=>{  //Get the transaction deatails with the transaction
                const transactionId = response.body.transactionId;
                cy.log("Transaction id is "+transactionId)
                //Get the transaction deatails with the transaction id
                cy.request({
                    method: 'GET',
                    url: Cypress.config().baseUrl+ '/wallet/'+cypress.env('walletId')+'/transaction/'+transactionId,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization':  'Bearer '+Cypress.env('authToken')
                    }
                })

            }).then((response)=>{
                cy.log(JSON.stringify(response.body))
                //verify the results are matching with the processed transaction
                expect(response.status).to.eq(200)
                expect(response.body).have.property('transactionId',transactionId)
                expect(response.body).have.property('currency',walletTransactionDetails[0].currency);
                expect(response.body).have.property('amount',walletTransactionDetails[0].amount);
                expect(response.body).have.property('type',walletTransactionDetails[0].type);
                expect(response.body).have.property('status','pending');
                expect(response.body).have.property('outcome','approved');
            })
        .then((response)=>{ //verify for the wallet after first transaction
            cy.request({
                method: 'GET',
                url: Cypress.config().baseUrl+'/wallet/'+cypress.env('walletId'),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization':  'Bearer '+Cypress.env('authToken')
                }
            }).then((response)=>{
                cy.log(JSON.stringify(response.body))
                expect(response.status).to.eq(200)
                expect(response.body).have.property('walletId',cypress.env('walletId'))
                expect(response.body.currencyclips).to.be.an('array');
                expect(response.body.currencyclips).to.have.length.eq(1) // check the array length is 1
                expect(response.body.currencyclips[0]).have.property('currency',walletTransactionDetails[0].currency)
                expect(response.body.currencyclips[0]).have.property('balance',walletTransactionDetails[0].amount)
                expect(response.body.currencyclips[0]).have.property('transactionCount','1')
            
            })
        })
    })

    
    //Process transaction for same currency multiple time with differnt amount
    //TC011_GetWalletInfo_multipleTransactions_withSameCurrency
    it('TC011:process transactions for the wallet',()=>{
        //process the transaction for each currency json from the input file
        let balance = 0;
        transactionDetailsSameCurr.array.forEach(element => {
                    
            cy.request({
                method: 'POST',
                url: Cypress.config().baseUrl+'/wallet/'+cypress.env('walletId')+'/transaction',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization':  'Bearer '+Cypress.env('authToken')
                },
                body: {        
                    "currency": element.currency,
                    "amount": element.amount,
                    "type": element.type

                }
            }).then((response)=>{
                cy.log(JSON.stringify(response.body))
                expect(response.status).eq(200)
                expect(response.body).have.property('transactionId')
                expect(response.body.transactionId).not.to.be.empty
                balance = balance+element.amount
            }).then((response)=>{
                const transactionId = response.body.transactionId;
                cy.log("Transaction id is "+transactionId)
                //Get the transaction deatails with the transaction id
                cy.request({
                    method: 'GET',
                    url: Cypress.config().baseUrl+'/wallet/'+cypress.env('walletId')+'/transaction/'+transactionId,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization':  'Bearer '+Cypress.env('authToken')
                    }
                }).then((response)=>{
                    cy.log(JSON.stringify(response.body))
                    //verify the results are matching with the processed transaction
                    expect(response.status).to.eq(200)
                    expect(response.body).have.property('transactionId',transactionId)
                    expect(response.body).have.property('currency',element.currency);
                    expect(response.body).have.property('amount',element.amount);
                    expect(response.body).have.property('type',element.type);
                })
            }).then((response)=>{ //verify the wallet after multiple transactions for same currencies
                cy.request({
                    method: 'GET',
                    url: Cypress.config().baseUrl+'/wallet/'+cypress.env('walletId'),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer '+Cypress.env('authToken')
                    }
                }).then((response)=>{
                    cy.log(JSON.stringify(response.body))
                    expect(response.status).to.eq(200)
                    expect(response.body).have.property('walletId',cypress.env('walletId'))
                    expect(response.body.currencyclips).to.be.an('array');
                    expect(response.body.currencyclips).to.have.length.eq(1) // check the array length is 1
                    expect(response.body.currencyclips[0]).have.property('currency',transactionDetailsSameCurr[0].currency)
                    //balance should be updated 
                    expect(response.body.currencyclips[0]).have.property('balance',balance)
                    expect(response.body.currencyclips[0]).have.property('transactionCount',transactionDetailsSameCurr.array.length)
                  
                })
            })
        })
    })

    //process the transaction for the other currency USD
    //TC008_ProcessTransaction_DelayedResponse
    //TC009_ProcessTransaction_TtansactionUpdate_beforeTimeout
    //TC0010_ProcessTransaction_TtansactionUpdate_Timeout
    //Assumption: Data is mocked such that the transactions for this currency is delayed for USD approved, EUR denied
    it('TC008_TC009_TC0010_ProcessTransaction_DelayedResponse',()=>{
        for(let i=1; i<walletTransactionDetails.length; i++)
        {
            cy.request({
                method: 'POST',
                url: Cypress.config().baseUrl+'/wallet/'+cypress.env('walletId')+'/transaction',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization':  'Bearer '+Cypress.env('authToken')
                },
                body: {        
                    "currency": walletTransactionDetails[i].currency,
                    "amount": walletTransactionDetails[i].amount,
                    "type": walletTransactionDetails[i].type
    
                }
            }).then((response)=>{
                cy.log(JSON.stringify(response.body))
                expect(response.status).eq(200)
                expect(response.body).have.property('transactionId')
                expect(response.body.transactionId).not.to.be.empty;
                expect(response.body).have.property('status','pending')
                expect(response.body).not.have.property('outcome','approved')
            }).then((response)=>{
                //wait for 30 mins and check for transaction update assuming received the approved response by then
                cy.wait(18000); 
                const transactionId = response.body.transactionId
                cy.log("Transaction id is "+transactionId)
                cy.request({
                    method: 'GET',
                    url: Cypress.config().baseUrl+ '/wallet/'+cypress.env('walletId')+'/transaction/'+transactionId,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization':  'Bearer '+Cypress.env('authToken')
                    }
                }).then((response)=>{
                    cy.log(JSON.stringify(response.body))
                    //verify the results are matching with the processed transaction
                    expect(response.status).to.eq(200)
                    expect(response.body).have.property('transactionId',transactionId)
                    expect(response.body).have.property('currency',walletTransactionDetails[i].currency);
                    expect(response.body).have.property('amount',walletTransactionDetails[i].amount);
                    expect(response.body).have.property('type',walletTransactionDetails[i].type);
                    expect(response.body).have.property('status','finished');
                    if(walletTransactionDetails[i].currency == 'EUR') //Data mocked for Deniel Response
                    {
                        expect(response.body).have.property('outcome','denied');
                    }
                    else
                    {
                        expect(response.body).have.property('outcome','finished');
                    }
                    
                })
            })
        }
        
    })

    //TC005_GetWalletInfo_multipleTransactions
    //verify the wallet for processed transactions
    it('TC005:check Wallet Response for different currencyclips',()=>{
        cy.request({
            method: 'GET',
            url: Cypress.config().baseUrl+'/wallet/'+cypress.env('walletId'),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+Cypress.env('authToken')
            }
        }).then((response)=>{
            cy.log(JSON.stringify(response.body))
            expect(response.status).to.eq(200)
            expect(response.body).have.property('walletId',cypress.env('walletId'))
           // let currencyClipsArray = response.body.currencyClips
            expect(response.body.currencyclips).to.be.an('array');
            expect(response.body.currencyclips).to.have.length.greaterThan(0) // check the array length > 0
            
        })
    }) 
})