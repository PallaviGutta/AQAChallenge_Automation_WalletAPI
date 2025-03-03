/// <reference types="cypress" />
describe('verify currency clips',()=>{
    //load the fixture to get the user name and password
    cy.fixture('user.json').then(function(data){
        this.userdata = data;
    })
     
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
        'Authorization': 'Bearer 3fa85f64-5717-4562-b3fc-2c963f66afa6'
        }
    //TC003_GetUserInfo_AuthorizationFailure
    //transaction should not be processed if unauthorised or expired, pass some random bearer token
    // passing invalid header
    it('TC003_GetUserInfo_AuthorizationFailure',()=>{
        cy.GetApi('/user/info'+cypress.env(userId)+',failOnStatusCode: false',cypress.env(headers)).then((response)=>{
            expect(response.status).to.eq(401)
            expect(response.statusText).to.have('Unauthorized - Authentication required')
        })

        
    })
})