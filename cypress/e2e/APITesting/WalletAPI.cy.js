/// <reference types="cypress" />
import { json } from 'express';
import {walletTransactionDetails} from '../../fixtures/walletTransaction.json'
import {transactionDetailsSameCurr} from '../../fixtures/walletDiffAmountSameCurrency.json'
describe('verify currency clips',()=>{
    //load the fixture to get the user name and password
    cy.fixture('user.json').then(function(data){
        this.userdata = data;
    })
    const baseUrl = Cypress.config().baseUrl;
    //TC001_UserLogin_retrievetoken
    //TC002_GetUserInfo_retrieveWalletId
    it('TC001_TC002_login and get the Wallet id',()=>{
       // calling the userlogin from commands.js and storing the acees token, user is and walleid in environment variables
       cy.loginByAuthApi(this.userdata.username,this.userdata.password)
       cy.window().then((window) => {
        const acces_token = window.localStorage.getItem('authToken')
        const user_id = window.localStorage.getItem('UserID')
        const wallet_Id = window.localStorage.getItem('WalletID')
        cypress.set('authToken',acces_token)
        cypress.set('userId',user_id)
        cypress.set('walletId',wallet_Id)
      })

    })

    let headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+Cypress.env('authToken')
    }
        

    //TC004_GetWalletInfo_NoTransactions
    //currencyClips property should have an empty array when no transactions are recorded.
    it('TC004_GetWalletInfo_NoTransactions',()=>{
        cy.GETApi(baseUrl+'/wallet/'+cypress.env('walletId'),headers).then((response)=>{
            cy.log(JSON.stringify(response.body))
            expect(response.status).to.eq(200)
            expect(response.body).have.property('walletId',cypress.env('walletId'))
            expect(response.body.currencyclips).to.be.an('array');
            expect(response.body.currencyclips).to.have.length.eq(0) // check the array length is 0
        })
    })

    //TC007_ProcessTransaction_immediateResponse
    //TC006_GetWalletInfo_AfterFirstTransaction
    //process the first transaction
    //Assumption: Expected and immediate resposnse from third paty API
    it('TC006_TC007_process first transaction and verify',()=>{
        resbody = {        
            "currency": walletTransactionDetails[0].currency,
            "amount": walletTransactionDetails[0].amount,
            "type": walletTransactionDetails[0].type

        }
        cy.POSTApi(baseUrl+'/wallet/'+cypress.env('walletId')+'/transaction',headers, JSON.parse(resbody)).then((response)=>{
            cy.log(JSON.stringify(response.body))
            //verify status and outcome for the processed transaction for immediate response
            expect(response.status).eq(200)
            expect(response.body).have.property('transactionId')
            expect(response.body.transactionId).not.to.be.empty;
            expect(response.body).have.property('status','finished')
            expect(response.body).have.property('outcome','approved')
            //call the get api with transaction id to read the processed transaction details: currenct,amount,type
            const transactionId = response.body.transactionId;
            cy.log("Transaction id is "+transactionId)
            cy.GETApi(baseUrl+ '/wallet/'+cypress.env('walletId')+'/transaction/'+transactionId,headers).then((response)=>{
                cy.log(JSON.stringify(response.body))
                //verify the results are matching with the processed transaction
                expect(response.status).to.eq(200)
                expect(response.body).have.property('transactionId',transactionId)
                expect(response.body).have.property('currency',walletTransactionDetails[0].currency);
                expect(response.body).have.property('amount',walletTransactionDetails[0].amount);
                expect(response.body).have.property('type',walletTransactionDetails[0].type);
                expect(response.body).have.property('status','finished');
                expect(response.body).have.property('outcome','approved');
            })

            //call the wallet Api to check the updated balance and currency clip with processed transaction
            cy.GETApi(baseUrl+'/wallet/'+cypress.env('walletId'),headers).then((response)=>{
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

    //Process transaction for multiple times for the same currency with different amounts
    //TC011_GetWalletInfo_multipleTransactions_withSameCurrency
    //Balance amount should get updated for the same currency clip with increased transaction count
    it('TC011_GetWalletInfo_multipleTransactions_withSameCurrency',()=>{
        let balance = 0;
        //input is imported and read from the json fixture
        //process the transaction for each currency json from the input file using for each loop
        transactionDetailsSameCurr.array.forEach(element => {
            //post call to process the transaction
            resbody = {        
                "currency": element.currency,
                "amount": element.amount,
                "type": element.type
    
            }
            cy.POSTApi(baseUrl+'/wallet/'+cypress.env('walletId')+'/transaction',headers, JSON.parse(resbody)).then((response)=>{
                cy.log(JSON.stringify(response.body))
                expect(response.status).eq(200)
                expect(response.body).have.property('transactionId')
                expect(response.body.transactionId).not.to.be.empty
                balance = balance+element.amount //balance should get added for each transaction
                //call the transaction api with transaction id to see currenct, amount and type are processed correctly
                const transactionId = response.body.transactionId;
                cy.log("Transaction id is "+transactionId)
                cy.GETApi(baseUrl+ '/wallet/'+cypress.env('walletId')+'/transaction/'+transactionId,headers).then((response)=>{
                    expect(response.status).to.eq(200)
                    expect(response.body).have.property('transactionId',transactionId)
                    expect(response.body).have.property('currency',element.currency);
                    expect(response.body).have.property('amount',element.amount);
                    expect(response.body).have.property('type',element.type);
                })

                //call the wallet get api to check balance and currency clip is properly updated
                cy.GETApi(baseUrl+'/wallet/'+cypress.env('walletId'),headers).then((response)=>{
                    expect(response.status).to.eq(200)
                    expect(response.body).have.property('walletId',cypress.env('walletId'))
                    expect(response.body.currencyclips).to.be.an('array');
                    expect(response.body.currencyclips).to.have.length.eq(1) // check the array length is 1
                    expect(response.body.currencyclips[0]).have.property('currency',transactionDetailsSameCurr[0].currency) 
                    expect(response.body.currencyclips[0]).have.property('balance',balance)
                    //transactionCount should be the no of currency json passed from input i.e length of array
                    expect(response.body.currencyclips[0]).have.property('transactionCount',transactionDetailsSameCurr.array.length)
                })
            })
        })
    })

    //process the transaction for the other currency USD
    //TC008_ProcessTransaction_DelayedResponse
    //TC009_ProcessTransaction_TtansactionUpdate_beforeTimeout
    //TC0010_ProcessTransaction_TtansactionUpdate_Timeout
    //Assumption: Data is mocked such that the transactions for this currency is delayed, for USD approved, EUR denied 
    //and no response received for CAD
    it('TC008_TC009_TC0010_ProcessTransaction_DelayedResponse',()=>{
        //processing from second currency data in the input
        for(let i=1; i<walletTransactionDetails.length; i++){
            resbody = {        
                "currency": walletTransactionDetails[i].currency,
                "amount": walletTransactionDetails[i].amount,
                "type": walletTransactionDetails[i].type

            }
            var arr = [];
            cy.POSTApi(baseUrl+'/wallet/'+cypress.env('walletId')+'/transaction',headers, JSON.parse(resbody)).then((response)=>{
                expect(response.status).to.be.eq(200)
                expect(response.body).have.property('transactionId')
                expect(response.body.transactionId).not.to.be.empty;
                //status should be pending for delayed response and no outcome property is received
                expect(response.body).have.property('status','pending')
                expect(response.body).not.have.property('outcome','approved')    
                //const transactionId = response.body.transactionId
                arr.push(response.body.transactionId)
               
            })
        }
         //wait for 30 mins and check for transaction update assuming received response by then
         cy.wait(1800000);  
         
         //call the get transaction api
         for(let i=1; i<walletTransactionDetails.length; i++){
            const transactionId = arr[i-1] //
            cy.log("Transaction id is "+transactionId)
            cy.GETApi(baseUrl+ '/wallet/'+cypress.env('walletId')+'/transaction/'+transactionId,headers).then((response)=>{
                expect(response.status).to.eq(200)
                expect(response.body).have.property('transactionId',transactionId)
                expect(response.body).have.property('currency',walletTransactionDetails[i].currency);
                expect(response.body).have.property('amount',walletTransactionDetails[i].amount);
                expect(response.body).have.property('type',walletTransactionDetails[i].type);
                expect(response.body).have.property('status','finished');
                if(walletTransactionDetails[i].currency == 'EUR') //Assumption EUR response denied
                {
                    expect(response.body).have.property('outcome','denied');
                }
                else if(walletTransactionDetails[i].currency == 'CAD') //Assumption no response received
                {
                    expect(response.body).have.property('outcome','denied');
                }
                else
                {
                    expect(response.body).have.property('outcome','finished');
                }
            })
         }
    })
     
     //TC005_GetWalletInfo_multipleTransactions
     it('TC005_GetWalletInfo_multipleTransactions',()=>{
        cy.GETApi(baseUrl+'/wallet/'+cypress.env('walletId'),headers).then((response)=>{
            expect(response.status).to.eq(200)
            expect(response.body).have.property('walletId',cypress.env('walletId'))
            expect(response.body.currencyclips).to.be.an('array');
            expect(response.body.currencyclips).to.have.length.greaterThan(0) // check the array length > 0
        })
     })
})