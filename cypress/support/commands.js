// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
Cypress.Commands.add('loginByAuthApi',(username, password) => {
        cy.request({
            method: 'POST',
            url: Cypress.config().baseUrl+'/user/login',
            headers: {
                'X-Service-Id': 'service123',
            },
            body: { 
                    "username": $username ,
                    "password": $password
                } 
        }).then((response)=>{
            expect(response.status).to.eq(200);
            expect(response.body).have.property('token');
            expect(response.body.token).not.to.be.empty;
            expect(response.body).have.property('userId');
            expect(response.body.userId).not.to.be.empty;
            window.localStorage.setItem('authToken', response.body.token);
            window.localStorage.setItem('UserID', response.body.userId);
            
        }).then((response)=>{
            cy.request({
                method: 'GET',
                url: Cypress.config().baseUrl+'/user/info/'+cypress.env('userId'),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+Cypress.env('auth_token')
                }
            }).then((response)=>{
                expect(response.status).to.eq(200);
                expect(response.body).have.property('walletId');
                expect(response.body.walletId).not.to.be.empty;
                window.localStorage.setItem('WalletID', response.body.walletId);
            })
        })
    }
      
)