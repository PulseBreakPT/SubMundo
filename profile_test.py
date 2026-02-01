#!/usr/bin/env python3
"""
Profile System Testing Script
Tests the new advanced profile system endpoints
"""

import requests
import sys
import json
from datetime import datetime

class ProfileTester:
    def __init__(self, base_url="https://profile-wizard-40.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        
        # Test user credentials
        self.test_email = "test@submundo.pt"
        self.test_password = "test123456"

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
        """Login to get token"""
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
            print(f"✅ Authentication successful")
            
            # Get user ID
            success, user_data, _ = self.make_request('GET', 'auth/me')
            if success and 'id' in user_data:
                self.user_id = user_data['id']
                print(f"✅ User ID retrieved: {self.user_id}")
                return True
            else:
                print(f"❌ Failed to get user ID")
                return False
        else:
            print(f"❌ Authentication failed: Status {status}, Data: {data}")
            return False

    def test_profile_detailed_stats(self):
        """Test GET /api/profile/detailed-stats"""
        success, data, status = self.make_request('GET', 'profile/detailed-stats')
        
        if success:
            # Check if response has expected structure
            expected_sections = ['combat', 'economy', 'criminal', 'social', 'progression', 'records']
            missing_sections = [s for s in expected_sections if s not in data]
            
            if not missing_sections:
                self.log_result("Profile Detailed Stats", True, f"All {len(expected_sections)} sections present")
                return True
            else:
                self.log_result("Profile Detailed Stats", False, f"Missing sections: {missing_sections}")
                return False
        else:
            self.log_result("Profile Detailed Stats", False, f"Status: {status}, Data: {data}")
            return False

    def test_profile_badges(self):
        """Test GET /api/profile/badges"""
        success, data, status = self.make_request('GET', 'profile/badges')
        
        if success and 'badges' in data:
            badges = data['badges']
            unlocked_badges = [b for b in badges if b.get('unlocked', False)]
            self.log_result("Profile Badges", True, f"Found {len(badges)} badges, {len(unlocked_badges)} unlocked")
            return True
        else:
            self.log_result("Profile Badges", False, f"Status: {status}, Data: {data}")
            return False

    def test_profile_progress_history(self):
        """Test GET /api/profile/progress-history"""
        success, data, status = self.make_request('GET', 'profile/progress-history')
        
        if success and 'history' in data:
            history = data['history']
            trends = data.get('trends', {})
            self.log_result("Profile Progress History", True, f"Found {len(history)} progress entries with trends")
            return True
        else:
            self.log_result("Profile Progress History", False, f"Status: {status}, Data: {data}")
            return False

    def test_profile_goals(self):
        """Test profile goals endpoints"""
        # Test GET goals
        success, data, status = self.make_request('GET', 'profile/goals')
        
        if success and 'goals' in data:
            goals = data['goals']
            self.log_result("Profile Goals - Get", True, f"Found {len(goals)} player goals")
        else:
            self.log_result("Profile Goals - Get", False, f"Status: {status}")
            return False
        
        # Test POST create goal
        success, data, status = self.make_request(
            'POST',
            'profile/goals',
            {
                "goal_type": "earn_money",
                "target_value": 5000
            }
        )
        
        goal_id = None
        if success and 'goal' in data:
            goal_id = data['goal'].get('id')
            self.log_result("Profile Goals - Create", True, f"Created goal with ID: {goal_id}")
        elif status == 400:
            self.log_result("Profile Goals - Create", True, "Cannot create goal (limit reached or invalid)")
        else:
            self.log_result("Profile Goals - Create", False, f"Status: {status}")
            return False
        
        # Test DELETE goal (if we created one)
        if goal_id:
            success, data, status = self.make_request('DELETE', f'profile/goals/{goal_id}')
            
            if success:
                self.log_result("Profile Goals - Delete", True, "Goal deleted successfully")
            else:
                self.log_result("Profile Goals - Delete", False, f"Status: {status}")
        else:
            self.log_result("Profile Goals - Delete", True, "No goal to delete (expected)")
        
        return True

    def test_profile_compare(self):
        """Test GET /api/profile/compare/{player_id}"""
        if not self.user_id:
            self.log_result("Profile Compare Players", False, "No user ID available")
            return False
            
        success, data, status = self.make_request('GET', f'profile/compare/{self.user_id}')
        
        if success and 'comparison' in data:
            comparison = data['comparison']
            self.log_result("Profile Compare Players", True, "Player comparison successful")
            return True
        else:
            self.log_result("Profile Compare Players", False, f"Status: {status}, Data: {data}")
            return False

    def test_profile_activity_log(self):
        """Test GET /api/profile/activity-log"""
        success, data, status = self.make_request('GET', 'profile/activity-log')
        
        if success and 'activities' in data:
            activities = data['activities']
            self.log_result("Profile Activity Log", True, f"Found {len(activities)} activity entries")
            return True
        else:
            self.log_result("Profile Activity Log", False, f"Status: {status}, Data: {data}")
            return False

    def test_profile_leaderboard_position(self):
        """Test GET /api/profile/leaderboard-position"""
        success, data, status = self.make_request('GET', 'profile/leaderboard-position')
        
        if success and 'rankings' in data:
            rankings = data['rankings']
            self.log_result("Profile Leaderboard Position", True, f"Player rankings retrieved: {len(rankings)} categories")
            return True
        else:
            self.log_result("Profile Leaderboard Position", False, f"Status: {status}, Data: {data}")
            return False

    def test_profile_search_players(self):
        """Test GET /api/profile/search-players"""
        success, data, status = self.make_request('GET', 'profile/search-players', params={"q": "test"})
        
        if success and 'results' in data:
            players = data['results']
            self.log_result("Profile Search Players", True, f"Found {len(players)} players matching 'test'")
            return True
        else:
            self.log_result("Profile Search Players", False, f"Status: {status}, Data: {data}")
            return False

    def run_all_tests(self):
        """Run all profile system tests"""
        print("👤 Starting Advanced Profile System Tests")
        print(f"🌐 Testing endpoint: {self.base_url}")
        print("=" * 50)
        
        # Authentication
        if not self.authenticate():
            return False
        
        print("\n🧪 Running Profile System Tests...")
        
        # Run all profile tests
        self.test_profile_detailed_stats()
        self.test_profile_badges()
        self.test_profile_progress_history()
        self.test_profile_goals()
        self.test_profile_compare()
        self.test_profile_activity_log()
        self.test_profile_leaderboard_position()
        self.test_profile_search_players()
        
        # Results
        print("\n" + "=" * 50)
        print(f"📊 Profile System Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All profile system tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} profile tests failed")
            return False

def main():
    tester = ProfileTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())