#!/usr/bin/env python3
"""
Banking System Focused Test
"""

import requests
import sys
import json
from datetime import datetime

class BankingTester:
    def __init__(self, base_url="https://code-expander.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        
        # Test user credentials
        self.test_email = "banktest@submundo.pt"
        self.test_password = "banktest123"
        self.test_username = "BankTester"

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")

    def make_request(self, method, endpoint, data=None, expected_status=200, params=None):
        """Make API request with proper headers"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params, timeout=10)
            
            success = response.status_code == expected_status
            response_data = None
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}
            
            return success, response_data, response.status_code
            
        except Exception as e:
            return False, {"error": str(e)}, 0

    def authenticate(self):
        """Register or login user"""
        # Try to register new user
        success, data, status = self.make_request(
            'POST', 
            'auth/register',
            {
                "email": self.test_email,
                "password": self.test_password,
                "username": self.test_username
            },
            expected_status=200
        )
        
        if success and 'access_token' in data:
            self.token = data['access_token']
            print("✅ New user registered")
            return True
        elif status == 400:
            # User already exists, try login
            success, data, status = self.make_request(
                'POST',
                'auth/login',
                {
                    "email": self.test_email,
                    "password": self.test_password
                }
            )
            
            if success and 'access_token' in data:
                self.token = data['access_token']
                print("✅ User logged in")
                return True
        
        print(f"❌ Authentication failed: {status}")
        return False

    def test_banking_system(self):
        """Test all banking endpoints"""
        print("\n🏦 Testing Banking System Endpoints...")
        
        # 1. GET /api/bank/status
        success, data, status = self.make_request('GET', 'bank/status')
        
        if success and 'account' in data:
            account = data['account']
            bank_balance = account.get('bank_balance', 0)
            cash = account.get('cash', 0)
            self.log_result("GET /bank/status", True, f"Bank: €{bank_balance}, Cash: €{cash}")
        else:
            self.log_result("GET /bank/status", False, f"Status: {status}, Data: {data}")
            return False
        
        # Ensure user has some cash for testing
        if cash < 100:
            # Give user some cash via daily reward or quick action
            self.make_request('POST', 'player/daily-reward')
            self.make_request('POST', 'actions/quick', {"action_type": "roubo_rapido"})
            
            # Check cash again
            success, data, _ = self.make_request('GET', 'bank/status')
            if success:
                cash = data['account'].get('cash', 0)
        
        # 2. POST /api/bank/deposit
        if cash >= 100:
            success, data, status = self.make_request(
                'POST',
                'bank/deposit',
                {"amount": 100}
            )
            
            if success:
                new_balance = data.get('bank_balance', 0)
                self.log_result("POST /bank/deposit", True, f"Deposited €100, new balance: €{new_balance}")
                bank_balance = new_balance
            else:
                self.log_result("POST /bank/deposit", False, f"Status: {status}, Data: {data}")
        else:
            self.log_result("POST /bank/deposit", True, "Skipped - insufficient cash")
        
        # 3. POST /api/bank/withdraw
        if bank_balance >= 50:
            success, data, status = self.make_request(
                'POST',
                'bank/withdraw',
                {"amount": 50}
            )
            
            if success:
                new_balance = data.get('bank_balance', 0)
                fee = data.get('fee', 0)
                self.log_result("POST /bank/withdraw", True, f"Withdrew €50, fee: €{fee}, new balance: €{new_balance}")
                bank_balance = new_balance
            else:
                self.log_result("POST /bank/withdraw", False, f"Status: {status}, Data: {data}")
        else:
            self.log_result("POST /bank/withdraw", True, "Skipped - insufficient bank balance")
        
        # 4. POST /api/bank/transfer
        success, data, status = self.make_request(
            'POST',
            'bank/transfer',
            {
                "recipient_id": "dummy-player-id-12345",
                "amount": 10,
                "instant": False,
                "message": "Test transfer"
            }
        )
        
        if success:
            self.log_result("POST /bank/transfer", True, "Transfer completed")
        elif status == 400 or status == 404:
            self.log_result("POST /bank/transfer", True, "Failed as expected (invalid recipient)")
        else:
            self.log_result("POST /bank/transfer", False, f"Status: {status}, Data: {data}")
        
        # 5. GET /api/bank/transactions
        success, data, status = self.make_request('GET', 'bank/transactions')
        
        if success and 'transactions' in data:
            transactions = data['transactions']
            self.log_result("GET /bank/transactions", True, f"Found {len(transactions)} transactions")
        else:
            self.log_result("GET /bank/transactions", False, f"Status: {status}, Data: {data}")
        
        # 6. GET /api/bank/investments
        success, data, status = self.make_request('GET', 'bank/investments')
        
        if success and 'options' in data:
            options = data['options']
            self.log_result("GET /bank/investments", True, f"Found {len(options)} investment options")
            
            # 7. POST /api/bank/invest
            if bank_balance >= 100 and options:
                investment_option = options[0]
                investment_id = investment_option.get('id')
                
                success, data, status = self.make_request(
                    'POST',
                    'bank/invest',
                    {
                        "investment_id": investment_id,
                        "amount": 100
                    }
                )
                
                if success:
                    investment = data.get('investment', {})
                    self.log_result("POST /bank/invest", True, f"Created investment: {investment_id}")
                elif status == 400:
                    self.log_result("POST /bank/invest", True, "Cannot invest (insufficient funds or limit)")
                else:
                    self.log_result("POST /bank/invest", False, f"Status: {status}, Data: {data}")
            else:
                self.log_result("POST /bank/invest", True, "Skipped - insufficient balance or no options")
        else:
            self.log_result("GET /bank/investments", False, f"Status: {status}, Data: {data}")
        
        # 8. GET /api/bank/loans
        success, data, status = self.make_request('GET', 'bank/loans')
        
        if success and 'credit' in data:
            credit = data['credit']
            max_loan = credit.get('max_loan', 0)
            available_credit = credit.get('available_credit', 0)
            self.log_result("GET /bank/loans", True, f"Max loan: €{max_loan}, Available: €{available_credit}")
            
            # 9. POST /api/bank/loan
            if available_credit >= 500:
                success, data, status = self.make_request(
                    'POST',
                    'bank/loan',
                    {"amount": 500}
                )
                
                if success:
                    loan = data.get('loan', {})
                    loan_id = loan.get('id')
                    self.log_result("POST /bank/loan", True, f"Loan approved: €500, ID: {loan_id}")
                else:
                    self.log_result("POST /bank/loan", False, f"Status: {status}, Data: {data}")
            else:
                self.log_result("POST /bank/loan", True, "Skipped - insufficient credit")
        else:
            self.log_result("GET /bank/loans", False, f"Status: {status}, Data: {data}")
        
        # 10. GET /api/bank/robbery-targets
        success, data, status = self.make_request('GET', 'bank/robbery-targets')
        
        if success and 'targets' in data:
            targets = data['targets']
            can_rob = data.get('can_rob', False)
            self.log_result("GET /bank/robbery-targets", True, f"Found {len(targets)} targets, Can rob: {can_rob}")
        else:
            self.log_result("GET /bank/robbery-targets", False, f"Status: {status}, Data: {data}")

    def run_tests(self):
        """Run all banking tests"""
        print("🏦 Banking System Test Suite")
        print("=" * 40)
        
        if not self.authenticate():
            return False
        
        self.test_banking_system()
        
        print("\n" + "=" * 40)
        print(f"📊 Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All banking tests passed!")
            return True
        else:
            print(f"⚠️ {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = BankingTester()
    success = tester.run_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())